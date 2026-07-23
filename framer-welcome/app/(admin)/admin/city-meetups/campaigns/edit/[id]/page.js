"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    city: "", 
    title: "", 
    description: "", 
    badge: "", 
    logo: "", 
    sortOrder: "0",
    img: "" 
  });
  const [newImage, setNewImage] = useState({ file: null, preview: null, base64: null });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/meetup-campaigns?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setFormData({
            city: data.campaign.city || "",
            title: data.campaign.title || "",
            description: data.campaign.description || "",
            badge: data.campaign.badge || "",
            logo: data.campaign.logo || "",
            sortOrder: String(data.campaign.sortOrder || "0"),
            img: data.campaign.img || "",
          });
        } else {
          throw new Error(data.error || "Failed to load campaign");
        }
      } catch (error) {
        toast.error(error.message);
        router.push("/admin/city-meetups");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
  }, [id, router]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewImage({ file, preview: reader.result, base64: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = formData.img;

      // 1. Upload new image if chosen
      if (newImage.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [newImage.base64], folder: "meetup_campaigns" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0];
      }

      // 2. Save campaign updates
      const res = await fetch("/api/meetup-campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...formData,
          img: imageUrl,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Campaign updated successfully!");
        router.push("/admin/city-meetups");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update campaign");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading campaign details...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Meetup Campaign Slide</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="city">City / Event Name</Label>
          <Input id="city" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Slide Title</Label>
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <Label>Slide Image</Label>
          <div className="flex flex-col gap-2">
            <img 
              src={newImage.preview || formData.img || "/placeholder.jpg"} 
              alt="Current Preview" 
              className="h-40 w-full object-cover rounded-md border shadow-sm" 
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
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/city-meetups")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
