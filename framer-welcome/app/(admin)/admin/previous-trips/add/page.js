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
  
  // State for form fields
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    heading: "",
    subHeading: "",
    link: "",
  });

  const handleUploadAndSave = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select an image first.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", "boundless_unsigned"); // Check this matches your Cloudinary settings

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Image upload failed");

      // 2. Send Data to your API
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

      if (!apiRes.ok) throw new Error("Failed to save trip to database");

      toast.success("Previous trip added successfully!");
      router.push("/admin/dashboard");

    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm mt-10">
      <h1 className="text-2xl font-bold mb-6">Add Previous Trip</h1>
      
      <form onSubmit={handleUploadAndSave} className="space-y-6">
        
        {/* Heading Input */}
        <div className="space-y-2">
          <Label htmlFor="heading">Trip Name (Heading)</Label>
          <Input
            id="heading"
            placeholder="e.g. Mewar Trip"
            required
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
            suppressHydrationWarning
          />
        </div>

        {/* SubHeading Input */}
        <div className="space-y-2">
          <Label htmlFor="subHeading">Date/Subtitle (SubHeading)</Label>
          <Input
            id="subHeading"
            placeholder="e.g. 12th to 15th Sept 2025"
            required
            value={formData.subHeading}
            onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })}
            suppressHydrationWarning
          />
        </div>

        {/* Link Input */}
        <div className="space-y-2">
          <Label htmlFor="link">Instagram/Reel Link (Optional)</Label>
          <Input
            id="link"
            placeholder="https://instagram.com/..."
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            suppressHydrationWarning
          />
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="image">Trip Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
            suppressHydrationWarning
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uploading & Saving..." : "Add Trip"}
        </Button>

      </form>
    </div>
  );
}