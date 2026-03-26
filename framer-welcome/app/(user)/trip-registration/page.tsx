"use client";
import UserRegistrationForm from "@/components/UserRegistrationForm";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function SecureForm() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        if (!email || !email.endsWith("iitm.ac.in")) {
          alert("Only IIT madras student email accounts are allowed !!");
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

  // Google Sign-In (Popup)
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // provider.setCustomParameters({
      //   hd: "study.iitm.ac.in"
      // });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  if (loading) return null;

  return (
    <div className="relative min-h-dvh w-full bg-gradient-to-b from-amber-50 via-[#f3a847] to-[#f3a847] flex flex-col items-center justify-center py-10 overflow-hidden font-sans">
      <div className="z-10 w-[95%] h-full sm:w-4/5 bg-[#b8d4b3] border-[3px] border-black rounded-[20px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">

        {/* Window circular button */}
        <div className="p-4 flex justify-end gap-2 border-b-[3px] border-black">
          <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-indigo-400 border-2 border-black" />
          <div className="w-4 h-4 rounded-full bg-white border-2 border-black" />
        </div>

        {/* Window Content */}
        <div className="bg-transparent p-3 w-full h-full">
          <div className="bg-amber-50 p-5 flex flex-col items-center text-center border-[3px] border-black rounded-xl overflow-hidden">
            <h1 className="text-[#6d432b] font-[900] text-2xl md:text-5xl leading-tight mb-2 uppercase tracking-tighter">
              Trip Registration Form
            </h1>
            {!user && (
              <div className="space-y-10">
                <h3 className="text-[#6d432b] font-black text-md tracking-widest mb-1">
                  Sign in only with your student email id!
                </h3>
                <button
                  onClick={handleGoogleSignIn}
                  className="relative group">
                  <div className="absolute inset-0 bg-[#4d2a18] rounded-full translate-y-1" />
                  <div className="relative bg-[#6d432b] text-white px-8 py-3 rounded-full font-bold transition-transform group-active:translate-y-1">
                    Sign in with Google
                  </div>
                </button>
              </div>
            )}

            {user && (
              <>
                <UserRegistrationForm user={user} setUser={setUser} />
              </>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};
