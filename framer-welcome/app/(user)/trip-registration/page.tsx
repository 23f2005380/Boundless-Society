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
      const res = await fetch(`/api/user-registration?token=${token}&tripId=${selectedTripId}`);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          token,
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
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: initData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                sessionId: initData.sessionId,
                tripId: selectedTripId,
                registrationId: registration.id,
                token,
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

  if (loading) return null;

  // Decision Gating for Payment
  const isMale = registration?.gender === "male";
  const girlsThreshold = selectedTrip?.predefinedGirlsThreshold || 0;
  const femalePaidCount = selectedTrip?.femaleJoined || 0;
  const isBoyBlocked = isMale && (femalePaidCount < girlsThreshold);
  const seatsFull = selectedTrip ? (selectedTrip.totalJoined >= selectedTrip.totalSeats) : false;

  return (
    <div className="relative min-h-dvh w-full bg-gradient-to-b from-amber-50 via-[#f3a847] to-[#f3a847] flex flex-col items-center justify-center py-10 overflow-hidden font-sans">
      <div className="z-10 w-[95%] h-full sm:w-4/5 bg-[#b8d4b3] border-[3px] border-black rounded-[20px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        
        {/* Retro Window Buttons */}
        <div className="p-4 flex justify-end gap-2 border-b-[3px] border-black bg-[#9fc499] rounded-t-[17px]">
          <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-indigo-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-white border-2 border-black" />
        </div>

        {/* Window Content */}
        <div className="bg-transparent p-3 w-full h-full">
          <div className="bg-amber-50 p-5 flex flex-col items-center text-center border-[3px] border-black rounded-xl overflow-hidden min-h-[400px]">
            <h1 className="text-[#6d432b] font-[900] text-2xl md:text-5xl leading-tight mb-4 uppercase tracking-tighter">
              Trip Registration
            </h1>

            {/* Selected Trip / Event Read-Only Display */}
            {selectedTrip && (
              <div className="mb-6 px-4 py-2 border-2 border-amber-900 rounded bg-amber-100 text-[#6d432b] font-black text-sm uppercase tracking-wide">
                Event: {selectedTrip.name}
              </div>
            )}

            {!user ? (
              <div className="space-y-6 my-auto">
                <h3 className="text-[#6d432b] font-black text-md tracking-widest">
                  Sign in only with your student email ID!
                </h3>
                <button
                  onClick={handleGoogleSignIn}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-[#4d2a18] rounded-full translate-y-1" />
                  <div className="relative bg-[#6d432b] text-white px-8 py-3 rounded-full font-bold transition-transform group-active:translate-y-1">
                    Sign in with Google
                  </div>
                </button>
              </div>
            ) : statusLoading ? (
              <div className="text-[#6d432b] font-bold text-lg my-auto">Verifying status...</div>
            ) : !registration ? (
              // Form Registration view
              selectedTrip?.registrationOpen === false ? (
                <div className="text-red-700 font-bold text-xl my-auto p-4 border-2 border-red-500 rounded bg-red-50">
                  Registration for this trip is currently closed.
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
              <div className="w-full flex flex-col items-center justify-center space-y-6 py-6">
                {registration.status === "registered" && (
                  <div className="bg-amber-100 border-2 border-amber-900 rounded-xl p-8 max-w-xl shadow">
                    <h2 className="text-[#6d432b] font-black text-2xl mb-4">🎉 Thank You for Registering!</h2>
                    <p className="text-[#6d432b] font-medium leading-relaxed">
                      Your profile details have been submitted and are currently being reviewed by trip coordinators and admins. 
                    </p>
                    <p className="text-sm text-amber-800 mt-4 italic font-bold">
                      Please log back in later. Once approved, your Payment Link will activate right here!
                    </p>
                    <button
                      onClick={handleLogout}
                      className="mt-6 text-white bg-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {registration.status === "approved_to_pay" && (
                  <div className="bg-indigo-50 border-2 border-indigo-900 rounded-xl p-8 max-w-xl shadow text-left w-full">
                    <h2 className="text-indigo-900 font-black text-2xl mb-4 text-center">💳 Seat Approved for Payment</h2>
                    
                    {selectedTrip?.paymentOpen === false ? (
                      <p className="text-red-700 font-bold text-center">
                        Payment for this trip is currently closed by the administrator.
                      </p>
                    ) : seatsFull ? (
                      <p className="text-red-700 font-bold text-center">
                        All seats are fully booked. Payment is now closed.
                      </p>
                    ) : isBoyBlocked ? (
                      <div className="bg-red-50 border border-red-300 rounded p-4 text-red-800 font-medium">
                        <p className="font-bold mb-2">Girls priority payment is currently active.</p>
                        Payment for male students will unlock once at least <strong>{girlsThreshold}</strong> female students have completed their payments (current paid girls: {femalePaidCount}).
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-indigo-950 font-medium text-center">
                          Your profile has been verified! You can pay the registration fee to secure your seat.
                        </p>
                        <div className="border border-indigo-200 rounded-lg p-4 bg-white text-center">
                          <p className="text-sm text-gray-500 font-bold">Amount to Pay</p>
                          <p className="text-3xl font-black text-indigo-950">₹ {selectedTrip?.fee !== undefined ? Number(selectedTrip.fee).toFixed(2) : "500.00"}</p>
                        </div>

                        <button
                          onClick={handlePayment}
                          disabled={paying}
                          className="w-full relative group mt-4"
                        >
                          <div className="absolute inset-0 bg-indigo-900 rounded-full translate-y-1" />
                          <div className="relative bg-indigo-700 hover:bg-indigo-600 text-white py-3 rounded-full font-bold text-center transition-transform group-active:translate-y-1">
                            {paying ? "Processing Payment..." : "Pay securely via Razorpay"}
                          </div>
                        </button>
                      </div>
                    )}

                    <div className="text-center mt-6">
                      <button
                        onClick={handleLogout}
                        className="text-white bg-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-700 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                {registration.status === "paid" && (
                  <div className="bg-green-50 border-2 border-green-950 rounded-xl p-8 max-w-xl shadow">
                    <h2 className="text-green-950 font-black text-3xl mb-4">Seat Confirmed! 🎉</h2>
                    <p className="text-green-900 font-bold leading-relaxed mb-2">
                      Your payment has been verified. Your seat on the trip is officially secured!
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      Transaction ID: {registration.razorpayPaymentId}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="mt-6 text-white bg-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {registration.status === "rejected" && (
                  <div className="bg-red-50 border-2 border-red-950 rounded-xl p-8 max-w-xl shadow">
                    <h2 className="text-red-950 font-black text-2xl mb-4">Registration Declined</h2>
                    <p className="text-red-900 font-bold leading-relaxed">
                      Your registration request for this trip has been declined by the organizers.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="mt-6 text-white bg-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
