"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import MediaFileUpload from "@/components/MediaFileUpload";
import { sanitizeMediaUrls } from "@/lib/previous-trip-media";

export default function AddPreviousTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    heading: "",
    subHeading: "",
    link: "",
    title: "",
    date: "",
    venue: "",
    participants: "",
    summary: "",
    photos: [],
    videos: [],
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
    setLoading(true);
    try {
      let imageUrl = "";

      if (image.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [image.base64], folder: "previous_trips" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0] || "";
      }

      const apiRes = await fetch("/api/previous-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photos: sanitizeMediaUrls(formData.photos),
          videos: sanitizeMediaUrls(formData.videos),
          img: imageUrl,
        }),
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heading">Trip Card Name (Heading)</Label>
            <Input id="heading" value={formData.heading} onChange={(e) => setFormData({ ...formData, heading: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subHeading">Card Subtitle / Date</Label>
            <Input id="subHeading" value={formData.subHeading} onChange={(e) => setFormData({ ...formData, subHeading: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Sheet Title</Label>
          <Input id="title" placeholder="e.g. Patna → Bodhgaya" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Trip Date</Label>
            <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Total Participants</Label>
            <Input id="participants" type="number" placeholder="e.g. 25" value={formData.participants} onChange={(e) => setFormData({ ...formData, participants: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue">Venue / Route</Label>
          <Input id="venue" placeholder="e.g. Mini Trip - Patna to Bodhgaya" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary / Recap (Long Text)</Label>
          <textarea
            id="summary"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Write 2-4 paragraphs describing the trip, highlights, vibes..."
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Primary Instagram Action Link (Opens when 'View on Instagram' clicked)</Label>
          <Input id="link" placeholder="e.g. https://instagram.com/..." value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
        </div>

        <div className="p-4 border border-dashed rounded-lg space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Glimpses Gallery</h3>

          <MediaFileUpload
            label="Photos"
            inputId="glimpses-photos"
            urls={formData.photos}
            onChange={(photos) => setFormData({ ...formData, photos })}
            accept="image/*"
            resourceType="image"
          />

          <MediaFileUpload
            label="Videos"
            inputId="glimpses-videos"
            urls={formData.videos}
            onChange={(videos) => setFormData({ ...formData, videos })}
            accept="video/*"
            resourceType="video"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Trip Image</Label>
          {image.preview && <img src={image.preview} alt="Preview" className="h-40 w-full object-cover rounded-md mb-2 border" />}
          <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
          {loading ? "Saving..." : "Add Trip"}
        </Button>
      </form>
    </div>
  );
}