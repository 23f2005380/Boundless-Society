"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Loader2Icon, 
  SettingsIcon, 
  UsersIcon, 
  ShieldAlertIcon, 
  CheckCircle2Icon, 
  XCircleIcon,
  SaveIcon,
  PlusIcon,
  Trash2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  EditIcon,
  PlusCircleIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Trip {
  id: string;
  name: string;
  coordinators: any[];
  registrationOpen?: boolean;
  paymentOpen?: boolean;
  totalSeats?: number;
  predefinedGirlsThreshold?: number;
  femaleJoined?: number;
  totalJoined?: number;
  finalRosterSaved?: boolean;
  isCompleted?: boolean;
  description?: string;
  form?: { fields: any[] };
  fee?: number;
  consentFormTemplateUrl?: string;
}

interface Registration {
  id: string;
  email: string;
  uid: string;
  status: string;
  gender: string;
  submittedAt: string;
  formData: Record<string, string>;
  aadhaarVerified?: boolean;
  consentFormFileUrl?: string;
}

interface Concern {
  id: string;
  studentEmail: string;
  concernText: string;
  coordinatorEmail: string;
}

const FIELD_TYPES = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "radio", label: "Radio Options" },
  { value: "select", label: "Select List" },
  { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
  { value: "email", label: "Email" },
];

