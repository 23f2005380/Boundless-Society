"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function AddPreviousTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ heading: "", subHeading: "", link: "" });
  const [image, setImage] = useState({ file: null, preview: null, base64: null });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage({ file, preview: reader.result, base64: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!image.base64) return toast.error("Please select an image.");

    setLoading(true);
    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [image.base64], folder: "previous_trips" }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const apiRes = await fetch("/api/previous-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, img: uploadData.links?.[0] }),
      });

      if (!apiRes.ok) throw new Error("Failed to save trip");
      toast.success("Previous trip added successfully!");
      router.push("/admin/previous-trips");

    } catch (error) { toast.error(error.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add Previous Trip</h1>
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="heading">Trip Name</Label>
          <Input id="heading" required value={formData.heading} onChange={(e) => setFormData({ ...formData, heading: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subHeading">Subtitle / Date</Label>
          <Input id="subHeading" required value={formData.subHeading} onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Instagram/Reel Link (Optional)</Label>
          <Input id="link" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Trip Image</Label>
          {image.preview && <img src={image.preview} alt="Preview" className="h-40 object-cover rounded-md mb-2 border" />}
          <Input id="image" type="file" accept="image/*" required onChange={handleFileChange} />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
          {loading ? "Saving..." : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}