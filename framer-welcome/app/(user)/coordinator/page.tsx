"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2Icon, ShieldAlertIcon, FileTextIcon, UserCheckIcon, LogOutIcon } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

interface Trip {
  id: string;
  name: string;
  coordinators: any[];
  isCompleted?: boolean;
  consentFormTemplateUrl?: string;
  consentTemplates?: Array<{ id: string; name: string; templateUrl: string }>;
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
  studentIdVerified?: boolean;
  consentFormFileUrl?: string;
  consentFormVerified?: boolean;
  verifiedConsentForms?: Record<string, boolean>;
}

interface Concern {
  id: string;
  studentEmail: string;
  concernText: string;
  coordinatorEmail: string;
  createdAt: string;
}

const getDocumentUrl = (url: string) => {
  if (!url) return "";
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  let filename = lastPart;
  return `/api/downloadProxy/${encodeURIComponent(filename)}?url=${encodeURIComponent(url)}`;
};

export default function CoordinatorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [concernText, setConcernText] = useState("");
  const [submittingConcern, setSubmittingConcern] = useState(false);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const currentCoordinatorInfo = selectedTrip?.coordinators?.find((c: any) => {
    if (typeof c === "object" && c !== null) {
      return c.email?.toLowerCase() === user?.email?.toLowerCase();
    }
    return String(c).toLowerCase() === user?.email?.toLowerCase();
  });
  const assignedOption = typeof currentCoordinatorInfo === "object" && currentCoordinatorInfo !== null
    ? currentCoordinatorInfo.assignedOption
    : null;

  // Authenticate coordinator by checking email against trip coordinators list
  const verifyCoordinator = async (coordinatorEmail: string) => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/trip");
      if (res.ok) {
        const data = await res.json();
        const allTrips: Trip[] = data.trips || [];
        
        // Find trips coordinated by this email
        const coordinated = allTrips.filter((t) => 
          t.coordinators?.some((c: any) => {
            if (typeof c === "object" && c !== null) {
              return c.email?.toLowerCase() === coordinatorEmail.toLowerCase();
            }
            return String(c).toLowerCase() === coordinatorEmail.toLowerCase();
          })
        );

        if (coordinated.length === 0) {
          alert(`Email ${coordinatorEmail} is not listed as a coordinator for any active trip.`);
          await signOut(auth);
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        setTrips(coordinated);
        setSelectedTripId(coordinated[0].id);
        setIsAuthenticated(true);
      } else {
        alert("Failed to connect to trip database.");
        await signOut(auth);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during verification.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  // Firebase auth state subscriber
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setUser(firebaseUser);
        await verifyCoordinator(firebaseUser.email);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch registrations & concerns for selected trip
  const fetchTripData = async () => {
    if (!selectedTripId) return;
    const isAssigned = trips.some((t) => t.id === selectedTripId);
    if (!isAssigned && trips.length > 0) {
      console.warn("Unauthorized: Not assigned to this trip.");
      return;
    }
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const regRes = await fetch(`/api/admin/registrations?tripId=${selectedTripId}&token=${token}`);
      const concernsRes = await fetch(`/api/coordinator/concerns?tripId=${selectedTripId}&token=${token}`);
      
      if (regRes.ok && concernsRes.ok) {
        const regData = await regRes.json();
        const concernsData = await concernsRes.json();
        setRegistrations(regData.registrations || []);
        setConcerns(concernsData.concerns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && selectedTripId) {
      fetchTripData();
      setSelectedReg(null);
    }
  }, [isAuthenticated, selectedTripId]);

  const handleStatusChange = async (regId: string, nextStatus: string) => {
    const isAssigned = trips.some((t) => t.id === selectedTripId);
    if (!isAssigned) {
      alert("Unauthorized: You do not coordinate this event.");
      return;
    }
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status: nextStatus, token }),
      });
      if (res.ok) {
        alert(`Status updated to ${nextStatus}`);
        fetchTripData();
        if (selectedReg && selectedReg.id === regId) {
          setSelectedReg({ ...selectedReg, status: nextStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyConsentForm = async (regId: string, templateId: string = "legacy-consent") => {
    const isAssigned = trips.some((t) => t.id === selectedTripId);
    if (!isAssigned) {
      alert("Unauthorized: You do not coordinate this event.");
      return;
    }
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          verifiedConsentForms: { [templateId]: true },
          token,
        }),
      });
      if (res.ok) {
        alert("Consent Form verified successfully!");
        fetchTripData();
        if (selectedReg && selectedReg.id === regId) {
          const updatedVerifiedMap = {
            ...(selectedReg.verifiedConsentForms || {}),
            [templateId]: true,
          };
          
          const templates = selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0
            ? selectedTrip.consentTemplates
            : (selectedTrip?.consentFormTemplateUrl ? [{ id: "legacy-consent" }] : []);
          
          const allOk = templates.every((t) => updatedVerifiedMap[t.id]);

          setSelectedReg({
            ...selectedReg,
            verifiedConsentForms: updatedVerifiedMap,
            consentFormVerified: allOk,
          });
        }
      } else {
        alert("Failed to verify Consent Form.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRaiseConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !concernText.trim() || !user?.email) return;
    const isAssigned = trips.some((t) => t.id === selectedTripId);
    if (!isAssigned) {
      alert("Unauthorized: You do not coordinate this event.");
      return;
    }
    setSubmittingConcern(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/coordinator/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          studentEmail: selectedReg.email,
          coordinatorEmail: user.email,
          concernText: concernText,
          token,
        }),
      });

      if (res.ok) {
        alert("Concern flagged successfully!");
        setConcernText("");
        fetchTripData();
      } else {
        alert("Failed to save concern.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving concern.");
    } finally {
      setSubmittingConcern(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setTrips([]);
      setRegistrations([]);
      setConcerns([]);
      setSelectedReg(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <Loader2Icon className="animate-spin text-amber-900 w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-[#f3a847] to-[#f3a847] flex items-center justify-center p-4">
        <div className="bg-[#b8d4b3] border-[3px] border-black p-6 rounded-[20px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] max-w-md w-full">
          <div className="flex justify-end gap-2 border-b-[3px] border-black pb-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-black" />
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-black" />
            <div className="w-3 h-3 rounded-full bg-indigo-400 border-2 border-black" />
          </div>
          <div className="bg-amber-50 p-6 border-[3px] border-black rounded-xl text-center">
            <h1 className="text-[#6d432b] font-black text-2xl mb-4 uppercase">
              Coordinator Login
            </h1>
            <p className="text-sm text-amber-950 mb-6 font-semibold">
              Sign in with your Google account to verify your trip coordinator permissions.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-[#4d2a18] rounded-full translate-y-1" />
                <div className="relative bg-[#6d432b] text-white py-2.5 rounded-full font-bold transition-transform group-active:translate-y-1">
                  {authLoading ? "Verifying Coordinator ID..." : "Sign in with Google"}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white border-[3px] border-black rounded-2xl shadow-xl overflow-hidden">
        
        {/* Dashboard Header */}
        <div className="bg-[#b8d4b3] border-b-[3px] border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="text-[#6d432b]" />
            <h1 className="text-xl font-black text-[#6d432b] uppercase">Coordinator Control Room</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[#6d432b]">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg border-2 border-black text-xs hover:bg-red-700 flex items-center gap-1"
            >
              <LogOutIcon className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
          
          {/* Column 1: Trip & Registration Selection */}
          <div className="p-4 space-y-4 lg:col-span-1">
            <div>
              <label className="block text-sm font-black text-[#6d432b] uppercase mb-2">Select Coordinated Trip</label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full p-2 border-2 border-black rounded bg-amber-50 font-bold"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {assignedOption && (
                <div className="mt-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-2.5 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Assigned Scope</p>
                    <p className="text-xs font-black text-indigo-950">Option / City: <span className="underline">{assignedOption}</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-sm text-[#6d432b] uppercase">Registrations ({registrations.length})</h3>
              {loading ? (
                <div className="flex justify-center p-8"><Loader2Icon className="animate-spin text-gray-500" /></div>
              ) : registrations.length === 0 ? (
                <p className="text-sm text-gray-400 font-semibold text-center py-6">No registration entries found.</p>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {registrations.map((reg) => {
                    const studentConcerns = concerns.filter((c) => c.studentEmail === reg.email);
                    return (
                      <button
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition ${
                          selectedReg?.id === reg.id
                            ? "bg-amber-100 border-black shadow"
                            : "bg-gray-50 border-gray-200 hover:border-black"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-sm text-gray-900 truncate">{reg.email}</p>
                          {studentConcerns.length > 0 && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-300 uppercase">
                              Concern ({studentConcerns.length})
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase">{reg.gender}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            reg.status === "paid" ? "bg-green-100 text-green-700 border-green-200" :
                            (reg.status === "approved_to_pay" || reg.status === "mail_sent") ? "bg-blue-100 text-blue-700 border-blue-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}>{reg.status === "mail_sent" ? "approved & mailed" : reg.status}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Detailed Profile Review & Concerns Raising */}
          <div className="lg:col-span-2 p-6 bg-gray-50 flex flex-col justify-between min-h-[450px]">
            {selectedReg ? (
              <div className="space-y-6">
                
                {/* Back Link / Profile Heading */}
                <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase">Applicant Profile</h2>
                    <p className="text-xs text-gray-500 font-semibold">{selectedReg.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedTrip?.isCompleted ? (
                      <>
                        {selectedReg.status === "registered" && (
                          <button
                            disabled={
                              !(selectedReg.studentIdVerified || selectedReg.aadhaarVerified) ||
                              !!(
                                !selectedReg.consentFormVerified && (
                                  (selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0) ||
                                  selectedTrip?.consentFormTemplateUrl
                                )
                              )
                            }
                            title={
                              !(selectedReg.studentIdVerified || selectedReg.aadhaarVerified)
                                ? "Student ID must be verified first"
                                : (!selectedReg.consentFormVerified && (
                                    (selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0) ||
                                    selectedTrip?.consentFormTemplateUrl
                                  ))
                                ? "All consent forms must be verified first"
                                : "Approve"
                            }
                            onClick={() => handleStatusChange(selectedReg.id, "approved_to_pay")}
                            className="bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1.5 transition-all"
                          >
                            <UserCheckIcon className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {(selectedReg.status === "approved_to_pay" || selectedReg.status === "mail_sent") && (
                          <button
                            onClick={() => handleStatusChange(selectedReg.id, "registered")}
                            className="bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700"
                          >
                            Deactivate Approval
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">Event Completed (Read-Only)</span>
                    )}
                  </div>
                </div>

                {/* Aadhaar & Consent Documents Review */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <h3 className="font-black text-sm text-amber-950 uppercase flex items-center gap-1.5">
                    🪪 Identity & Consent Review
                  </h3>
                  <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-xs grid grid-cols-1 gap-4">
                    <div className="border-b pb-3 border-amber-200">
                      <p className="text-gray-500 font-bold uppercase text-[10px]">
                        Student ID Gating Status
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`font-black px-2 py-0.5 rounded border uppercase text-[10px] ${
                          (selectedReg.studentIdVerified || selectedReg.aadhaarVerified)
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                          {(selectedReg.studentIdVerified || selectedReg.aadhaarVerified) ? "Verified ✅" : "Unverified ❌"}
                        </span>
                        {(selectedReg.formData?.["Student ID Card Copy"] || selectedReg.formData?.["Aadhaar Card Copy"]) && (
                          <a
                            href={getDocumentUrl(selectedReg.formData["Student ID Card Copy"] || selectedReg.formData["Aadhaar Card Copy"])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-900 hover:bg-amber-800 text-white font-bold px-2 py-1 rounded text-[10px] shadow"
                          >
                            Access Student ID Copy ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Multiple Consent Forms */}
                    {(() => {
                      const templates = selectedTrip?.consentTemplates && selectedTrip.consentTemplates.length > 0
                        ? selectedTrip.consentTemplates
                        : (selectedTrip?.consentFormTemplateUrl ? [{ id: "legacy-consent", name: "Completed Consent Form", templateUrl: selectedTrip.consentFormTemplateUrl }] : []);

                      if (templates.length === 0) return null;

                      return (
                        <div className="space-y-3">
                          <p className="text-gray-500 font-bold uppercase text-[10px]">Consent Forms ({templates.length})</p>
                          <div className="space-y-2">
                            {templates.map((t) => {
                              const fileKey = t.id === "legacy-consent" ? "Completed Consent Form" : `Completed Consent - ${t.name}`;
                              const uploadedUrl = selectedReg.formData[fileKey];
                              const isVerified = t.id === "legacy-consent"
                                ? selectedReg.consentFormVerified
                                : (selectedReg.verifiedConsentForms?.[t.id] || false);

                              return (
                                <div key={t.id} className="bg-white/50 p-2.5 rounded border border-amber-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-gray-800">{t.name}</p>
                                    <p className="text-[9px] text-gray-400">
                                      Template: <a href={getDocumentUrl(t.templateUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-900 underline font-semibold">Download ↗</a>
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`font-black px-2 py-0.5 rounded border uppercase text-[9px] ${
                                      isVerified
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : "bg-red-100 text-red-700 border-red-200"
                                    }`}>
                                      {isVerified ? "Verified ✅" : "Unverified ❌"}
                                    </span>
                                    {uploadedUrl ? (
                                      <>
                                        <a
                                          href={getDocumentUrl(uploadedUrl)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-2 py-1 rounded text-[9px] shadow"
                                        >
                                          View Copy ↗
                                        </a>
                                        {!isVerified && (
                                          <button
                                            onClick={() => handleVerifyConsentForm(selectedReg.id, t.id)}
                                            className="bg-green-700 hover:bg-green-600 text-white font-bold px-2 py-1 rounded text-[9px] shadow"
                                          >
                                            Verify
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-red-700 font-semibold text-[10px]">Not uploaded</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  </div>
                </div>

                {/* Form Data Fields */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-black text-sm text-gray-700 uppercase mb-3 flex items-center gap-1.5">
                    <FileTextIcon className="w-4 h-4 text-gray-500" /> Registration Answers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedReg.formData || {})
                      .filter(([key]) => key !== "Student ID Number" && key !== "Student ID Card Copy" && key !== "Aadhaar Number" && key !== "Aadhaar Card Copy" && key !== "Completed Consent Form" && !key.startsWith("Completed Consent -"))
                      .map(([key, val]) => (
                      <div key={key} className="border-b border-gray-100 pb-2">
                        <p className="text-xs text-gray-400 font-black uppercase">{key}</p>
                        <p className="text-sm font-semibold text-gray-800">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Existing Concerns List */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <h3 className="font-black text-sm text-red-800 uppercase mb-3 flex items-center gap-1.5">
                    <ShieldAlertIcon className="w-4 h-4" /> Coordinator Concern Records
                  </h3>
                  {concerns.filter((c) => c.studentEmail === selectedReg.email).length === 0 ? (
                    <p className="text-xs text-red-600 font-bold">No concerns flagged for this student.</p>
                  ) : (
                    <div className="space-y-3">
                      {concerns
                        .filter((c) => c.studentEmail === selectedReg.email)
                        .map((c) => (
                          <div key={c.id} className="bg-white p-3 rounded border border-red-150 text-xs">
                            <p className="font-bold text-red-800 mb-1">{c.concernText}</p>
                            <p className="text-[10px] text-gray-400">Flagged by: {c.coordinatorEmail}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Raise Concern Form */}
                {!selectedTrip?.isCompleted ? (
                  <form onSubmit={handleRaiseConcern} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="font-black text-sm text-gray-700 uppercase">Raise Concern / Flag Student</h3>
                    <textarea
                      required
                      rows={2}
                      value={concernText}
                      onChange={(e) => setConcernText(e.target.value)}
                      placeholder="Write details about the concern (e.g. invalid document, previous behavior issues)..."
                      className="w-full p-2 border border-gray-300 rounded text-sm font-medium outline-none focus:border-black resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingConcern}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                    >
                      {submittingConcern ? "Submitting Concern..." : "Flag Student Concern"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-900/10 text-xs text-amber-900 font-bold text-center">
                    Trip is completed. Cannot flag new student concerns.
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 font-bold my-auto uppercase tracking-wide">
                Select an applicant from the sidebar to review profile & manage concerns.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
