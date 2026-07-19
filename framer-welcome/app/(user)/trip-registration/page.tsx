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

  const renderAadhaarStatus = () => {
    if (!registration || !registration.formData?.["Aadhaar Number"]) return null;
    return (
      <div className="mt-6 bg-zinc-50 border-2 border-[#3E1126]/10 rounded-xl p-4 text-left w-full space-y-2.5">
        <div className="flex items-center gap-2 text-[#3E1126] font-oswald font-bold text-xs uppercase tracking-wider">
          <span>🪪</span> Aadhaar Verification Status
        </div>
        <div className="flex justify-between items-center text-xs text-[#3E1126]/80 font-medium">
          <span>Aadhaar Number:</span>
          <strong className="font-semibold text-sm text-[#3E1126]">
            XXXX-XXXX-{registration.formData["Aadhaar Number"].slice(-4)}
          </strong>
        </div>
        <div className="flex justify-between items-center text-xs text-[#3E1126]/80 font-medium">
          <span>Status:</span>
          <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${
            registration.aadhaarVerified 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-yellow-100 text-yellow-700 border-yellow-200"
          }`}>
            {registration.aadhaarVerified ? "Verified ✅" : "Pending Review ⏳"}
          </span>
        </div>
        {registration.formData["Aadhaar Card Copy"] && (
          <div className="pt-2 border-t border-[#3E1126]/10 flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Uploaded Copy:</span>
            <a
              href={getDocumentUrl(registration.formData["Aadhaar Card Copy"])}
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
      <style dangerouslySetInnerHTML={{__html: `
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

            {registration.status === "approved_to_pay" && (
              <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-black/5 p-8 text-center" data-lenis-prevent>
                <div className="w-16 h-16 bg-[#E4D5FF] rounded-full flex items-center justify-center shadow-inner mb-6 mx-auto">
                  <span className="text-3xl">💳</span>
                </div>
                <h2 className="text-2xl font-oswald font-bold text-[#3E1126] uppercase mb-4">Approved for Payment</h2>
                
                {selectedTrip?.paymentOpen === false ? (
                  <p className="text-red-700 font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                    Payment for this trip is currently closed by the administrator.
                  </p>
                ) : seatsFull ? (
                  <p className="text-red-700 font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                    All seats are fully booked. Payment is now closed.
                  </p>
                ) : isBoyBlocked ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                    <p className="font-bold mb-2">Girls priority payment is currently active.</p>
                    Payment for male students will unlock once at least <strong>{girlsThreshold}</strong> female students have completed their payments (current paid girls: {femalePaidCount}).
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-[#3E1126]/80 text-sm font-medium">
                      Your profile has been verified! You can pay the registration fee to secure your seat.
                    </p>
                    <div className="bg-zinc-50 rounded-xl border-2 border-[#3E1126]/10 p-6 text-center">
                      <p className="text-xs font-oswald font-bold uppercase tracking-wider text-zinc-500 mb-1">Amount to Pay</p>
                      <p className="text-4xl font-black text-[#3E1126]">₹ {selectedTrip?.fee !== undefined ? Number(selectedTrip.fee).toFixed(2) : "500.00"}</p>
                    </div>

                    <button
                      onClick={handlePayment}
                      disabled={paying}
                      className="w-full flex justify-center items-center gap-2 text-sm font-bold text-black bg-[#FCE16D] px-6 py-3.5 rounded-full shadow-[0_4px_14px_0_rgba(252,225,109,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      {paying ? "Processing..." : "Pay securely via Razorpay"}
                    </button>
                  </div>
                )}

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
