"use client";

import { useEffect, useState, useRef } from "react";
import { app, auth } from "@/lib/firebase";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function UserRegistrationForm({ user, setUser }) {
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

    useEffect(() => {
        if (!dbRef.current) return;
        const fetchForm = async () => {
            const q = query(collection(dbRef.current, "trips"), orderBy("createdAt", "desc"), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                const formFields = data?.form?.fields || [];
                const sorted = [...formFields].sort((a, b) => a.sortOrder - b.sortOrder);
                setFields(sorted);
            }
            setLoading(false);
        };
        fetchForm();
    }, []);

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

        if (!user) return;
        setSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const imageEntry = [...formData.entries()].find(([, value]) => value instanceof File && value.size > 0);
            const imageFieldName = imageEntry?.[0];
            const imageFile = imageEntry?.[1];
            const formDataObj = Object.fromEntries(formData.entries());

            if (imageFile) {
                const base64Image = await convertToBase64(imageFile);
                if (
                    !base64Image ||
                    typeof base64Image !== "string" ||
                    !base64Image.startsWith("data:image")
                ) {
                    throw new Error("Invalid image conversion");
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
                    throw new Error(data.error || "Upload failed");
                }
                const imageUrl = data.images[0].secure_url || data.images[0];
                formDataObj[imageFieldName] = imageUrl;
                console.log(formDataObj)
            }
            const token = await user.getIdToken();
            const res = await fetch("/api/user-registration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, formData: formDataObj }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                await signOut(auth);
                return;
            }
            alert("Form submitted successfully!");
        } catch (error) {
            console.error("Submission error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="w-full p-6">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6 items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-center text-[#6d432b]">
                    <div className="text-start">
                        <label className="text-lg font-medium px-2">Email</label>
                        <input
                            value={user.email}
                            disabled
                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent"
                        />
                    </div>

                    {fields.map((field) => {
                        switch (field.type) {
                            case "short_text":
                                return (
                                    <div key={field.id} className="text-start">
                                        <label className="text-lg font-medium px-2">{field.name}</label>
                                        <input
                                            name={field.name}
                                            type="text"
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
                                            rows="1"
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
                                                <label key={option} className="flex items-center space-x-2 mb-1">
                                                    <input
                                                        type="radio"
                                                        name={field.name}
                                                        value={option}
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
                                            onChange={(e) => handleChange(field.name, e.target.files[0])}
                                            className="w-full mt-1 p-2 border-b-2 border-l-2 border-amber-900 rounded bg-transparent outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-900 file:text-white hover:file:bg-amber-800 cursor-pointer"
                                        />
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>

                <button type="submit" disabled={submitting} className="relative group">
                    <div className="absolute inset-0 bg-[#4d2a18] rounded-full translate-y-1" />
                    <div className="relative bg-[#6d432b] text-white px-20 py-3 rounded-full font-bold transition-transform group-active:translate-y-1">
                        {submitting ? "Submitting..." : "Submit"}
                    </div>
                </button>
            </form>

            <button
                onClick={handleLogout}
                className="text-white bg-red-500 px-20 py-3 rounded-full mt-2 transition"
            >
                Logout
            </button>
        </div>
    );
}