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

  // Helper to convert file to Base64 for the signed upload API
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };


  const handleUploadAndSave = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select an image first.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload to Cloudinary via YOUR Server using FormData
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "previous_trips");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");

      const imageUrl = uploadData.links?.[0]; 
      if (!imageUrl) throw new Error("No image URL returned from upload");

      // 2. Send Data to your Database API
      const apiRes = await fetch("/api/previous-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: formData.heading,
          subHeading: formData.subHeading,
          img: imageUrl,
          link: formData.link,
        }),
      });

      if (!apiRes.ok) throw new Error("Failed to save trip to database");

      toast.success("Previous trip added successfully!");
      
      // Redirect back to the list
      router.push("/admin/previous-trips");

    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add Previous Trip</h1>
      
      <form onSubmit={handleUploadAndSave} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="heading">Trip Name (Heading)</Label>
          <Input
            id="heading"
            placeholder="e.g. Mewar Trip"
            required
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subHeading">Date/Subtitle (SubHeading)</Label>
          <Input
            id="subHeading"
            placeholder="e.g. 12th to 15th Sept 2025"
            required
            value={formData.subHeading}
            onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Instagram/Reel Link (Optional)</Label>
          <Input
            id="link"
            placeholder="https://instagram.com/..."
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Trip Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer file:text-foreground"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uploading & Saving..." : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}