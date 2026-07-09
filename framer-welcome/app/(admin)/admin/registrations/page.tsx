"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Loader2Icon, 
  SettingsIcon, 
  UsersIcon, 
  ShieldAlertIcon, 
  ToggleLeftIcon, 
  CheckCircle2Icon, 
  XCircleIcon,
  SaveIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Trip {
  id: string;
  name: string;
  coordinators: string[];
  registrationOpen?: boolean;
  paymentOpen?: boolean;
  totalSeats?: number;
  predefinedGirlsThreshold?: number;
  femaleJoined?: number;
  totalJoined?: number;
  finalRosterSaved?: boolean;
  isCompleted?: boolean;
}

interface Registration {
  id: string;
  email: string;
  uid: string;
  status: string;
  gender: string;
  submittedAt: string;
  formData: Record<string, string>;
}

interface Concern {
  id: string;
  studentEmail: string;
  concernText: string;
  coordinatorEmail: string;
}

export default function SubmissionsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Controls
  const [regOpen, setRegOpen] = useState(true);
  const [payOpen, setPayOpen] = useState(true);
  const [seats, setSeats] = useState(30);
  const [girlsQuota, setGirlsQuota] = useState(10);

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

  // Update trip controls
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
        
        // Refresh local trips state
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

  return (
    <main className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4 space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📋 Registration Control Panel</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage attendees, approval gating, and payment thresholds.</p>
        </div>

        {/* Trip Dropdown Selector */}
        {trips.length > 0 && (
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

      {/* Main Grid: Left side Controls, Right side list */}
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
                          {/* Toggle list of formData keys (Name, Roll, Phone) for review */}
                          <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                            {Object.entries(reg.formData).slice(0, 3).map(([k, v]) => (
                              <span key={k}>{k}: <strong>{String(v)}</strong></span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-xs font-semibold">{reg.gender}</TableCell>
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
                            <div className="space-y-1">
                              {studentFlags.map((c) => (
                                <div key={c.id} className="flex items-start gap-1 bg-red-50 text-red-700 text-[10px] p-1.5 rounded border border-red-200 max-w-[200px]">
                                  <ShieldAlertIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="leading-tight font-medium">
                                    <strong>{c.coordinatorEmail}:</strong> {c.concernText}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No concerns</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {reg.status === "registered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs px-2.5 py-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
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
    </main>
  );
}