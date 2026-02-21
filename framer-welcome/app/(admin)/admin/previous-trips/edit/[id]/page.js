"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EditTripPage() {
  const router = useRouter();
  const { id } = useParams(); // Get ID from URL
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    heading: "",
    subHeading: "",
    link: "",
    img: "", // Store existing image URL here
  });

  // Fetch Existing Data
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/previous-trips/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch trip");

        setFormData({
          heading: data.heading || "",
          subHeading: data.subHeading || "",
          link: data.link || "",
          img: data.img || "",
        });
      } catch (error) {
        toast.error("Error loading trip details");
        router.push("/admin/previous-trips");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTrip();
  }, [id, router]);

  // Helper to convert file to Base64 (reused from Add page logic)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.img;

      // 1. If a NEW file is selected, upload it
      if (file) {
        const base64Image = await convertFileToBase64(file);
        
        // Use your API upload route
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [base64Image], folder: "previous_trips" }),
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        
        imageUrl = uploadData.links?.[0];
      }

      // 2. Update Database via API
      const apiRes = await fetch(`/api/previous-trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: formData.heading,
          subHeading: formData.subHeading,
          link: formData.link,
          img: imageUrl, // Update with new URL or keep old one
        }),
      });

      if (!apiRes.ok) throw new Error("Failed to update trip");

      toast.success("Trip updated successfully!");
      router.push("/admin/previous-trips"); // Redirect to manage list

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10">Loading trip data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Previous Trip</h1>
      
      <form onSubmit={handleUpdate} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="heading">Trip Name</Label>
          <Input
            id="heading"
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
            required
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subHeading">Subtitle / Date</Label>
          <Input
            id="subHeading"
            value={formData.subHeading}
            onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })}
            required
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Link (Optional)</Label>
          <Input
            id="link"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Trip Image</Label>
          
          {/* Preview Existing Image */}
          {formData.img && !file && (
            <div className="mb-2">
              <img src={formData.img} alt="Current" className="h-40 object-cover rounded-md border" />
              <p className="text-xs text-muted-foreground mt-1">Current Image</p>
            </div>
          )}

          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer file:text-foreground"
            suppressHydrationWarning
          />
          <p className="text-xs text-muted-foreground">Leave empty to keep current image.</p>
        </div>

        <div className="flex gap-4">
            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving Changes..." : "Update Trip"}
            </Button>
        </div>

      </form>
    </div>
  );
}