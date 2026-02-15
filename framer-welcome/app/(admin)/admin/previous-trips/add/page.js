"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AddPreviousTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    heading: "",
    subHeading: "",
    link: "",
  });

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image first.");

    setLoading(true);
    try {
      // 1. Upload Image to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", "boundless_unsigned"); // Ensure this preset exists in Cloudinary

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: uploadFormData }
      );
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Image upload failed");

      // 2. Save Data to Firebase via your API
      const apiRes = await fetch("/api/previous-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: formData.heading,
          subHeading: formData.subHeading,
          img: uploadData.secure_url,
          link: formData.link,
        }),
      });

      if (!apiRes.ok) throw new Error("Failed to save to database");

      toast.success("Trip added successfully!");
      router.push("/admin/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm mt-10">
      <h1 className="text-2xl font-bold mb-6">Add Previous Trip</h1>
      <form onSubmit={handleUploadAndSave} className="space-y-6">
        <div className="space-y-2">
          <Label>Trip Name (Heading)</Label>
          <Input 
            required 
            placeholder="e.g. Mewar Trip"
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Date/Subtitle (SubHeading)</Label>
          <Input 
            required 
            placeholder="e.g. 12th - 15th Sept"
            value={formData.subHeading}
            onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Link (Optional)</Label>
          <Input 
            placeholder="Instagram link etc."
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Trip Image</Label>
          <Input 
            type="file" 
            accept="image/*" 
            required 
            onChange={(e) => setFile(e.target.files?.[0])}
            className="cursor-pointer" 
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uploading..." : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}