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
  PlusCircleIcon,
  FileWarning,
  XIcon
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
  consentTemplates?: Array<{ id: string; name: string; templateUrl: string }>;
  whatsappLink?: string;
  qrCodeUrl?: string;
  emailsDisabled?: boolean;
  cityWhatsappSettings?: Record<string, { whatsappLink: string, qrCodeUrl: string }>;
}

export interface Registration {
  id: string;
  email: string;
  uid: string;
  status: string;
  gender: string;
  submittedAt: string;
  formData: Record<string, string>;
  issueText?: string;
  actionRequiredFields?: string[];
  studentIdVerified?: boolean;
  consentFormFileUrl?: string;
  consentFormVerified?: boolean;
  verifiedConsentForms?: Record<string, boolean>;
  conversationHistory?: Array<{
    type: "admin_request" | "student_reply";
    message: string;
    fields?: string[];         // admin_request: which fields to fix
    updatedFields?: string[];  // student_reply: non-reply fields updated
    fileFields?: string[];     // student_reply: file fields re-uploaded
    timestamp: string | null;
  }>;
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
  { value: "description_text", label: "Description / Section Header" },
];

const getDocumentUrl = (url: string) => {
  if (!url) return "";
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  let filename = lastPart;
  return `/api/downloadProxy/${encodeURIComponent(filename)}?url=${encodeURIComponent(url)}`;
};

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

  const [reuploadRegId, setReuploadRegId] = useState<string | null>(null);
  const [reuploadIssueText, setReuploadIssueText] = useState("");
  const [reuploadFields, setReuploadFields] = useState<string[]>([]);

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
  const [editFee, setEditFee] = useState(0);
  const [editConsentTemplate, setEditConsentTemplate] = useState("");
  const [editWhatsappLink, setEditWhatsappLink] = useState("");
  const [editQrCode, setEditQrCode] = useState("");

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
  const [createFee, setCreateFee] = useState(0);

  const availableAssignedOptions = Array.from(
    new Set(
      editFields
        .filter((f) => f.type === "radio" || f.type === "select")
        .flatMap((f) => f.options || [])
    )
  ).filter((opt) => opt && opt.trim() !== "");

  const createAvailableAssignedOptions = Array.from(
    new Set(
      createFields
        .filter((f) => f.type === "radio" || f.type === "select")
        .flatMap((f) => f.options || [])
    )
  ).filter((opt) => opt && opt.trim() !== "");
  const [createConsentTemplate, setCreateConsentTemplate] = useState("");
  const [createConsentTemplates, setCreateConsentTemplates] = useState<any[]>([]);
  const [editConsentTemplates, setEditConsentTemplates] = useState<any[]>([]);
  const [createTempTemplateName, setCreateTempTemplateName] = useState("");
  const [editTempTemplateName, setEditTempTemplateName] = useState("");
  const [createWhatsappLink, setCreateWhatsappLink] = useState("");
  const [createQrCode, setCreateQrCode] = useState("");
  const [editEmailsDisabled, setEditEmailsDisabled] = useState(false);
  const [createEmailsDisabled, setCreateEmailsDisabled] = useState(false);
  const [editCityWhatsapp, setEditCityWhatsapp] = useState<Record<string, { whatsappLink: string, qrCodeUrl: string }>>({});
  const [createCityWhatsapp, setCreateCityWhatsapp] = useState<Record<string, { whatsappLink: string, qrCodeUrl: string }>>({});

  const [tripSearch, setTripSearch] = useState("");
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);

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

  const handleDownloadCSV = () => {
    if (!registrations.length) return;

    // Collect all unique form field keys across all registrations
    const allFormFieldKeys = new Set<string>();
    registrations.forEach((reg) => {
      if (reg.formData && typeof reg.formData === "object") {
        Object.keys(reg.formData).forEach((k) => allFormFieldKeys.add(k));
      }
    });

    const consentTemplates: any[] = selectedTrip?.consentTemplates || [];

    // Columns for consent form links and verification per template
    const consentLinkHeaders = consentTemplates.map((t: any) => `Consent Form - ${t.name} (Link)`);
    const consentVerifiedHeaders = consentTemplates.map((t: any) => `Consent Form - ${t.name} (Verified)`);

    // Dynamic form field columns — exclude file-upload field names handled separately
    const skipKeys = new Set(["Student ID Card Copy", "Completed Consent Form"]);
    const formFieldHeaders = Array.from(allFormFieldKeys).filter(
      (k) => !skipKeys.has(k) && !k.startsWith("Completed Consent -")
    );

    const headers = [
      "Registration ID",
      "Email",
      "Gender",
      "Status",
      "Student ID Verified",
      "Consent Form Verified",
      "Student ID Copy Link",
      ...consentLinkHeaders,
      ...consentVerifiedHeaders,
      ...formFieldHeaders,
    ];

    const escapeCSV = (val: any): string => {
      if (val == null) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = registrations.map((reg) => {
      const fd: Record<string, any> = reg.formData || {};

      // Student ID Link — check common field key names
      const studentIdLink =
        fd["Student ID Card Copy"] ||
        fd["ID Copy"] ||
        "";

      // Per-template consent form upload links
      const consentLinks = consentTemplates.map((t: any) => {
        // Look for formData key matching this template's name or id
        const matchKey = Object.keys(fd).find((k) => {
          const lower = k.toLowerCase();
          return lower.includes("consent") && (
            lower.includes(t.id?.toLowerCase()) ||
            lower.includes(t.name?.toLowerCase())
          );
        });
        return matchKey ? fd[matchKey] : (fd["Completed Consent Form"] || "");
      });

      const consentVerifiedValues = consentTemplates.map((t: any) => {
        const verifiedMap: Record<string, boolean> = reg.verifiedConsentForms || {};
        return verifiedMap[t.id] ? "Verified" : "Unverified";
      });

      const formValues = formFieldHeaders.map((k) => escapeCSV(fd[k]));

      return [
        escapeCSV(reg.id),
        escapeCSV(reg.email),
        escapeCSV(reg.gender),
        escapeCSV(reg.status),
        escapeCSV(reg.studentIdVerified ? "Verified" : "Unverified"),
        escapeCSV(reg.consentFormVerified ? "Verified" : "Unverified"),
        escapeCSV(studentIdLink),
        ...consentLinks.map(escapeCSV),
        ...consentVerifiedValues,
        ...formValues,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `${selectedTrip?.name || "registrations"}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

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

  const handleVerifyStudentId = async (regId: string) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, studentIdVerified: true }),
      });

      if (res.ok) {
        toast.success("Student ID verified successfully!");
        fetchTripData();
        if (activeProfileReg && activeProfileReg.id === regId) {
          setActiveProfileReg({
            ...activeProfileReg,
            studentIdVerified: true,
          });
        }
      } else {
        toast.error("Failed to verify Student ID.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  const handleVerifyConsentForm = async (regId: string, templateId: string = "legacy-consent") => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          verifiedConsentForms: { [templateId]: true },
        }),
      });

      if (res.ok) {
        toast.success("Consent Form verified successfully!");
        fetchTripData();
        if (activeProfileReg && activeProfileReg.id === regId) {
          const updatedVerifiedMap = {
            ...(activeProfileReg.verifiedConsentForms || {}),
            [templateId]: true,
          };
          
          const templates = selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0
            ? selectedTrip.consentTemplates
            : (selectedTrip?.consentFormTemplateUrl ? [{ id: "legacy-consent" }] : []);
          
          const allOk = templates.every((t) => updatedVerifiedMap[t.id]);

          setActiveProfileReg({
            ...activeProfileReg,
            verifiedConsentForms: updatedVerifiedMap,
            consentFormVerified: allOk,
          });
        }
      } else {
        toast.error("Failed to verify Consent Form.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  const handleCopyRegistrationLink = () => {
    if (!selectedTripId) return;
    const origin = window.location.origin;
    const link = `${origin}/trip-registration?tripId=${selectedTripId}`;
    navigator.clipboard.writeText(link);
    alert("Event registration link copied to clipboard! 📋");
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

  const handleAddTemplateRow = (isEdit: boolean) => {
    const newTemplate = {
      id: crypto.randomUUID(),
      name: "",
      templateUrl: "",
    };
    if (isEdit) {
      setEditConsentTemplates((prev) => [...prev, newTemplate]);
    } else {
      setCreateConsentTemplates((prev) => [...prev, newTemplate]);
    }
  };

  const handleUpdateTemplateName = (id: string, name: string, isEdit: boolean) => {
    if (isEdit) {
      setEditConsentTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name } : t))
      );
    } else {
      setCreateConsentTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name } : t))
      );
    }
  };

  const handleUploadTemplateFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
    isEdit: boolean
  ) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    try {
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileObj);
      });

      toast.loading("Uploading consent template...", { id: `upload-${id}` });

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
        setEditConsentTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, templateUrl: fileUrl } : t))
        );
      } else {
        setCreateConsentTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, templateUrl: fileUrl } : t))
        );
      }
      
      toast.success("Template file uploaded successfully!", { id: `upload-${id}` });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload template file.", { id: `upload-${id}` });
    }
  };

  const handleRemoveTemplateRow = (id: string, isEdit: boolean) => {
    if (isEdit) {
      setEditConsentTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      setCreateConsentTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };


  const handleQrCodeChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    try {
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileObj);
      });

      toast.loading("Uploading QR Code image...", { id: "upload-qr" });

      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [base64File],
          folder: "trip_qrs",
        }),
      });

      const data = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const fileUrl = data.images[0].secure_url || data.images[0];
      if (isEdit) {
        setEditQrCode(fileUrl);
      } else {
        setCreateQrCode(fileUrl);
      }
      toast.success("QR Code uploaded successfully!", { id: "upload-qr" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload QR Code.", { id: "upload-qr" });
    }
  };

  const handleCityQrCodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    option: string,
    isEdit: boolean
  ) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    try {
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileObj);
      });

      toast.loading(`Uploading QR Code for ${option}...`, { id: "upload-city-qr" });

      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [base64File],
          folder: "trip_qrs",
        }),
      });

      const data = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const fileUrl = data.images[0].secure_url || data.images[0];
      
      if (isEdit) {
        setEditCityWhatsapp((prev) => ({
          ...prev,
          [option]: {
            ...(prev[option] || { whatsappLink: "" }),
            qrCodeUrl: fileUrl,
          },
        }));
      } else {
        setCreateCityWhatsapp((prev) => ({
          ...prev,
          [option]: {
            ...(prev[option] || { whatsappLink: "" }),
            qrCodeUrl: fileUrl,
          },
        }));
      }
      toast.success(`QR Code for ${option} uploaded successfully!`, { id: "upload-city-qr" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload QR Code.", { id: "upload-city-qr" });
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
  const handleStatusChange = async (regId: string, nextStatus: string, issueText?: string, actionRequiredFields?: string[]) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status: nextStatus, issueText, actionRequiredFields }),
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
        allowEditIfPrefilled: true,
        sortOrder: editFields.length,
      },
    ]);
  };

  const updateEditField = (id: string, keyOrObj: string | Record<string, any>, value?: any) => {
    setEditFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        if (typeof keyOrObj === "object" && keyOrObj !== null) {
          return { ...f, ...keyOrObj };
        }
        return { ...f, [keyOrObj]: value };
      })
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
            assignedOption: c.assignedOption ? c.assignedOption.trim() : "",
          })).filter((c) => c.name && c.email),
          totalSeats: Number(editSeats),
          formFields: editFields,
          fee: Number(editFee),
          consentFormTemplateUrl: editConsentTemplate,
          consentTemplates: editConsentTemplates,
          whatsappLink: editWhatsappLink,
          qrCodeUrl: editQrCode,
          emailsDisabled: editEmailsDisabled,
          cityWhatsappSettings: editCityWhatsapp,
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
        allowEditIfPrefilled: true,
        sortOrder: createFields.length,
      },
    ]);
  };

  const updateCreateField = (id: string, keyOrObj: string | Record<string, any>, value?: any) => {
    setCreateFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        if (typeof keyOrObj === "object" && keyOrObj !== null) {
          return { ...f, ...keyOrObj };
        }
        return { ...f, [keyOrObj]: value };
      })
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
      { id: Math.random().toString(36).substr(2, 9), name: "", email: "", assignedOption: "" }
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
            assignedOption: c.assignedOption ? c.assignedOption.trim() : "",
          })).filter((c) => c.name && c.email),
          totalSeats: Number(createSeats),
          femaleReservedSeats: 0,
          releasedSeats: 0,
          releasedSeatsType: "all",
          formFields: createFields,
          fee: Number(createFee),
          consentFormTemplateUrl: createConsentTemplate,
          consentTemplates: createConsentTemplates,
          whatsappLink: createWhatsappLink,
          qrCodeUrl: createQrCode,
          emailsDisabled: createEmailsDisabled,
          cityWhatsappSettings: createCityWhatsapp,
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

        {/* Trip Searchable Dropdown & Link Copier */}
        {trips.length > 0 && activeTab !== "create-event" && (
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <button
                type="button"
                onClick={() => setTripDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between p-2 border border-border rounded bg-background text-sm font-semibold outline-none hover:border-primary/50 transition"
              >
                <span className="truncate">{trips.find((t) => t.id === selectedTripId)?.name || "Select trip"}</span>
                <svg className="w-4 h-4 ml-2 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {tripDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search trip..."
                      value={tripSearch}
                      onChange={(e) => setTripSearch(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-border rounded outline-none focus:border-primary bg-background"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {trips
                      .filter((t) => t.name.toLowerCase().includes(tripSearch.toLowerCase()))
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted transition ${
                            t.id === selectedTripId ? "bg-primary/10 text-primary" : ""
                          }`}
                          onClick={() => {
                            setSelectedTripId(t.id);
                            setTripSearch("");
                            setTripDropdownOpen(false);
                          }}
                        >
                          {t.name}
                        </button>
                      ))}
                    {trips.filter((t) => t.name.toLowerCase().includes(tripSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-3 text-xs text-muted-foreground italic">No trips found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleCopyRegistrationLink}
              variant="outline"
              size="sm"
              className="font-bold flex items-center gap-1.5 text-xs h-[38px] px-3"
              title="Copy student registration link for this event"
            >
              🔗 Copy Link
            </Button>
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
                  return { id: c.id || String(idx), name: c.name || "", email: c.email || "", assignedOption: c.assignedOption || "" };
                }
                return { id: String(idx), name: "", email: String(c), assignedOption: "" };
              });
              setEditCoordinators(coords);

              setEditSeats(selectedTrip.totalSeats || 30);
              setEditFields(selectedTrip.form?.fields || []);
              setEditFee(selectedTrip.fee !== undefined ? selectedTrip.fee : 0);
              setEditConsentTemplate(selectedTrip.consentFormTemplateUrl || "");
              setEditConsentTemplates(selectedTrip.consentTemplates || []);
              setEditWhatsappLink(selectedTrip.whatsappLink || "");
              setEditQrCode(selectedTrip.qrCodeUrl || "");
              setEditEmailsDisabled(selectedTrip.emailsDisabled || false);
              setEditCityWhatsapp(selectedTrip.cityWhatsappSettings || {});
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
            setCreateCoordinators([{ id: "c1", name: "", email: "", assignedOption: "" }]);
            setCreateSeats(30);
            setCreateFields([
              { id: "1", name: "Full Name", type: "short_text", allowEditIfPrefilled: false, sortOrder: 0 },
              { id: "2", name: "Roll Number", type: "short_text", allowEditIfPrefilled: true, sortOrder: 1 },
              { id: "3", name: "Gender", type: "radio", options: ["Male", "Female", "Other"], allowEditIfPrefilled: false, sortOrder: 2 },
            ]);
            setCreateWhatsappLink("");
            setCreateQrCode("");
            setCreateEmailsDisabled(false);
            setCreateCityWhatsapp({});
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
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-base flex items-center gap-1.5 text-muted-foreground">
                  <UsersIcon className="w-4 h-4" /> Registration Entries ({registrations.length})
                </h2>
                {registrations.length > 0 && (
                  <Button
                    onClick={handleDownloadCSV}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 font-semibold"
                  >
                    📥 Download CSV
                  </Button>
                )}
              </div>
              <div className="flex gap-4 text-xs font-bold text-muted-foreground">
                <span>Seats Count: {selectedTrip?.totalJoined || 0} / {selectedTrip?.totalSeats || 0}</span>
                <span>Girls Count: {selectedTrip?.femaleJoined || 0}</span>
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
                      <TableHead>ID Status</TableHead>
                      <TableHead>Consent Status</TableHead>
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
                          
                          {/* ID Status */}
                          <TableCell>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                              reg.studentIdVerified 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {reg.studentIdVerified ? "Verified ✅" : "Unverified ❌"}
                            </span>
                          </TableCell>

                          {/* Consent Status */}
                          <TableCell>
                            {selectedTrip?.consentFormTemplateUrl ? (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                                reg.consentFormVerified 
                                  ? "bg-green-100 text-green-700 border-green-200" 
                                  : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                                {reg.consentFormVerified ? "Verified ✅" : "Unverified ❌"}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-400">N/A</span>
                            )}
                          </TableCell>

                          {/* Documents Access */}
                          <TableCell>
                            <div className="flex flex-col gap-1 text-[10px]">
                              {reg.formData?.["Student ID Card Copy"] ? (
                                <a
                                  href={getDocumentUrl(reg.formData["Student ID Card Copy"])}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-muted px-2 py-1 rounded border hover:bg-muted/80 text-foreground font-semibold flex items-center justify-between gap-1 w-28 text-[9px] text-left"
                                >
                                  🪪 ID Copy ↗
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic text-[9px]">No ID Copy</span>
                              )}
                              {reg.formData?.["Completed Consent Form"] ? (
                                <a
                                  href={getDocumentUrl(reg.formData["Completed Consent Form"])}
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
                              reg.status === "mail_sent" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                              reg.status === "approved_to_pay" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                              reg.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                              "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}>{reg.status === "mail_sent" ? "mail sent" : reg.status === "approved_to_pay" ? "approved" : reg.status}</span>
                            {/* Show student's Custom Reply or User Reply if they submitted one */}
                            {(reg.formData?.["Custom Reply"] || reg.formData?.["User Reply"]) && (
                              <button
                                onClick={() => setActiveProfileReg(reg)}
                                className="mt-1.5 w-full text-left text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 leading-snug hover:bg-indigo-100 transition-colors"
                                title="Click to view full reply"
                              >
                                <span className="font-black block text-indigo-500 uppercase tracking-wide mb-0.5">💬 Student Reply ↗</span>
                                <span className="line-clamp-2">{reg.formData["Custom Reply"] || reg.formData["User Reply"]}</span>
                              </button>
                            )}
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
                                      title={
                                        !reg.studentIdVerified
                                          ? "Student ID must be verified first"
                                          : (!reg.consentFormVerified && (
                                              (selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0) ||
                                              selectedTrip?.consentFormTemplateUrl
                                            ))
                                          ? "All consent forms must be verified first"
                                          : "Approve"
                                      }
                                      disabled={
                                        !reg.studentIdVerified ||
                                        !!(
                                          !reg.consentFormVerified && (
                                            (selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0) ||
                                            selectedTrip?.consentFormTemplateUrl
                                          )
                                        )
                                      }
                                      className="text-xs px-2.5 py-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200 disabled:cursor-not-allowed"
                                      onClick={() => handleStatusChange(reg.id, "approved_to_pay")}
                                    >
                                      <CheckCircle2Icon className="w-3.5 h-3.5 mr-1" /> Approve
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

                                {(reg.status === "registered" || reg.status === "rejected") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-2.5 py-1 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                                    onClick={() => setReuploadRegId(reg.id)}
                                  >
                                    <FileWarning className="w-3.5 h-3.5 mr-1" /> Re-upload
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
            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <input
                id="editEmailsDisabled"
                type="checkbox"
                checked={editEmailsDisabled}
                onChange={(e) => setEditEmailsDisabled(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-900 focus:ring-indigo-900 cursor-pointer h-4 w-4"
              />
              <label htmlFor="editEmailsDisabled" className="text-sm font-bold text-zinc-700 cursor-pointer select-none">
                ⛔ Disable Email Notifications (Do not send any automated emails for approvals or re-uploads)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dashed">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Global WhatsApp Group Joining Link</label>
              <Input
                type="url"
                value={editWhatsappLink}
                onChange={(e) => setEditWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Global WhatsApp Group QR Code (Image)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQrCodeChange(e, true)}
                  className="cursor-pointer"
                />
                {editQrCode && (
                  <a
                    href={getDocumentUrl(editQrCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-900 underline shrink-0"
                  >
                    View QR ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Option-Specific WhatsApp Settings */}
          {availableAssignedOptions.length > 0 && (
            <div className="pt-4 border-t border-dashed space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#6d432b] uppercase">Option/City Specific WhatsApp Settings</h4>
                <p className="text-xs text-muted-foreground">Define different WhatsApp joining links and QR codes for different cities. Registrations matching these choices will receive their specific WhatsApp Link/QR code upon approval (falls back to global settings if empty).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAssignedOptions.map((opt) => (
                  <div key={opt} className="bg-zinc-50/50 p-4 rounded-xl border border-border space-y-3">
                    <span className="text-xs font-black text-indigo-950 uppercase block border-b pb-1.5">📍 City / Option: {opt}</span>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Link</label>
                      <Input
                        type="url"
                        value={editCityWhatsapp[opt]?.whatsappLink || ""}
                        onChange={(e) => setEditCityWhatsapp(prev => ({
                          ...prev,
                          [opt]: {
                            ...(prev[opt] || { qrCodeUrl: "" }),
                            whatsappLink: e.target.value,
                          }
                        }))}
                        placeholder={`e.g. WhatsApp Link for ${opt}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block">WhatsApp QR Code</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCityQrCodeChange(e, opt, true)}
                          className="cursor-pointer text-xs"
                        />
                        {editCityWhatsapp[opt]?.qrCodeUrl && (
                          <a
                            href={getDocumentUrl(editCityWhatsapp[opt].qrCodeUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-indigo-900 underline shrink-0"
                          >
                            View QR ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-dashed space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground uppercase block">Consent Form Templates</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTemplateRow(true)}
                  className="h-8 text-xs"
                >
                  <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Consent Form
                </Button>
              </div>
              
              <div className="space-y-3">
                {editConsentTemplates.map((t) => (
                  <div key={t.id} className="bg-zinc-50/50 p-3 rounded-lg border flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Template Description / Name</span>
                        <Input
                          placeholder="e.g. Parental Consent Form"
                          value={t.name}
                          onChange={(e) => handleUpdateTemplateName(t.id, e.target.value, true)}
                          className="h-8 text-xs"
                        />
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Choose Template File</span>
                        {t.templateUrl ? (
                          <div className="flex items-center gap-3">
                            <a
                              href={getDocumentUrl(t.templateUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-900 hover:text-indigo-800 underline flex items-center gap-1"
                            >
                              📝 View Uploaded Template ↗
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 h-6 px-2 hover:bg-red-50 text-[10px] font-bold"
                              onClick={() => {
                                setEditConsentTemplates((prev) =>
                                  prev.map((item) => item.id === t.id ? { ...item, templateUrl: "" } : item)
                                );
                              }}
                            >
                              Change File
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleUploadTemplateFile(e, t.id, true)}
                            className="h-8 text-xs cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-750 self-start mt-4"
                      onClick={() => handleRemoveTemplateRow(t.id, true)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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
                  <div className="w-56">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={c.assignedOption || ""}
                      onChange={(e) => updateEditCoordinator(c.id, "assignedOption", e.target.value)}
                    >
                      <option value="">All Cities / Options</option>
                      {availableAssignedOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
              {editFields.map((field, idx) => {
                const parentCandidates = editFields.filter(
                  (f) => f.id !== field.id && f.sortOrder < field.sortOrder && (f.type === "radio" || f.type === "select") && f.name
                );

                return (
                  <div key={field.id} className="bg-background p-3 rounded-lg border shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      
                      {/* Field Name */}
                      <div className="flex-1 w-full">
                        {field.type === "description_text" ? (
                          <textarea
                            placeholder="Enter description or section header text here..."
                            required
                            value={field.name}
                            onChange={(e) => updateEditField(field.id, "name", e.target.value)}
                            className="w-full p-2 text-sm border rounded bg-background min-h-[70px] resize-none focus:outline-none"
                          />
                        ) : (
                          <Input
                            placeholder="Question Name (e.g. Roll Number)"
                            required
                            value={field.name}
                            onChange={(e) => updateEditField(field.id, "name", e.target.value)}
                          />
                        )}
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

                      {/* Allow Edit Checkbox */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-muted/40 px-2 py-1 rounded border">
                        <input
                          type="checkbox"
                          id={`edit-allow-prefilled-${field.id}`}
                          checked={field.allowEditIfPrefilled !== false}
                          onChange={(e) => updateEditField(field.id, "allowEditIfPrefilled", e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-indigo-900 rounded"
                        />
                        <label htmlFor={`edit-allow-prefilled-${field.id}`} className="text-xs font-bold text-muted-foreground cursor-pointer select-none">
                          Allow Edit
                        </label>
                      </div>

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

                    {/* Conditional visibility configuration UI */}
                    {parentCandidates.length > 0 && (
                      <div className="ml-0 mt-2 space-y-2 border-t pt-2 pl-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`edit-cond-${field.id}`}
                            checked={!!field.dependsOnFieldId}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const first = parentCandidates[0];
                                updateEditField(field.id, {
                                  dependsOnFieldId: first.id,
                                  dependsOnValue: first.options?.[0] || "",
                                });
                              } else {
                                updateEditField(field.id, {
                                  dependsOnFieldId: null,
                                  dependsOnValue: null,
                                });
                              }
                            }}
                            className="size-4 rounded border-gray-300 accent-primary cursor-pointer"
                          />
                          <label htmlFor={`edit-cond-${field.id}`} className="text-xs font-semibold cursor-pointer text-muted-foreground select-none">
                            Make this field conditional (show only if another field matches an option)
                          </label>
                        </div>

                        {field.dependsOnFieldId && (
                          <div className="flex flex-wrap items-center gap-2 pl-6 mt-1 text-xs text-muted-foreground">
                            <span>Show only when</span>
                            <select
                              value={field.dependsOnFieldId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matched = parentCandidates.find(c => c.id === val);
                                updateEditField(field.id, "dependsOnFieldId", val);
                                updateEditField(field.id, "dependsOnValue", matched?.options?.[0] || "");
                              }}
                              className="p-1 border rounded bg-background text-xs"
                            >
                              {parentCandidates.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name || `Field (${c.type})`}
                                </option>
                              ))}
                            </select>

                            <span>equals</span>

                            <select
                              value={field.dependsOnValue || ""}
                              onChange={(e) => {
                                updateEditField(field.id, "dependsOnValue", e.target.value);
                              }}
                              className="p-1 border rounded bg-background text-xs"
                            >
                              {(parentCandidates.find(c => c.id === field.dependsOnFieldId)?.options || []).map((opt: any) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <input
                id="createEmailsDisabled"
                type="checkbox"
                checked={createEmailsDisabled}
                onChange={(e) => setCreateEmailsDisabled(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-900 focus:ring-indigo-900 cursor-pointer h-4 w-4"
              />
              <label htmlFor="createEmailsDisabled" className="text-sm font-bold text-zinc-700 cursor-pointer select-none">
                ⛔ Disable Email Notifications (Do not send any automated emails for approvals or re-uploads)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dashed">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Global WhatsApp Group Joining Link</label>
              <Input
                type="url"
                value={createWhatsappLink}
                onChange={(e) => setCreateWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Global WhatsApp Group QR Code (Image)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQrCodeChange(e, false)}
                  className="cursor-pointer"
                />
                {createQrCode && (
                  <a
                    href={getDocumentUrl(createQrCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-900 underline shrink-0"
                  >
                    View QR ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Option-Specific WhatsApp Settings */}
          {createAvailableAssignedOptions.length > 0 && (
            <div className="pt-4 border-t border-dashed space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#6d432b] uppercase">Option/City Specific WhatsApp Settings</h4>
                <p className="text-xs text-muted-foreground">Define different WhatsApp joining links and QR codes for different cities. Registrations matching these choices will receive their specific WhatsApp Link/QR code upon approval (falls back to global settings if empty).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createAvailableAssignedOptions.map((opt) => (
                  <div key={opt} className="bg-zinc-50/50 p-4 rounded-xl border border-border space-y-3">
                    <span className="text-xs font-black text-indigo-950 uppercase block border-b pb-1.5">📍 City / Option: {opt}</span>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Link</label>
                      <Input
                        type="url"
                        value={createCityWhatsapp[opt]?.whatsappLink || ""}
                        onChange={(e) => setCreateCityWhatsapp(prev => ({
                          ...prev,
                          [opt]: {
                            ...(prev[opt] || { qrCodeUrl: "" }),
                            whatsappLink: e.target.value,
                          }
                        }))}
                        placeholder={`e.g. WhatsApp Link for ${opt}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block">WhatsApp QR Code</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCityQrCodeChange(e, opt, false)}
                          className="cursor-pointer text-xs"
                        />
                        {createCityWhatsapp[opt]?.qrCodeUrl && (
                          <a
                            href={getDocumentUrl(createCityWhatsapp[opt].qrCodeUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-indigo-900 underline shrink-0"
                          >
                            View QR ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-dashed space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground uppercase block">Consent Form Templates</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTemplateRow(false)}
                  className="h-8 text-xs"
                >
                  <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Consent Form
                </Button>
              </div>
              
              <div className="space-y-3">
                {createConsentTemplates.map((t) => (
                  <div key={t.id} className="bg-zinc-50/50 p-3 rounded-lg border flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Template Description / Name</span>
                        <Input
                          placeholder="e.g. Parental Consent Form"
                          value={t.name}
                          onChange={(e) => handleUpdateTemplateName(t.id, e.target.value, false)}
                          className="h-8 text-xs"
                        />
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Choose Template File</span>
                        {t.templateUrl ? (
                          <div className="flex items-center gap-3">
                            <a
                              href={getDocumentUrl(t.templateUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-900 hover:text-indigo-800 underline flex items-center gap-1"
                            >
                              📝 View Uploaded Template ↗
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 h-6 px-2 hover:bg-red-50 text-[10px] font-bold"
                              onClick={() => {
                                setCreateConsentTemplates((prev) =>
                                  prev.map((item) => item.id === t.id ? { ...item, templateUrl: "" } : item)
                                );
                              }}
                            >
                              Change File
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleUploadTemplateFile(e, t.id, false)}
                            className="h-8 text-xs cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-750 self-start mt-4"
                      onClick={() => handleRemoveTemplateRow(t.id, false)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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
                  <div className="w-56">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={c.assignedOption || ""}
                      onChange={(e) => updateCreateCoordinator(c.id, "assignedOption", e.target.value)}
                    >
                      <option value="">All Cities / Options</option>
                      {createAvailableAssignedOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
              {createFields.map((field, idx) => {
                const parentCandidates = createFields.filter(
                  (f) => f.id !== field.id && f.sortOrder < field.sortOrder && (f.type === "radio" || f.type === "select") && f.name
                );

                return (
                  <div key={field.id} className="bg-background p-3 rounded-lg border shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      
                      {/* Field Name */}
                      <div className="flex-1 w-full">
                        {field.type === "description_text" ? (
                          <textarea
                            placeholder="Enter description or section header text here..."
                            required
                            value={field.name}
                            onChange={(e) => updateCreateField(field.id, "name", e.target.value)}
                            className="w-full p-2 text-sm border rounded bg-background min-h-[70px] resize-none focus:outline-none"
                          />
                        ) : (
                          <Input
                            placeholder="Question Name (e.g. Roll Number)"
                            required
                            value={field.name}
                            onChange={(e) => updateCreateField(field.id, "name", e.target.value)}
                          />
                        )}
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

                      {/* Allow Edit Checkbox */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-muted/40 px-2 py-1 rounded border">
                        <input
                          type="checkbox"
                          id={`create-allow-prefilled-${field.id}`}
                          checked={field.allowEditIfPrefilled !== false}
                          onChange={(e) => updateCreateField(field.id, "allowEditIfPrefilled", e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-indigo-900 rounded"
                        />
                        <label htmlFor={`create-allow-prefilled-${field.id}`} className="text-xs font-bold text-muted-foreground cursor-pointer select-none">
                          Allow Edit
                        </label>
                      </div>

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

                    {/* Conditional visibility configuration UI */}
                    {parentCandidates.length > 0 && (
                      <div className="ml-0 mt-2 space-y-2 border-t pt-2 pl-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`create-cond-${field.id}`}
                            checked={!!field.dependsOnFieldId}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const first = parentCandidates[0];
                                updateCreateField(field.id, {
                                  dependsOnFieldId: first.id,
                                  dependsOnValue: first.options?.[0] || "",
                                });
                              } else {
                                updateCreateField(field.id, {
                                  dependsOnFieldId: null,
                                  dependsOnValue: null,
                                });
                              }
                            }}
                            className="size-4 rounded border-gray-300 accent-primary cursor-pointer"
                          />
                          <label htmlFor={`create-cond-${field.id}`} className="text-xs font-semibold cursor-pointer text-muted-foreground select-none">
                            Make this field conditional (show only if another field matches an option)
                          </label>
                        </div>

                        {field.dependsOnFieldId && (
                          <div className="flex flex-wrap items-center gap-2 pl-6 mt-1 text-xs text-muted-foreground">
                            <span>Show only when</span>
                            <select
                              value={field.dependsOnFieldId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matched = parentCandidates.find(c => c.id === val);
                                updateCreateField(field.id, "dependsOnFieldId", val);
                                updateCreateField(field.id, "dependsOnValue", matched?.options?.[0] || "");
                              }}
                              className="p-1 border rounded bg-background text-xs"
                            >
                              {parentCandidates.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name || `Field (${c.type})`}
                                </option>
                              ))}
                            </select>

                            <span>equals</span>

                            <select
                              value={field.dependsOnValue || ""}
                              onChange={(e) => {
                                updateCreateField(field.id, "dependsOnValue", e.target.value);
                              }}
                              className="p-1 border rounded bg-background text-xs"
                            >
                              {(parentCandidates.find(c => c.id === field.dependsOnFieldId)?.options || []).map((opt: any) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

              {/* Student ID Verification Details */}
              {(() => {
                const idCopy = activeProfileReg.formData["Student ID Card Copy"];
                const isVerified = activeProfileReg.studentIdVerified || false;

                return (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2.5">
                    <span className="font-bold text-xs text-amber-950 uppercase block">Student ID Gating Status</span>
                    <div className="text-xs space-y-2">
                      <p className="flex justify-between items-center">
                        <span>Verification Status:</span>
                        <span className={`font-black px-2 py-0.5 rounded border uppercase text-[10px] ${
                          isVerified 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                          {isVerified ? "Verified ✅" : "Unverified ❌"}
                        </span>
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {idCopy && (
                          <a
                            href={getDocumentUrl(idCopy)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-900 hover:bg-amber-800 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow inline-flex items-center gap-1.5"
                          >
                            🪪 View Student ID Copy ↗
                          </a>
                        )}
                        
                        {!isVerified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyStudentId(activeProfileReg.id)}
                            className="bg-indigo-900 text-white hover:bg-indigo-800 font-bold px-3 py-1.5 rounded text-[11px]"
                          >
                            Verify Student ID
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Consent Form Verification Details */}
              {(() => {
                const templates = selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0
                  ? selectedTrip.consentTemplates
                  : (selectedTrip?.consentFormTemplateUrl ? [{ id: "legacy-consent", name: "Completed Consent Form", templateUrl: selectedTrip.consentFormTemplateUrl }] : []);

                if (templates.length === 0) return null;

                return (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
                    <span className="font-bold text-xs text-indigo-950 uppercase block font-oswald tracking-wide">Consent Acknowledgments ({templates.length})</span>
                    <div className="space-y-4">
                      {templates.map((t) => {
                        const fileKey = t.id === "legacy-consent" ? "Completed Consent Form" : `Completed Consent - ${t.name}`;
                        const uploadedUrl = activeProfileReg.formData[fileKey];
                        const isVerified = t.id === "legacy-consent" 
                          ? activeProfileReg.consentFormVerified 
                          : (activeProfileReg.verifiedConsentForms?.[t.id] || false);

                        return (
                          <div key={t.id} className="border-b pb-3 last:border-0 last:pb-0 text-xs space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-gray-800">{t.name}</span>
                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                  Template: <a href={getDocumentUrl(t.templateUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-900 underline font-semibold">Download ↗</a>
                                </span>
                              </div>
                              <span className={`font-black px-2 py-0.5 rounded border uppercase text-[10px] ${
                                isVerified 
                                  ? "bg-green-100 text-green-700 border-green-200" 
                                  : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                                {isVerified ? "Verified ✅" : "Unverified ❌"}
                              </span>
                            </div>
                            
                            <div>
                              {uploadedUrl ? (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <a
                                    href={getDocumentUrl(uploadedUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow inline-flex items-center gap-1.5"
                                  >
                                    📝 View Signed Copy ↗
                                  </a>
                                  
                                  {!isVerified && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerifyConsentForm(activeProfileReg.id, t.id)}
                                      className="bg-green-700 text-white hover:bg-green-800 font-bold px-3 py-1.5 rounded text-[11px]"
                                    >
                                      Verify Form
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-red-700 font-semibold italic text-[11px]">✗ Signed copy has not been uploaded yet.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
 
              {/* Conversation Thread */}
              {activeProfileReg.conversationHistory && activeProfileReg.conversationHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-xs text-gray-500 uppercase block">Q&amp;A Thread ({activeProfileReg.conversationHistory.length} exchanges)</span>
                  <div className="space-y-3">
                    {activeProfileReg.conversationHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 text-xs border-2 ${
                          entry.type === "admin_request"
                            ? "bg-amber-50 border-amber-200 ml-0 mr-8"
                            : "bg-indigo-50 border-indigo-200 ml-8 mr-0"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className={`font-black text-[10px] uppercase tracking-wide ${
                            entry.type === "admin_request" ? "text-amber-700" : "text-indigo-700"
                          }`}>
                            {entry.type === "admin_request" ? "🧑‍💼 Coordinator" : "🎓 Student"}
                          </span>
                          {entry.timestamp && (
                            <span className="text-[9px] text-gray-400 shrink-0">
                              {new Date(entry.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          )}
                        </div>
                        {entry.message && (
                          <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap mb-1.5">{entry.message}</p>
                        )}
                        {entry.type === "admin_request" && entry.fields && entry.fields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.fields.map(f => (
                              <span key={f} className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-bold">{f}</span>
                            ))}
                          </div>
                        )}
                        {entry.type === "student_reply" && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(entry.updatedFields || []).map(f => (
                              <span key={f} className="bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded text-[9px] font-bold">✏️ {f}</span>
                            ))}
                            {(entry.fileFields || []).map(f => (
                              <span key={f} className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px] font-bold">📎 {f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Reply Callout — shown prominently if present */}
              {(activeProfileReg.formData?.["Custom Reply"] || activeProfileReg.formData?.["User Reply"]) && (
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 space-y-1.5">
                  <span className="font-black text-xs text-indigo-700 uppercase tracking-wide block">💬 Student Reply</span>
                  <p className="text-sm text-indigo-900 font-medium leading-relaxed whitespace-pre-wrap">
                    {activeProfileReg.formData["Custom Reply"] || activeProfileReg.formData["User Reply"]}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <span className="font-bold text-xs text-gray-500 uppercase block">Registration Form Answers</span>
                <div className="grid grid-cols-1 gap-2.5 bg-gray-50 p-3 rounded border">
                  {Object.entries(activeProfileReg.formData)
                    .filter(([k]) => k !== "Student ID Number" && k !== "Student ID Card Copy" && k !== "Completed Consent Form" && !k.startsWith("Completed Consent -") && k !== "Custom Reply" && k !== "User Reply")
                    .map(([key, val]) => (
                      <div key={key} className="border-b pb-1.5 last:border-0 last:pb-0">
                        <span className="text-xs font-bold text-gray-600 block">{key}</span>
                        {typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")) ? (
                          <a
                            href={val.includes("res.cloudinary.com") ? `/api/downloadProxy/custom_file?url=${encodeURIComponent(val)}` : val}
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

      {/* Request Re-upload Modal */}
      {reuploadRegId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 flex items-center justify-center backdrop-blur-sm" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setReuploadRegId(null); setReuploadIssueText(""); setReuploadFields([]); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <h3 className="font-oswald font-bold text-xl text-[#3E1126] uppercase mb-2">Request Re-Upload / Correction</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Select which fields need to be corrected by the user, and optionally provide a message explaining why.
            </p>

            {/* Checkboxes for fields */}
            <div className="mb-4 space-y-2 border-2 border-zinc-100 rounded-xl p-3 max-h-48 overflow-y-auto">
              {[
                ...(selectedTrip?.form?.fields?.map(f => f.name) || []),
                "Student ID Card Copy",
                ...(selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0
                  ? selectedTrip.consentTemplates.map(t => `Completed Consent - ${t.name}`)
                  : (selectedTrip?.consentFormTemplateUrl ? ["Completed Consent Form"] : [])),
                "Custom Reply"
              ].map(fieldName => (
                <label key={fieldName} className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="rounded text-[#3E1126] focus:ring-[#3E1126]"
                    checked={reuploadFields.includes(fieldName)}
                    onChange={(e) => {
                      if (e.target.checked) setReuploadFields([...reuploadFields, fieldName]);
                      else setReuploadFields(reuploadFields.filter(f => f !== fieldName));
                    }}
                  />
                  {fieldName}
                </label>
              ))}
            </div>

            <textarea
              className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-[#3E1126]/40 focus:outline-none min-h-[100px] mb-4 resize-none"
              placeholder="Describe the issue with their registration (optional if fields are selected)..."
              value={reuploadIssueText}
              onChange={(e) => setReuploadIssueText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setReuploadRegId(null); setReuploadIssueText(""); setReuploadFields([]); }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                disabled={!reuploadIssueText.trim() && reuploadFields.length === 0}
                onClick={() => {
                  handleStatusChange(reuploadRegId, "action_required", reuploadIssueText.trim(), reuploadFields);
                  setReuploadRegId(null);
                  setReuploadIssueText("");
                  setReuploadFields([]);
                }}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}