"use client";

import { useEffect, useState, useRef } from "react";
import { app, auth } from "@/lib/firebase";
import {
    getFirestore,
    doc,
    getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ShieldAlertIcon } from "lucide-react";

export default function UserRegistrationForm({ user, setUser, tripId, autofillData, onSuccess }) {
    const dbRef = useRef(null);
    const [dbReady, setDbReady] = useState(false);
    
    useEffect(() => {
        dbRef.current = getFirestore(app);
        setDbReady(true);
    }, []);

    const [fields, setFields] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Consent Form State
    const [showConsent, setShowConsent] = useState(false);

    // Aadhaar State (for first time users only)
    const isFirstTime = !autofillData || Object.keys(autofillData).length === 0;
    const [aadhaarNum, setAadhaarNum] = useState("");
    const [aadhaarFile, setAadhaarFile] = useState(null);

    useEffect(() => {
        if (!dbRef.current || !tripId) return;
        const fetchForm = async () => {
            try {
                const docRef = doc(dbRef.current, "trips", tripId);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const formFields = data?.form?.fields || [];
                    const sorted = [...formFields].sort((a, b) => a.sortOrder - b.sortOrder);
                    setFields(sorted);

                    // Initialize formValues from autofillData
                    if (autofillData) {
                        const prefilled = {};
                        sorted.forEach((field) => {
                            if (autofillData[field.name] !== undefined) {
                                prefilled[field.name] = autofillData[field.name];
                            }
                        });
                        setFormValues(prefilled);
                    }
                }
            } catch (err) {
                console.error("Error loading trip form fields:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [dbReady, tripId, autofillData]);

    const handleChange = (fieldName, value) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const convertToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !tripId) return;
        setSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const formDataObj = { ...formValues };

            // Upload Aadhaar Copy if it's first-time user
            if (isFirstTime) {
                if (!aadhaarNum || aadhaarNum.length !== 12 || isNaN(Number(aadhaarNum))) {
                    alert("Please enter a valid 12-digit Aadhaar number.");
                    setSubmitting(false);
                    return;
                }
                formDataObj["Aadhaar Number"] = aadhaarNum;
            }

            // Find all file entries (for questions + Aadhaar)
            const fileEntries = [...formData.entries()].filter(
                ([, value]) => value instanceof File && value.size > 0
            );

            for (const [fieldName, fileObj] of fileEntries) {
                const base64Image = await convertToBase64(fileObj);
                if (
                    !base64Image ||
                    typeof base64Image !== "string" ||
                    !base64Image.startsWith("data:image")
                ) {
                    throw new Error(`Invalid file format for ${fieldName}`);
                }
                const uploadRes = await fetch("/api/uploadImage", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        images: [base64Image],
                        folder: "trip_registrations",
                    }),
                });
                const data = await uploadRes.json();
                if (!uploadRes.ok) {
                    throw new Error(data.error || "File upload failed");
                }
                const imageUrl = data.images[0].secure_url || data.images[0];
                formDataObj[fieldName] = imageUrl;
            }

            const token = await user.getIdToken();
            const res = await fetch("/api/user-registration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, tripId, formData: formDataObj }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Submission failed");
                return;
            }
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            alert(error.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-4 text-[#6d432b] font-bold">Loading Form Fields...</div>;

    return (
        <div className="w-full p-6 text-[#6d432b]">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6 items-center">
                
                {/* Aadhaar Section for First-Time Users */}
                {isFirstTime && (
                    <div className="w-full bg-amber-100/50 p-5 border-2 border-dashed border-amber-900 rounded-xl space-y-4 mb-4 text-left">
                      <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlertIcon className="w-4 h-4 text-amber-900" /> First-time Registration Details
                      </h4>
                      <p className="text-xs text-amber-950 font-semibold">
                        Aadhaar verification is mandatory for first-time event registrations. This will be securely saved for auto-filling future event forms.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-start">
                          <label className="text-sm font-bold block mb-1">Aadhaar Card Number</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]{12}"
                            maxLength={12}
                            value={aadhaarNum}
                            onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 12-digit number"
                            className="w-full p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none font-bold"
                          />
                        </div>
                        <div className="text-start">
                          <label className="text-sm font-bold block mb-1">Aadhaar Card Copy (Upload Front/Back)</label>
                          <input
                            type="file"
                            required
                            accept="image/*"
                            name="Aadhaar Card Copy"
                            onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                            className="w-full p-1.5 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-amber-900 file:text-white hover:file:bg-amber-800"
                          />
                        </div>
                      </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-center w-full">
                    <div className="text-start">
                        <label className="text-lg font-medium px-2">Email</label>
                        <input
                            value={user.email}
                            disabled
                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none cursor-not-allowed"
                        />
                    </div>

                    {fields.map((field) => {
                        const currentVal = formValues[field.name] || "";
                        switch (field.type) {
                            case "short_text":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <input
                                            name={field.name}
                                            type="text"
                                            value={currentVal}
                                            required
                                            onChange={(e) => handleChange(field.name, e.target.value)}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none"
                                        />
                                    </div>
                                );
                            case "long_text":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <textarea
                                            name={field.name}
                                            rows={1}
                                            value={currentVal}
                                            required
                                            onChange={(e) => handleChange(field.name, e.target.value)}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none resize-none"
                                        />
                                    </div>
                                );
                            case "date":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <input
                                            name={field.name}
                                            type="date"
                                            value={currentVal}
                                            required
                                            onChange={(e) => handleChange(field.name, e.target.value)}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none"
                                        />
                                    </div>
                                );
                            case "radio":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <div className="grid grid-cols-2 items-center text-center mt-2">
                                            {field.options?.map((option) => (
                                                <label key={option} className="flex items-center space-x-2 mb-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={field.name}
                                                        value={option}
                                                        required
                                                        checked={formValues[field.name] === option}
                                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            case "select":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <select
                                            name={field.name}
                                            value={currentVal}
                                            required
                                            onChange={(e) => handleChange(field.name, e.target.value)}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none appearance-none"
                                        >
                                            <option value="" disabled className="bg-amber-100">Select an option</option>
                                            {field.options?.map((option) => (
                                                <option key={option} value={option} className="bg-amber-100">{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            case "file":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpg, image/jpeg"
                                            name={field.name}
                                            required={!currentVal}
                                            onChange={(e) => handleChange(field.name, e.target.files?.[0] || null)}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-900 file:text-white hover:file:bg-amber-800 cursor-pointer"
                                        />
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>

                {/* Consent Acknowledgment Checkbox */}
                <div className="flex flex-col items-center space-y-2 mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="consent-check"
                      required
                      className="w-4 h-4 cursor-pointer accent-amber-900"
                    />
                    <label htmlFor="consent-check" className="text-sm font-semibold cursor-pointer select-none">
                      I agree to the terms of the <button type="button" onClick={() => setShowConsent(true)} className="underline font-bold text-amber-900">Consent Form</button>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <button type="submit" disabled={submitting} className="relative group">
                        <div className="absolute inset-0 bg-[#4d2a18] rounded-full translate-y-1" />
                        <div className="relative bg-[#6d432b] text-white px-20 py-3 rounded-full font-bold transition-transform group-active:translate-y-1">
                            {submitting ? "Submitting..." : "Submit"}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-white bg-red-600 px-10 py-3 rounded-full font-bold transition hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </form>

            {/* Consent Form Modal Viewer */}
            {showConsent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-black">
                <div className="bg-white border-2 border-black rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-left">
                  <button
                    onClick={() => setShowConsent(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-black font-black"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-lg text-amber-950 uppercase border-b pb-2">
                    📝 Boundless Society Consent Form
                  </h3>
                  <div className="text-xs space-y-3 leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                    <p className="font-bold">UNDERTAKING & CONSENT BY THE PARTICIPANT</p>
                    <p>
                      1. I hereby confirm my participation in the upcoming trip organized by the Boundless Society. I acknowledge that I am participating of my own free will.
                    </p>
                    <p>
                      2. I certify that I am medically fit to travel and participate in the activities planned during the trip. In case of any emergency, the society coordinators are authorized to arrange medical assistance.
                    </p>
                    <p>
                      3. I agree to abide by the code of conduct of IIT Madras and the Boundless Society. Any misbehavior, consumption of prohibited substances, or violation of safety rules will lead to immediate cancellation of my participation and disciplinary action.
                    </p>
                    <p>
                      4. I understand that the society will take all reasonable safety precautions but shall not be held liable for any unforeseen losses, damages, or injuries.
                    </p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowConsent(false)}
                      className="bg-amber-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-amber-800 transition"
                    >
                      I Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            )}

        </div>
    );
}