"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function EditProudMarqueePage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", sortOrder: "0", img: "" });
  const [newImage, setNewImage] = useState({ file: null, preview: null, base64: null });

  useEffect(() => {
    const fetchMarquee = async () => {
      try {
        const res = await fetch(`/api/proud-marquee?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setFormData({
            title: data.title || "",
            sortOrder: String(data.sortOrder || "0"),
            img: data.img || "",
          });
        } else {
          throw new Error(data.error || "Failed to load marquee item");
        }
      } catch (error) {
        toast.error(error.message);
        router.push("/admin/proud");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMarquee();
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

      // 1. Upload new image if chosen
      if (newImage.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [newImage.base64], folder: "proud_marquee" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0];
      }

      // 2. Update details
      const res = await fetch("/api/proud-marquee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: formData.title,
          img: imageUrl,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Marquee item updated successfully!");
        router.push("/admin/proud");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update marquee item");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading marquee item...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Marquee Destination Item</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="title">Destination Title</Label>
          <Input id="title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <Label>Destination Image</Label>
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
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/proud")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
