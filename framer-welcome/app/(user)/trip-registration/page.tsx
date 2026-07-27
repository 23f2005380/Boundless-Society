"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import UserRegistrationForm from "@/components/UserRegistrationForm";

interface Trip {
  id: string;
  name: string;
  description?: string;
  registrationOpen: boolean;
  paymentOpen: boolean;
  totalSeats: number;
  predefinedGirlsThreshold: number;
  femaleJoined: number;
  totalJoined: number;
  fee?: number;
  form?: { fields: any[] };
  consentFormTemplateUrl?: string;
  whatsappLink?: string;
  qrCodeUrl?: string;
}

const getDocumentUrl = (url: string) => {
  if (!url) return "";
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  let filename = lastPart;
  return `/api/downloadProxy/${encodeURIComponent(filename)}?url=${encodeURIComponent(url)}`;
};

export default function SecureForm() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [autofillData, setAutofillData] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const [reuploadAadhaar, setReuploadAadhaar] = useState<File | null>(null);
  const [reuploadConsent, setReuploadConsent] = useState<File | null>(null);
  const [reuploading, setReuploading] = useState(false);
  const [correctionValues, setCorrectionValues] = useState<Record<string, any>>({});

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch all trips
  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await fetch("/api/trip");
        if (res.ok) {
          const data = await res.json();
          const allTrips = data.trips || [];
          const activeTrips = allTrips.filter((t: any) => !t.isCompleted && !t.finalRosterSaved);
          setTrips(activeTrips);
          if (activeTrips.length > 0) {
            // Default to first active trip or url param
            const params = new URLSearchParams(window.location.search);
            const urlTripId = params.get("tripId");
            if (urlTripId && activeTrips.some((t: any) => t.id === urlTripId)) {
              setSelectedTripId(urlTripId);
            } else {
              setSelectedTripId(activeTrips[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading trips:", err);
      }
    }
    fetchTrips();
  }, []);

  // Sync selected trip metadata
  useEffect(() => {
    if (selectedTripId) {
      const match = trips.find((t) => t.id === selectedTripId);
      if (match) {
        setSelectedTrip(match);
      } else {
        // Fetch trip directly if not in list
        const fetchSingleTrip = async () => {
          try {
            const res = await fetch(`/api/trip`);
            if (res.ok) {
              const data = await res.json();
              const tripMatch = data.trips?.find((t: any) => t.id === selectedTripId);
              if (tripMatch) setSelectedTrip(tripMatch);
            }
          } catch (e) {
            console.error(e);
          }
        };
        fetchSingleTrip();
      }
    }
  }, [selectedTripId, trips]);

  // Auth subscriber
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        if (!email || !email.endsWith("iitm.ac.in")) {
          alert("Only IIT Madras student email accounts (@study.iitm.ac.in / @iitm.ac.in) are allowed!");
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch registration & autofill details once user and trip are selected
  const fetchStatus = async () => {
    if (!user || !selectedTripId) return;
    setStatusLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/user-registration?tripId=${selectedTripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRegistration(data.registration);
        setAutofillData(data.autofillData);
      }
    } catch (err) {
      console.error("Error fetching registration status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user, selectedTripId]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRegistration(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handlePayment = async () => {
    if (!user || !selectedTripId || !registration) return;
    setPaying(true);
    try {
      const token = await user.getIdToken();
      // Initialize payment with Razorpay backend API
      const initRes = await fetch("/api/payment/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: selectedTripId,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        alert(initData.error || "Failed to initialize payment");
        setPaying(false);
        return;
      }

      const options = {
        key: initData.key,
        amount: initData.amount,
        currency: initData.currency,
        name: selectedTrip?.name || "Boundless Society Trip",
        description: "Seat registration fee",
        order_id: initData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment signature
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: initData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                sessionId: initData.sessionId,
                tripId: selectedTripId,
                registrationId: registration.id,
              }),
            });

            if (verifyRes.ok) {
              alert("Payment Verified! Your seat is secured. ✅");
              fetchStatus();
            } else {
              const verifyData = await verifyRes.json();
              alert(verifyData.error || "Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#6d432b",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
        setPaying(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong with the payment gateway.");
      setPaying(false);
    }
  };

  const handleReupload = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any corrections were made
    const hasCorrections = Object.keys(correctionValues).length > 0;

    if (!hasCorrections) {
      alert("Please provide the requested corrections before submitting.");
      return;
    }

    if (!user || !selectedTripId) return;

    setReuploading(true);
    try {
      const token = await user.getIdToken();
      const formDataUpdates: any = { ...correctionValues };

      // Upload file fields if any
      const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      };

      const loadPdfJs = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).pdfjsLib) {
            resolve((window as any).pdfjsLib);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
          script.onload = () => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
            resolve((window as any).pdfjsLib);
          };
          script.onerror = () => reject(new Error("Failed to load PDF library"));
          document.head.appendChild(script);
        });
      };

      const convertPdfToJpg = async (file: File): Promise<string> => {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        const pagesData = [];
        let totalHeight = 0;
        let maxWidth = 0;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          pagesData.push({ page, viewport });
          totalHeight += viewport.height;
          maxWidth = Math.max(maxWidth, viewport.width);
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get canvas context");
        canvas.height = totalHeight;
        canvas.width = maxWidth;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = 0;
        for (const { page, viewport } of pagesData) {
          const renderCanvas = document.createElement("canvas");
          renderCanvas.width = viewport.width;
          renderCanvas.height = viewport.height;
          const renderContext = renderCanvas.getContext("2d");

          await page.render({ canvasContext: renderContext, viewport }).promise;

          context.drawImage(renderCanvas, 0, currentY);
          currentY += viewport.height;
        }

        return canvas.toDataURL("image/jpeg", 0.85);
      };

      const filePromises = Object.entries(correctionValues).map(async ([key, value]) => {
        if (value instanceof File) {
          let base64Image;
          if (value.type === "application/pdf" || value.name?.toLowerCase().endsWith(".pdf")) {
            try {
              base64Image = await convertPdfToJpg(value);
            } catch (pdfErr) {
              console.error("PDF to JPG conversion failed, falling back to base64 pdf:", pdfErr);
              base64Image = await convertToBase64(value);
            }
          } else {
            base64Image = await convertToBase64(value);
          }

          const fileRes = await fetch("/api/uploadImage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              images: [base64Image],
              folder: "trip_registrations",
              email: user?.email || "anonymous",
              tripName: selectedTrip?.name || "Event",
              subFolderType: key.includes("ID") ? "Student IDs" : (key.includes("Consent") ? "Consent Forms" : "Form Files"),
            })
          });
          if (!fileRes.ok) throw new Error(`${key} upload failed`);
          const fileJson = await fileRes.json();
          formDataUpdates[key] = fileJson.images[0].secure_url || fileJson.images[0];
        }
      });
      await Promise.all(filePromises);

      const patchRes = await fetch("/api/user-registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tripId: selectedTripId, formDataUpdates })
      });

      if (!patchRes.ok) throw new Error("Failed to update registration");

      alert("Corrections submitted successfully!");
      setCorrectionValues({});
      fetchStatus();
    } catch (error) {
      console.error("Re-upload error:", error);
      alert("Failed to submit corrections. Please try again.");
    } finally {
      setReuploading(false);
    }
  };

  const renderAadhaarStatus = () => {
    const idNumber = registration?.formData?.["Student ID Number"] || registration?.formData?.["Aadhaar Number"];
    const idCopy = registration?.formData?.["Student ID Card Copy"] || registration?.formData?.["Aadhaar Card Copy"];
    const isVerified = registration?.studentIdVerified || registration?.aadhaarVerified || false;
    const labelType = registration?.formData?.["Student ID Card Copy"] ? "Student ID" : "Aadhaar";

    if (!registration || !idCopy) return null;
    return (
      <div className="mt-6 bg-zinc-50 border-2 border-[#3E1126]/10 rounded-xl p-4 text-left w-full space-y-2.5">
        <div className="flex items-center gap-2 text-[#3E1126] font-oswald font-bold text-xs uppercase tracking-wider">
          <span>🪪</span> {labelType} Verification Status
        </div>
        {idNumber && (
          <div className="flex justify-between items-center text-xs text-[#3E1126]/80 font-medium">
            <span>{labelType} Number:</span>
            <strong className="font-semibold text-sm text-[#3E1126]">
              {idNumber.length > 4 ? `XXXX-XXXX-${idNumber.slice(-4)}` : idNumber}
            </strong>
          </div>
        )}
        <div className="flex justify-between items-center text-xs text-[#3E1126]/80 font-medium">
          <span>Status:</span>
          <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${isVerified
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200"
            }`}>
            {isVerified ? "Verified ✅" : "Pending Review ⏳"}
          </span>
        </div>
        {idCopy && (
          <div className="pt-2 border-t border-[#3E1126]/10 flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Uploaded Copy:</span>
            <a
              href={getDocumentUrl(idCopy)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#3E1126] underline hover:text-[#3E1126]/85 flex items-center gap-1"
            >
              View Copy ↗
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) return null;

  // Decision Gating for Payment
  const isMale = registration?.gender === "male";
  const girlsThreshold = selectedTrip?.predefinedGirlsThreshold || 0;
  const femalePaidCount = selectedTrip?.femaleJoined || 0;
  const isBoyBlocked = isMale && (femalePaidCount < girlsThreshold);
  const seatsFull = selectedTrip ? (selectedTrip.totalJoined >= selectedTrip.totalSeats) : false;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-sans antialiased bg-dots" style={{ backgroundColor: '#FAF6ED' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .bg-dots {
          background-image: radial-gradient(rgba(62, 17, 38, 0.08) 2px, transparent 2px);
          background-size: 24px 24px;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #3E1126 !important;
        }
      `}} />

      <div className="w-full max-w-md relative flex flex-col items-center justify-center">

        {!user ? (
          <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden relative flex flex-col border border-black/5 p-8 text-center space-y-6" data-lenis-prevent>
            <h1 className="text-3xl font-oswald font-bold text-[#3E1126] uppercase tracking-wide">
              Trip Registration
            </h1>
            {selectedTrip && (
              <div className="px-4 py-2 bg-zinc-50 rounded-xl border-2 border-[#3E1126]/10 text-[#3E1126] font-bold text-sm uppercase tracking-wide">
                Event: {selectedTrip.name}
              </div>
            )}
            <h3 className="text-[#3E1126] font-bold text-sm">
              Sign in with your student email ID to continue
            </h3>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-2 text-sm font-bold text-black bg-[#FCE16D] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(252,225,109,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Sign in with Google
            </button>
          </div>
        ) : statusLoading ? (
          <div className="w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border border-black/5">
            <div className="text-[#3E1126] font-oswald font-bold text-xl uppercase tracking-wide animate-pulse">Verifying status...</div>
          </div>
        ) : !registration ? (
          // Form Registration view
          selectedTrip?.registrationOpen === false ? (
            <div className="w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border border-black/5">
              <div className="text-red-700 font-bold text-xl p-4 border-2 border-red-500/20 rounded-xl bg-red-50">
                Registration for this trip is currently closed.
              </div>
            </div>
          ) : (
            <UserRegistrationForm
              user={user}
              setUser={setUser}
              tripId={selectedTripId}
              autofillData={autofillData}
              onSuccess={fetchStatus}
            />
          )
        ) : (
          // Status steps
          <div className="w-full flex flex-col items-center justify-center">
            {registration.status === "registered" && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-16 h-16 bg-[#FCE16D] rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-3xl">⏳</span>
                </div>
                <h2 className="text-2xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Under Review</h2>
                <p className="text-[#3E1126]/80 text-sm font-medium leading-relaxed mb-4">
                  Your profile details have been submitted and are currently being reviewed by trip coordinators.
                </p>
                <p className="text-xs text-[#3E1126] font-bold p-3 bg-zinc-50 rounded-xl border-2 border-[#3E1126]/10">
                  Please check back later. Once approved, your Payment Link will activate here!
                </p>
                {renderAadhaarStatus()}
                <button
                  onClick={handleLogout}
                  className="mt-6 text-xs font-bold font-oswald uppercase tracking-widest text-zinc-400 hover:text-[#3E1126] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {registration.status === "action_required" && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-3xl text-amber-600">⚠️</span>
                </div>
                <h2 className="text-2xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Action Required</h2>
                <p className="text-[#3E1126]/80 text-sm font-medium leading-relaxed mb-4">
                  The organizers have requested additional action regarding your registration.
                </p>

                {registration.issueText && (
                  <div className="text-left text-sm text-amber-800 font-medium p-4 bg-amber-50 rounded-xl border-2 border-amber-200/50 mb-6">
                    <span className="font-bold text-amber-900 block mb-1">Issue Reported:</span>
                    {registration.issueText}
                  </div>
                )}

                <form onSubmit={handleReupload} className="space-y-4 text-left bg-zinc-50 border-2 border-[#3E1126]/10 rounded-xl p-5">
                  <h4 className="font-oswald font-bold text-sm uppercase tracking-wider text-[#3E1126] mb-3">Corrections Required</h4>

                  {registration.actionRequiredFields?.map((fieldName: string) => {
                    const isFileField = fieldName === "Student ID Card Copy" || fieldName === "Aadhaar Card Copy" || fieldName === "Completed Consent Form" ||
                      selectedTrip?.form?.fields?.find((f: any) => f.name === fieldName)?.type === "file";
                    const fieldType = selectedTrip?.form?.fields?.find((f: any) => f.name === fieldName)?.type || "short_text";

                    return (
                      <div key={fieldName} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{fieldName}</label>

                        {isFileField ? (
                          <input
                            type="file"
                            accept="image/*,.pdf,.docx"
                            required
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && file.size > 1024 * 1024) {
                                alert("File size must be less than 1MB");
                                e.target.value = '';
                                return;
                              }
                              setCorrectionValues(prev => ({ ...prev, [fieldName]: file || null }));
                            }}
                            className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#3E1126] file:text-white hover:file:bg-[#3E1126]/80 file:cursor-pointer file:transition-colors bg-white border-2 border-zinc-200 rounded-xl p-1"
                          />
                        ) : fieldType === "long_text" || fieldName === "Custom Reply" ? (
                          <textarea
                            required
                            placeholder={fieldName === "Custom Reply" ? "Type your reply to the organizer's message..." : `Enter corrected ${fieldName.toLowerCase()}...`}
                            value={correctionValues[fieldName] || ""}
                            onChange={(e) => setCorrectionValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                            className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-[#3E1126]/40 focus:outline-none min-h-[80px] resize-none"
                          />
                        ) : (
                          <input
                            type={fieldType === "date" ? "date" : fieldType === "email" ? "email" : "text"}
                            required
                            placeholder={`Enter corrected ${fieldName.toLowerCase()}...`}
                            value={correctionValues[fieldName] || ""}
                            onChange={(e) => setCorrectionValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                            className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-[#3E1126]/40 focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}

                  {(!registration.actionRequiredFields || registration.actionRequiredFields.length === 0) && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Your Reply</label>
                      <textarea
                        required
                        placeholder="Type your reply to the organizer's message..."
                        value={correctionValues["User Reply"] || ""}
                        onChange={(e) => setCorrectionValues(prev => ({ ...prev, ["User Reply"]: e.target.value }))}
                        className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-[#3E1126]/40 focus:outline-none min-h-[80px] resize-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={reuploading}
                    className="w-full mt-4 flex justify-center items-center gap-2 text-sm font-bold text-white bg-[#3E1126] px-6 py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {reuploading ? "Submitting..." : "Submit Updates"}
                  </button>
                </form>

                <button
                  onClick={handleLogout}
                  className="mt-6 text-xs font-bold font-oswald uppercase tracking-widest text-zinc-400 hover:text-[#3E1126] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {(registration.status === "approved_to_pay" || registration.status === "mail_sent") && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-16 h-16 bg-[#E8F8F5] rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-2xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Registration Approved!</h2>
                <p className="text-[#3E1126]/80 text-sm font-medium leading-relaxed mb-6">
                  Your profile has been verified and your seat is officially secured. Welcome to the trip!
                </p>

                <div className="space-y-4">
                  {selectedTrip?.whatsappLink && (
                    <a
                      href={selectedTrip.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex justify-center items-center gap-2 text-sm font-bold text-white bg-[#25D366] hover:bg-[#20BA56] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform inline-flex"
                    >
                      💬 Join Official WhatsApp Group
                    </a>
                  )}

                  {selectedTrip?.qrCodeUrl && (
                    <div className="bg-zinc-50 border-2 border-dashed border-[#3E1126]/20 rounded-2xl p-4 flex flex-col items-center">
                      <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Event QR Code</p>
                      <div className="relative w-48 h-48 bg-white border rounded-xl overflow-hidden shadow-inner p-2">
                        <img
                          src={getDocumentUrl(selectedTrip.qrCodeUrl)}
                          alt="Event QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-medium">Scan QR code for additional trip details & verify check-in.</p>
                    </div>
                  )}

                  {!selectedTrip?.whatsappLink && !selectedTrip?.qrCodeUrl && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-amber-800 text-xs font-medium">
                      ⚠️ No WhatsApp group or QR code has been set by the organizer for this event yet. Please check back later or contact your trip coordinators.
                    </div>
                  )}
                </div>

                {renderAadhaarStatus()}
                <button
                  onClick={handleLogout}
                  className="mt-6 text-xs font-bold font-oswald uppercase tracking-widest text-zinc-400 hover:text-[#3E1126] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {registration.status === "paid" && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-20 h-20 bg-gradient-to-br from-[#E4D5FF] to-[#8AA1FF] rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-4xl text-white">✓</span>
                </div>
                <h2 className="text-3xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Seat Confirmed!</h2>
                <p className="text-[#3E1126]/80 text-sm font-medium leading-relaxed mb-6">
                  Your payment has been verified. Your seat on the trip is officially secured. Pack your bags!
                </p>
                <div className="bg-zinc-50 rounded-xl border-2 border-[#3E1126]/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Transaction ID</p>
                  <p className="text-xs font-mono font-medium text-[#3E1126] break-all">{registration.razorpayPaymentId}</p>
                </div>
                {renderAadhaarStatus()}
                <button
                  onClick={handleLogout}
                  className="mt-6 text-xs font-bold font-oswald uppercase tracking-widest text-zinc-400 hover:text-[#3E1126] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {registration.status === "rejected" && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-3xl text-red-600">✕</span>
                </div>
                <h2 className="text-2xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Registration Declined</h2>
                <p className="text-[#3E1126]/80 text-sm font-medium leading-relaxed mb-6">
                  Your registration request for this trip has been declined by the organizers.
                </p>
                {renderAadhaarStatus()}
                <button
                  onClick={handleLogout}
                  className="mt-6 text-xs font-bold font-oswald uppercase tracking-widest text-zinc-400 hover:text-[#3E1126] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
