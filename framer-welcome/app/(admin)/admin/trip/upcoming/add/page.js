"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminUploadForm() {
    const [title, setTitle] = useState("");
    const [registrationLink, setRegistrationLink] = useState("");
    const [details, setDetails] = useState("")
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log(file)
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed");
            return;
        }

        setImageFile(file);
        setPreview(URL.createObjectURL(file));
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

        if (!title || !registrationLink || !details || !imageFile) {
            alert("All fields are required");
            return;
        }

        try {
            setLoading(true);
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
                    folder: "upcoming_trips",
                }),
            });

            const data = await uploadRes.json();

            if (!uploadRes.ok) {
                throw new Error(data.error || "Upload failed");
            }

            const imageUrl =
                data.images[0].secure_url || data.images[0];

            await addDoc(collection(db, "upcoming_trips"), {
                title,
                registrationLink,
                details,
                imageUrl,
                createdAt: serverTimestamp(),
            });

            alert("Uploaded successfully ✅");

            // reset
            setTitle("");
            setRegistrationLink("");
            setDetails("");
            setImageFile(null);
            setPreview(null);

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 shadow rounded-lg bg-white">
            <h2 className="text-2xl font-bold mb-4">Upcoming Trip Upload</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className="block mb-1 font-medium">Title</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Registration Link</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={registrationLink}
                        onChange={(e) => setRegistrationLink(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Details</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Image</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                {preview && (
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-60 object-cover rounded"
                    />
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "Uploading..." : "Submit"}
                </button>
            </form>
        </div>
    );
}