export default function SubmissionsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeConcernEmail, setActiveConcernEmail] = useState<string | null>(null);
  const [activeProfileReg, setActiveProfileReg] = useState<Registration | null>(null);

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState("registrations"); // "registrations" | "edit-event" | "create-event"

  // Quick Controls Form
  const [regOpen, setRegOpen] = useState(true);
  const [payOpen, setPayOpen] = useState(true);
  const [seats, setSeats] = useState(30);
  const [girlsQuota, setGirlsQuota] = useState(10);

  // Edit Event Form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCoordinators, setEditCoordinators] = useState<any[]>([]);
  const [editSeats, setEditSeats] = useState(30);
  const [editFields, setEditFields] = useState<any[]>([]);
  const [editFee, setEditFee] = useState(500);
  const [editConsentTemplate, setEditConsentTemplate] = useState("");

  // Create Event Form state
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createCoordinators, setCreateCoordinators] = useState<any[]>([
    { id: "c1", name: "", email: "" }
  ]);
  const [createSeats, setCreateSeats] = useState(30);
  const [createFields, setCreateFields] = useState<any[]>([
    { id: "1", name: "Full Name", type: "short_text", sortOrder: 0 },
    { id: "2", name: "Roll Number", type: "short_text", sortOrder: 1 },
    { id: "3", name: "Gender", type: "radio", options: ["Male", "Female", "Other"], sortOrder: 2 },
  ]);
  const [createFee, setCreateFee] = useState(500);
  const [createConsentTemplate, setCreateConsentTemplate] = useState("");

  // Fetch trips list
  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await fetch("/api/trip");
        if (res.ok) {
          const data = await res.json();
          setTrips(data.trips || []);
          if (data.trips && data.trips.length > 0) {
            setSelectedTripId(data.trips[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading trips:", err);
      }
    }
    loadTrips();
  }, []);

  // Fetch registrations and concerns for selected trip
  const fetchTripData = async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const regRes = await fetch(`/api/admin/registrations?tripId=${selectedTripId}`);
      const concernsRes = await fetch(`/api/coordinator/concerns?tripId=${selectedTripId}`);
      
      if (regRes.ok && concernsRes.ok) {
        const regData = await regRes.json();
        const concernsData = await concernsRes.json();
        setRegistrations(regData.registrations || []);
        setConcerns(concernsData.concerns || []);
      }

      // Load specific trip metadata
      const tripMatch = trips.find((t) => t.id === selectedTripId);
      if (tripMatch) {
        setSelectedTrip(tripMatch);
        setRegOpen(tripMatch.registrationOpen !== false);
        setPayOpen(tripMatch.paymentOpen !== false);
        setSeats(tripMatch.totalSeats || 30);
        setGirlsQuota(tripMatch.predefinedGirlsThreshold || 10);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load registration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTripId) {
      fetchTripData();
    }
  }, [selectedTripId, trips]);

  // Lock background scroll when modals are open
  useEffect(() => {
    if (activeProfileReg || activeConcernEmail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeProfileReg, activeConcernEmail]);

  const handleDeleteConcern = async (concernId: string) => {
    if (!confirm("Are you sure you want to delete this concern flag?")) return;
    try {
      const res = await fetch(`/api/coordinator/concerns?id=${concernId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Concern flag deleted successfully!");
        fetchTripData();
        const remaining = concerns.filter(
          (c) => c.id !== concernId && c.studentEmail.toLowerCase() === activeConcernEmail?.toLowerCase()
        );
        if (remaining.length === 0) {
          setActiveConcernEmail(null);
        }
      } else {
        toast.error("Failed to delete concern flag.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  const handleVerifyAadhaar = async (regId: string) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, aadhaarVerified: true }),
      });

      if (res.ok) {
        toast.success("Aadhaar verified successfully!");
        fetchTripData();
        if (activeProfileReg && activeProfileReg.id === regId) {
          setActiveProfileReg({
            ...activeProfileReg,
            aadhaarVerified: true,
          });
        }
      } else {
        toast.error("Failed to verify Aadhaar.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  const handleConsentTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    try {
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileObj);
      });

      toast.loading("Uploading consent form template...", { id: "upload-template" });

      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [base64File],
          folder: "consent_templates",
        }),
      });

      const data = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const fileUrl = data.images[0].secure_url || data.images[0];
      if (isEdit) {
        setEditConsentTemplate(fileUrl);
      } else {
        setCreateConsentTemplate(fileUrl);
      }
      toast.success("Consent form template uploaded successfully!", { id: "upload-template" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload template.", { id: "upload-template" });
    }
  };

  // Update quick controls
  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          registrationOpen: regOpen,
          paymentOpen: payOpen,
          totalSeats: Number(seats),
          predefinedGirlsThreshold: Number(girlsQuota),
        }),
      });

      if (res.ok) {
        toast.success("Event controls updated successfully!");
        const updatedTrips = trips.map((t) => {
          if (t.id === selectedTripId) {
            return {
              ...t,
              registrationOpen: regOpen,
              paymentOpen: payOpen,
              totalSeats: Number(seats),
              predefinedGirlsThreshold: Number(girlsQuota),
            };
          }
          return t;
        });
        setTrips(updatedTrips);
      } else {
        toast.error("Failed to update controls.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Complete and Archive Event
  const handleCompleteEvent = async () => {
    if (!selectedTripId) return;
    if (!confirm("Are you sure you want to mark this event as completed? This will archive the roster, close registration & payment, and remove user access to register.")) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          isCompleted: true,
        }),
      });

      if (res.ok) {
        toast.success("Event marked as completed & archived!");
        const updatedTrips = trips.map((t) => {
          if (t.id === selectedTripId) {
            return {
              ...t,
              isCompleted: true,
              finalRosterSaved: true,
              registrationOpen: false,
              paymentOpen: false,
            };
          }
          return t;
        });
        setTrips(updatedTrips);
      } else {
        toast.error("Failed to complete event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Trip Handler
  const handleDeleteTrip = async () => {
    if (!selectedTripId) return;
    if (!confirm("Are you sure you want to delete this event completely? This action cannot be undone.")) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trip?id=${selectedTripId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Event deleted successfully!");
        const remaining = trips.filter((t) => t.id !== selectedTripId);
        setTrips(remaining);
        if (remaining.length > 0) {
          setSelectedTripId(remaining[0].id);
        } else {
          setSelectedTripId("");
          setSelectedTrip(null);
          setRegistrations([]);
        }
      } else {
        toast.error("Failed to delete the event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Change individual registration status
  const handleStatusChange = async (regId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`Registration status set to: ${nextStatus}`);
        fetchTripData();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------------------------------------------
  // Edit Form Fields Builders
  // ----------------------------------------------------
  const addEditField = () => {
    setEditFields([
      ...editFields,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        type: "short_text",
        options: [],
        sortOrder: editFields.length,
      },
    ]);
  };

  const updateEditField = (id: string, key: string, value: any) => {
    setEditFields(
      editFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const removeEditField = (id: string) => {
    setEditFields(editFields.filter((f) => f.id !== id));
  };

  const moveEditField = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= editFields.length) return;
    const copy = [...editFields];
    const temp = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = temp;
    setEditFields(copy.map((f, idx) => ({ ...f, sortOrder: idx })));
  };

  // Edit Coordinators Builder
  const addEditCoordinator = () => {
    setEditCoordinators([
      ...editCoordinators,
      { id: Math.random().toString(36).substr(2, 9), name: "", email: "" }
    ]);
  };

  const updateEditCoordinator = (id: string, key: string, value: string) => {
    setEditCoordinators(
      editCoordinators.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  };

  const removeEditCoordinator = (id: string) => {
    setEditCoordinators(editCoordinators.filter((c) => c.id !== id));
  };

  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/trip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          name: editName,
          description: editDesc,
          coordinators: editCoordinators.map((c) => ({
            name: c.name.trim(),
            email: c.email.trim(),
          })).filter((c) => c.name && c.email),
          totalSeats: Number(editSeats),
          formFields: editFields,
          fee: Number(editFee),
          consentFormTemplateUrl: editConsentTemplate,
        }),
      });

      if (res.ok) {
        toast.success("Event details and registration form saved successfully!");
        
        const tripRes = await fetch("/api/trip");
        if (tripRes.ok) {
          const tripData = await tripRes.json();
          setTrips(tripData.trips || []);
        }
        setActiveTab("registrations");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Create Form Fields Builders
  // ----------------------------------------------------
  const addCreateField = () => {
    setCreateFields([
      ...createFields,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        type: "short_text",
        options: [],
        sortOrder: createFields.length,
      },
    ]);
  };

  const updateCreateField = (id: string, key: string, value: any) => {
    setCreateFields(
      createFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const removeCreateField = (id: string) => {
    setCreateFields(createFields.filter((f) => f.id !== id));
  };

  const moveCreateField = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= createFields.length) return;
    const copy = [...createFields];
    const temp = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = temp;
    setCreateFields(copy.map((f, idx) => ({ ...f, sortOrder: idx })));
  };

  // Create Coordinators Builder
  const addCreateCoordinator = () => {
    setCreateCoordinators([
      ...createCoordinators,
      { id: Math.random().toString(36).substr(2, 9), name: "", email: "" }
    ]);
  };

  const updateCreateCoordinator = (id: string, key: string, value: string) => {
    setCreateCoordinators(
      createCoordinators.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  };

  const removeCreateCoordinator = (id: string) => {
    setCreateCoordinators(createCoordinators.filter((c) => c.id !== id));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          description: createDesc,
          coordinators: createCoordinators.map((c) => ({
            name: c.name.trim(),
            email: c.email.trim(),
          })).filter((c) => c.name && c.email),
          totalSeats: Number(createSeats),
          femaleReservedSeats: 0,
          releasedSeats: 0,
          releasedSeatsType: "all",
          formFields: createFields,
          fee: Number(createFee),
          consentFormTemplateUrl: createConsentTemplate,
        }),
      });

      if (res.ok) {
        toast.success("New event created successfully!");
        
        const tripRes = await fetch("/api/trip");
        if (tripRes.ok) {
          const tripData = await tripRes.json();
          setTrips(tripData.trips || []);
          if (tripData.trips && tripData.trips.length > 0) {
            setSelectedTripId(tripData.trips[0].id);
          }
        }
        setActiveTab("registrations");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create event.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4 space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📋 Registration Control Panel</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage attendees, approval gating, and payment thresholds.</p>
        </div>

        {/* Trip Dropdown Selector */}
        {trips.length > 0 && activeTab !== "create-event" && (
          <div className="w-64">
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background text-sm font-semibold"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("registrations")}
          className={`pb-2 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "registrations" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UsersIcon className="w-4 h-4" /> Registrations & Controls
        </button>
        <button
          onClick={() => {
            if (selectedTrip) {
              setEditName(selectedTrip.name);
              setEditDesc(selectedTrip.description || "");
              
              // Map coordinators (strings to objects backward compatible)
              const coords = (selectedTrip.coordinators || []).map((c: any, idx: number) => {
                if (typeof c === "object" && c !== null) {
                  return { id: c.id || String(idx), name: c.name || "", email: c.email || "" };
                }
                return { id: String(idx), name: "", email: String(c) };
              });
              setEditCoordinators(coords);

              setEditSeats(selectedTrip.totalSeats || 30);
              setEditFields(selectedTrip.form?.fields || []);
              setEditFee(selectedTrip.fee !== undefined ? selectedTrip.fee : 500);
              setEditConsentTemplate(selectedTrip.consentFormTemplateUrl || "");
            }
            setActiveTab("edit-event");
          }}
          disabled={!selectedTripId}
          className={`pb-2 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            !selectedTripId ? "opacity-50 cursor-not-allowed" : ""
          } ${
            activeTab === "edit-event" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <EditIcon className="w-4 h-4" /> Edit Selected Event & Form
        </button>
        <button
          onClick={() => {
            setCreateName("");
            setCreateDesc("");
            setCreateCoordinators([{ id: "c1", name: "", email: "" }]);
            setCreateSeats(30);
            setCreateFields([
              { id: "1", name: "Full Name", type: "short_text", sortOrder: 0 },
              { id: "2", name: "Roll Number", type: "short_text", sortOrder: 1 },
              { id: "3", name: "Gender", type: "radio", options: ["Male", "Female", "Other"], sortOrder: 2 },
            ]);
            setActiveTab("create-event");
          }}
          className={`pb-2 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "create-event" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <PlusCircleIcon className="w-4 h-4" /> Create New Event
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "registrations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Event Controls settings */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-4 h-fit">
            <h2 className="font-bold text-sm flex items-center gap-1.5 uppercase text-muted-foreground">
              <SettingsIcon className="w-4 h-4" /> Trip Settings
            </h2>
            
            <form onSubmit={handleSaveControls} className="space-y-4">
              {/* Registrations Open switch */}
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold">Registration Status</span>
                <button
                  type="button"
                  onClick={() => setRegOpen(!regOpen)}
                  className={`text-xs font-black px-3 py-1 rounded border transition ${
                    regOpen ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {regOpen ? "OPEN" : "CLOSED"}
                </button>
              </div>

              {/* Payments Open switch */}
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold">Payment Gating</span>
                <button
                  type="button"
                  onClick={() => setPayOpen(!payOpen)}
                  className={`text-xs font-black px-3 py-1 rounded border transition ${
                    payOpen ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {payOpen ? "PAYMENTS ENABLED" : "PAYMENTS CLOSED"}
                </button>
              </div>

              {/* Total Seats input */}
              <div>
                <label className="block text-xs font-bold mb-1.5">Total Seats Cap</label>
                <input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-background text-sm"
                />
              </div>

              {/* Girls Priority Threshold input */}
              <div>
                <label className="block text-xs font-bold mb-1.5">Girls Priority Threshold</label>
                <input
                  type="number"
                  min={0}
                  value={girlsQuota}
                  onChange={(e) => setGirlsQuota(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-background text-sm"
                  placeholder="Number of girls who must pay before boys pay"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Payment locks for boys until this number of girls have paid.
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full text-xs py-2 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5 shadow">
                <SaveIcon className="w-3.5 h-3.5" /> {submitting ? "Saving..." : "Save Event Controls"}
              </Button>
            </form>

            {selectedTrip && (
              <div className="pt-2">
                <Button
                  variant="destructive"
                  className="w-full text-xs"
                  disabled={submitting}
                  onClick={handleDeleteTrip}
                >
                  Delete Event Completely
                </Button>
              </div>
            )}

            {/* Roster Auto-Save Status Badge */}
            {selectedTrip && (
              <div className="space-y-3 pt-4 border-t-2 border-dashed border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Roster Compilation:</span>
                  <span className={`font-black px-2 py-0.5 rounded border uppercase text-[10px] ${
                    selectedTrip.isCompleted || selectedTrip.finalRosterSaved 
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}>
                    {selectedTrip.isCompleted || selectedTrip.finalRosterSaved ? "Completed / Archived ✅" : "Active / Live"}
                  </span>
                </div>

                {(!selectedTrip.isCompleted && !selectedTrip.finalRosterSaved) && (
                  <Button
                    onClick={handleCompleteEvent}
                    disabled={submitting}
                    className="w-full text-xs bg-indigo-900 hover:bg-indigo-800 text-white flex items-center justify-center gap-1.5 shadow"
                  >
                    Complete & Archive Event
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Registrations Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base flex items-center gap-1.5 text-muted-foreground">
                <UsersIcon className="w-4 h-4" /> Registration Entries ({registrations.length})
              </h2>
              <div className="flex gap-4 text-xs font-bold text-muted-foreground">
                <span>Paid (Seats Count): {selectedTrip?.totalJoined || 0} / {selectedTrip?.totalSeats || 0}</span>
                <span>Paid Girls: {selectedTrip?.femaleJoined || 0}</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-semibold">
                <Loader2Icon className="animate-spin mr-2" /> Fetching submissions...
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-xl text-muted-foreground text-sm font-semibold bg-muted/10">
                No registration submissions found for this trip.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Aadhaar Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Coordinators Flag</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => {
                      const studentFlags = concerns.filter((c) => c.studentEmail === reg.email);
                      return (
                        <TableRow key={reg.id} className="hover:bg-muted/50 transition">
                          <TableCell>
                            <div className="font-semibold text-sm">{reg.email}</div>
                            <button
                              onClick={() => setActiveProfileReg(reg)}
                              className="text-[10px] text-indigo-900 font-black underline hover:text-indigo-800 mt-1 block"
                            >
                              View Full Profile & Files ↗
                            </button>
                          </TableCell>
                          <TableCell className="capitalize text-xs font-semibold">{reg.gender}</TableCell>
                          
                          {/* Aadhaar Status */}
                          <TableCell>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                              reg.aadhaarVerified 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {reg.aadhaarVerified ? "Verified ✅" : "Unverified ❌"}
                            </span>
                          </TableCell>

                          {/* Documents Access */}
                          <TableCell>
                            <div className="flex flex-col gap-1 text-[10px]">
                              {reg.formData?.["Aadhaar Card Copy"] ? (
                                <a
                                  href={reg.formData["Aadhaar Card Copy"]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-muted px-2 py-1 rounded border hover:bg-muted/80 text-foreground font-semibold flex items-center justify-between gap-1 w-28 text-[9px] text-left"
                                >
                                  🪪 Aadhaar Copy ↗
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic text-[9px]">No Aadhaar Copy</span>
                              )}
                              {reg.formData?.["Completed Consent Form"] ? (
                                <a
                                  href={reg.formData["Completed Consent Form"]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-muted px-2 py-1 rounded border hover:bg-muted/80 text-foreground font-semibold flex items-center justify-between gap-1 w-28 text-[9px] text-left"
                                >
                                  📝 Signed Consent ↗
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic text-[9px]">No Consent Form</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                              reg.status === "paid" ? "bg-green-100 text-green-700 border-green-200" :
                              reg.status === "approved_to_pay" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                              reg.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                              "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}>{reg.status}</span>
                          </TableCell>
                          <TableCell>
                            {studentFlags.length > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100 flex items-center gap-1.5 font-semibold"
                                onClick={() => setActiveConcernEmail(reg.email)}
                              >
                                <ShieldAlertIcon className="w-3.5 h-3.5" /> View Flags ({studentFlags.length})
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No concerns</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!selectedTrip?.isCompleted ? (
                              <div className="flex justify-end gap-1.5">
                                {reg.status === "registered" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!reg.aadhaarVerified}
                                    title={!reg.aadhaarVerified ? "Aadhaar must be verified first" : "Approve Payment"}
                                    className="text-xs px-2.5 py-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleStatusChange(reg.id, "approved_to_pay")}
                                  >
                                    <CheckCircle2Icon className="w-3.5 h-3.5 mr-1" /> Approve Payment
                                  </Button>
                                )}

                                {reg.status !== "paid" && reg.status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-2.5 py-1 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                    onClick={() => handleStatusChange(reg.id, "rejected")}
                                  >
                                    <XCircleIcon className="w-3.5 h-3.5 mr-1" /> Decline
                                  </Button>
                                )}

                                {reg.status === "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-2.5 py-1 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                    onClick={() => handleStatusChange(reg.id, "registered")}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic font-semibold">No Actions (Archived)</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Selected Event Tab */}
      {activeTab === "edit-event" && selectedTripId && (
        <form onSubmit={handleSaveEventDetails} className="space-y-6 max-w-4xl bg-muted/20 p-6 rounded-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Event Name</label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Coorg Exploration 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Seating Capacity</label>
              <Input
                type="number"
                required
                min={1}
                value={editSeats}
                onChange={(e) => setEditSeats(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dashed">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Registration Fee (INR)</label>
              <Input
                type="number"
                required
                min={0}
                value={editFee}
                onChange={(e) => setEditFee(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Consent Form Template (PDF/Doc)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleConsentTemplateChange(e, true)}
                  className="cursor-pointer"
                />
                {editConsentTemplate && (
                  <a
                    href={editConsentTemplate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-900 underline shrink-0"
                  >
                    View File ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Enter trip highlights and itineraries..."
              className="w-full p-2.5 text-sm border rounded bg-background focus:outline-none"
            />
          </div>

          {/* Edit Coordinators Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-muted-foreground uppercase">Trip Coordinators</label>
              <Button type="button" size="sm" onClick={addEditCoordinator} className="bg-indigo-900 text-white hover:bg-indigo-800">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Coordinator
              </Button>
            </div>
            
            <div className="space-y-3">
              {editCoordinators.map((c) => (
                <div key={c.id} className="flex gap-3 items-center bg-background p-3 rounded-lg border shadow-sm">
                  <div className="flex-1">
                    <Input
                      placeholder="Name"
                      required
                      value={c.name}
                      onChange={(e) => updateEditCoordinator(c.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Email"
                      type="email"
                      required
                      value={c.email}
                      onChange={(e) => updateEditCoordinator(c.id, "email", e.target.value)}
                    />
                  </div>
                  {editCoordinators.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEditCoordinator(c.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-md text-[#6d432b] uppercase">Custom Registration Fields</h3>
              <Button type="button" size="sm" onClick={addEditField} className="bg-indigo-900 text-white hover:bg-indigo-800">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Question Field
              </Button>
            </div>

            <div className="space-y-3">
              {editFields.map((field, idx) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-center bg-background p-3 rounded-lg border shadow-sm">
                  
                  {/* Field Name */}
                  <div className="flex-1 w-full">
                    <Input
                      placeholder="Question Name (e.g. Roll Number)"
                      required
                      value={field.name}
                      onChange={(e) => updateEditField(field.id, "name", e.target.value)}
                    />
                  </div>

                  {/* Field Type selector */}
                  <div className="w-full sm:w-44">
                    <select
                      value={field.type}
                      onChange={(e) => updateEditField(field.id, "type", e.target.value)}
                      className="w-full p-2 text-sm border rounded bg-background"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options Input (Only for radio/select types) */}
                  {(field.type === "radio" || field.type === "select") && (
                    <div className="w-full sm:w-60">
                      <Input
                        placeholder="Options (comma-separated)"
                        required
                        value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                        onChange={(e) => updateEditField(field.id, "options", e.target.value.split(",").map((o: string) => o.trim()))}
                      />
                    </div>
                  )}

                  {/* Move & Delete buttons */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={idx === 0}
                      onClick={() => moveEditField(idx, "up")}
                      className="w-8 h-8"
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={idx === editFields.length - 1}
                      onClick={() => moveEditField(idx, "down")}
                      className="w-8 h-8"
                    >
                      <ArrowDownIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEditField(field.id)}
                      className="w-8 h-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/95 px-8">
              {submitting ? "Saving..." : "Save Event Details & Form Fields"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveTab("registrations")}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Create New Event Tab */}
      {activeTab === "create-event" && (
        <form onSubmit={handleCreateEvent} className="space-y-6 max-w-4xl bg-muted/20 p-6 rounded-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Event Name</label>
              <Input
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Himachal Trek 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Seating Capacity</label>
              <Input
                type="number"
                required
                min={1}
                value={createSeats}
                onChange={(e) => setCreateSeats(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dashed">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Registration Fee (INR)</label>
              <Input
                type="number"
                required
                min={0}
                value={createFee}
                onChange={(e) => setCreateFee(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Consent Form Template (PDF/Doc)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleConsentTemplateChange(e, false)}
                  className="cursor-pointer"
                />
                {createConsentTemplate && (
                  <a
                    href={createConsentTemplate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-900 underline shrink-0"
                  >
                    View File ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase">Description</label>
            <textarea
              rows={3}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Enter trip highlights, itinerary plans..."
              className="w-full p-2.5 text-sm border rounded bg-background focus:outline-none"
            />
          </div>

          {/* Create Coordinators Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-muted-foreground uppercase">Trip Coordinators</label>
              <Button type="button" size="sm" onClick={addCreateCoordinator} className="bg-indigo-900 text-white hover:bg-indigo-800">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Coordinator
              </Button>
            </div>
            
            <div className="space-y-3">
              {createCoordinators.map((c) => (
                <div key={c.id} className="flex gap-3 items-center bg-background p-3 rounded-lg border shadow-sm">
                  <div className="flex-1">
                    <Input
                      placeholder="Name"
                      required
                      value={c.name}
                      onChange={(e) => updateCreateCoordinator(c.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Email"
                      type="email"
                      required
                      value={c.email}
                      onChange={(e) => updateCreateCoordinator(c.id, "email", e.target.value)}
                    />
                  </div>
                  {createCoordinators.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCreateCoordinator(c.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-md text-[#6d432b] uppercase">Custom Registration Fields</h3>
              <Button type="button" size="sm" onClick={addCreateField} className="bg-indigo-900 text-white hover:bg-indigo-800">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Question Field
              </Button>
            </div>

            <div className="space-y-3">
              {createFields.map((field, idx) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-center bg-background p-3 rounded-lg border shadow-sm">
                  
                  {/* Field Name */}
                  <div className="flex-1 w-full">
                    <Input
                      placeholder="Question Name (e.g. Roll Number)"
                      required
                      value={field.name}
                      onChange={(e) => updateCreateField(field.id, "name", e.target.value)}
                    />
                  </div>

                  {/* Field Type selector */}
                  <div className="w-full sm:w-44">
                    <select
                      value={field.type}
                      onChange={(e) => updateCreateField(field.id, "type", e.target.value)}
                      className="w-full p-2 text-sm border rounded bg-background"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options Input (Only for radio/select types) */}
                  {(field.type === "radio" || field.type === "select") && (
                    <div className="w-full sm:w-60">
                      <Input
                        placeholder="Options (comma-separated)"
                        required
                        value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                        onChange={(e) => updateCreateField(field.id, "options", e.target.value.split(",").map((o: string) => o.trim()))}
                      />
                    </div>
                  )}

                  {/* Move & Delete buttons */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={idx === 0}
                      onClick={() => moveCreateField(idx, "up")}
                      className="w-8 h-8"
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={idx === createFields.length - 1}
                      onClick={() => moveCreateField(idx, "down")}
                      className="w-8 h-8"
                    >
                      <ArrowDownIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCreateField(field.id)}
                      className="w-8 h-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/95 px-8">
              {submitting ? "Creating..." : "Create & Initialize Event"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveTab("registrations")}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {activeConcernEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-lenis-prevent>
          <div className="bg-white border-2 border-black rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-black">
            <button
              onClick={() => setActiveConcernEmail(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-black"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-red-700 flex items-center gap-1.5 uppercase">
              <ShieldAlertIcon className="w-5 h-5" /> Coordinator Flags
            </h3>
            <p className="text-xs text-gray-500 font-bold border-b pb-2">Student: {activeConcernEmail}</p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" data-lenis-prevent>
              {concerns
                .filter((c) => c.studentEmail.toLowerCase() === activeConcernEmail.toLowerCase())
                .map((c) => (
                  <div key={c.id} className="bg-red-50 p-3 rounded border border-red-200 text-xs flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">{c.concernText}</p>
                      <p className="text-[10px] text-gray-400">Flagged by: {c.coordinatorEmail}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteConcern(c.id)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0 shrink-0"
                      title="Delete concern flag"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveConcernEmail(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeProfileReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-lenis-prevent>
          <div className="bg-white border-2 border-black rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-black text-left max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveProfileReg(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-black z-10"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-indigo-950 uppercase border-b pb-2 shrink-0">
              👤 Student Profile Review
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm" data-lenis-prevent>
              <div>
                <span className="font-bold text-xs text-gray-500 uppercase block">Email Address</span>
                <span className="font-semibold text-gray-850">{activeProfileReg.email}</span>
              </div>
              
              <div>
                <span className="font-bold text-xs text-gray-500 uppercase block">Gender</span>
                <span className="font-semibold text-gray-850 capitalize">{activeProfileReg.gender}</span>
              </div>

              {/* Aadhaar Verification Details */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2.5">
                <span className="font-bold text-xs text-amber-950 uppercase block">Aadhaar Gating Status</span>
                <div className="text-xs space-y-2">
                  <p className="flex justify-between items-center">
                    <span>Aadhaar Number:</span>
                    <strong className="text-sm font-semibold">{activeProfileReg.formData["Aadhaar Number"] || "N/A"}</strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>Verification Status:</span>
                    <span className={`font-black px-2 py-0.5 rounded border uppercase text-[10px] ${
                      activeProfileReg.aadhaarVerified 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}>
                      {activeProfileReg.aadhaarVerified ? "Verified ✅" : "Unverified ❌"}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeProfileReg.formData["Aadhaar Card Copy"] && (
                      <a
                        href={activeProfileReg.formData["Aadhaar Card Copy"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-900 hover:bg-amber-800 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow inline-flex items-center gap-1.5"
                      >
                        🪪 View Aadhaar Copy ↗
                      </a>
                    )}
                    
                    {!activeProfileReg.aadhaarVerified && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyAadhaar(activeProfileReg.id)}
                        className="bg-indigo-900 text-white hover:bg-indigo-800 font-bold px-3 py-1.5 rounded text-[11px]"
                      >
                        Verify Aadhaar Card
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent Form Verification Details */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                <span className="font-bold text-xs text-indigo-950 uppercase block">Consent Acknowledgment</span>
                <div className="text-xs">
                  {activeProfileReg.formData["Completed Consent Form"] ? (
                    <div className="space-y-2">
                      <p className="text-green-700 font-semibold">✓ Completed signed consent form uploaded.</p>
                      <a
                        href={activeProfileReg.formData["Completed Consent Form"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow inline-flex items-center gap-1.5"
                      >
                        📝 View Signed Consent Copy ↗
                      </a>
                    </div>
                  ) : (
                    <p className="text-red-700 font-semibold">✗ Signed consent form has not been uploaded yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-xs text-gray-500 uppercase block">Registration Form Answers</span>
                <div className="grid grid-cols-1 gap-2.5 bg-gray-50 p-3 rounded border">
                  {Object.entries(activeProfileReg.formData)
                    .filter(([k]) => k !== "Aadhaar Number" && k !== "Aadhaar Card Copy" && k !== "Completed Consent Form")
                    .map(([key, val]) => (
                      <div key={key} className="border-b pb-1.5 last:border-0 last:pb-0">
                        <span className="text-xs font-bold text-gray-600 block">{key}</span>
                        {typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")) ? (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-900 font-bold underline text-xs hover:text-indigo-800"
                          >
                            View File Link ↗
                          </a>
                        ) : (
                          <span className="text-xs font-semibold text-gray-850">{String(val)}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t shrink-0">
              <Button onClick={() => setActiveProfileReg(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}