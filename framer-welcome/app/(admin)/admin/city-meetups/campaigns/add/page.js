"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function AddCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    city: "", 
    title: "", 
    description: "", 
    badge: "", 
    logo: "", 
    sortOrder: "0" 
  });
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
      // 1. Upload image to Cloudinary
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [image.base64], folder: "meetup_campaigns" }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // 2. Save campaign details to Firestore
      const apiRes = await fetch("/api/meetup-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          img: uploadData.links?.[0],
          sortOrder: parseInt(formData.sortOrder) || 0
        }),
      });

      if (apiRes.ok) {
        toast.success("Campaign added successfully!");
        router.push("/admin/city-meetups");
      } else {
        const errorData = await apiRes.json();
        throw new Error(errorData.error || "Failed to save campaign");
      }
    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add Meetup Campaign Slide</h1>
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="city">City / Event Name (e.g. Navrang 2.0, Republic Day)</Label>
          <Input id="city" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Slide Title (typically matches name or is descriptive)</Label>
          <Input id="title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description Paragraph</Label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Add campaign details here..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Slide Image</Label>
          {image.preview && <img src={image.preview} alt="Preview" className="h-40 w-full object-cover rounded-md mb-2 border shadow-sm" />}
          <Input id="image" type="file" accept="image/*" required onChange={handleFileChange} />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/city-meetups")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Add Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
