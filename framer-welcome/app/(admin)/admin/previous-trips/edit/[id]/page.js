"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function EditTripPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    heading: "", 
    subHeading: "", 
    link: "", 
    img: "" 
  });
  
  const [newImage, setNewImage] = useState({ file: null, preview: null, base64: null });

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/previous-trips?id=${id}`);
        const data = await res.json();
        if (res.ok) setFormData({ 
          heading: data.heading || "", 
          subHeading: data.subHeading || "", 
          link: data.link || "", 
          img: data.img || "" 
        });
      } catch (error) { 
        toast.error("Error loading trip details"); 
        router.push("/admin/previous-trips"); 
      } finally { setLoading(false); }
    };
    if (id) fetchTrip();
  }, [id, router]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage({ file, preview: reader.result, base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = formData.img;

      if (newImage.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [newImage.base64], folder: "previous_trips" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0];
      }

      const apiRes = await fetch(`/api/previous-trips`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...formData, img: imageUrl }),
      });

      if (!apiRes.ok) throw new Error("Failed to update trip");
      toast.success("Trip updated successfully!");
      router.push("/admin/previous-trips"); 
    } catch (error) { toast.error(error.message); } 
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center">Loading trip data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Previous Trip</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Heading */}
        <div className="space-y-2">
          <Label htmlFor="heading">Trip Name (Heading)</Label>
          <Input
            id="heading"
            required
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          />
        </div>

        {/* SubHeading */}
        <div className="space-y-2">
          <Label htmlFor="subHeading">Subtitle / Date</Label>
          <Input
            id="subHeading"
            required
            value={formData.subHeading}
            onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })}
          />
        </div>

        {/* Link */}
        <div className="space-y-2">
          <Label htmlFor="link">Instagram/Reel Link (Optional)</Label>
          <Input
            id="link"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          />
        </div>

        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <Label>Trip Image</Label>
          <div className="flex flex-col gap-2">
            <img 
              src={newImage.preview || formData.img} 
              alt="Current Preview" 
              className="h-48 w-full object-cover rounded-md border shadow-sm" 
            />
          </div>
          <Label htmlFor="image" className="mt-4 block text-xs text-muted-foreground">Replace Image (Optional)</Label>
          <Input 
            id="image" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="cursor-pointer"
          />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}