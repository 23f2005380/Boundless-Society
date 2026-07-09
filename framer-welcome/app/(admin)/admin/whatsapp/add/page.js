"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function AddWhatsappGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    city: "", 
    link: "", 
    category: "regional", 
    linkType: "", 
    color: "#b6dbff",
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
        body: JSON.stringify({ images: [image.base64], folder: "whatsapp_groups" }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // 2. Save group details to Firestore
      const apiRes = await fetch("/api/whatsapp-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          img: uploadData.links?.[0],
          sortOrder: parseInt(formData.sortOrder) || 0
        }),
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        throw new Error(errorData.error || "Failed to save group");
      }
      
      toast.success("Group added successfully!");
      router.push("/admin/whatsapp");

    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add WhatsApp / Community Group</h1>
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* City / Name */}
        <div className="space-y-2">
          <Label htmlFor="city">Group Name / City (e.g., Nagpur, Delhi, Official Community)</Label>
          <Input id="city" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>

        {/* Invite Link */}
        <div className="space-y-2">
          <Label htmlFor="link">Invite / Join Link (WhatsApp or G Space Link)</Label>
          <Input id="link" type="url" required value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select 
            id="category"
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="official">Official Boundless Space</option>
            <option value="girls">Boundless Girls Community</option>
            <option value="regional">Regional Space</option>
          </select>
        </div>

        {/* Link Type */}
        <div className="space-y-2">
          <Label htmlFor="linkType">Link Type (Mainly for Official Section)</Label>
          <select 
            id="linkType"
            value={formData.linkType} 
            onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">WhatsApp Link</option>
            <option value="gspace">G Space Link</option>
          </select>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Card Background Color</Label>
          <div className="flex gap-4 items-center">
            <Input 
              id="color" 
              type="color" 
              value={formData.color} 
              onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input 
              type="text" 
              value={formData.color} 
              onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
              className="flex-1 font-mono"
            />
          </div>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order (lower numbers show first)</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        {/* Image */}
        <div className="space-y-2">
          <Label htmlFor="image">Group Thumbnail Image</Label>
          {image.preview && <img src={image.preview} alt="Preview" className="h-40 w-full object-cover rounded-md mb-2 border shadow-sm" />}
          <Input id="image" type="file" accept="image/*" required onChange={handleFileChange} />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/whatsapp")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Add Group"}
          </Button>
        </div>
      </form>
    </div>
  );
}
