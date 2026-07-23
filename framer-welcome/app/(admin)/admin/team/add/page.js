"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function AddTeamMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    role: "", 
    type: "council", 
    term: "2025-2026", 
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
        body: JSON.stringify({ images: [image.base64], folder: "team_members" }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // 2. Save member details to Firestore
      const apiRes = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          image: uploadData.links?.[0],
          sortOrder: parseInt(formData.sortOrder) || 0
        }),
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        throw new Error(errorData.error || "Failed to save team member");
      }
      
      toast.success("Team member added successfully!");
      router.push("/admin/team");

    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add Team Member</h1>
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role (e.g. Secretary, Technical Head, Founder)</Label>
          <Input id="role" required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type / Group</Label>
          <select 
            id="type"
            value={formData.type} 
            onChange={(e) => {
              const newType = e.target.value;
              setFormData({ 
                ...formData, 
                type: newType,
                term: newType === "founder" ? "" : formData.term || "2025-2026"
              });
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="founder">Founder / Founding Member</option>
            <option value="council">Council Member</option>
            <option value="dept_head">Department Head</option>
          </select>
        </div>

        {/* Term */}
        <div className="space-y-2">
          <Label htmlFor="term">Term (e.g. 2025-2026, 2024-2025)</Label>
          <Input 
            id="term" 
            required={formData.type !== "founder"}
            disabled={formData.type === "founder"}
            value={formData.term} 
            onChange={(e) => setFormData({ ...formData, term: e.target.value })} 
            placeholder="e.g. 2025-2026"
          />
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order (lower numbers show first)</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        {/* Image */}
        <div className="space-y-2">
          <Label htmlFor="image">Profile Image</Label>
          {image.preview && <img src={image.preview} alt="Preview" className="h-40 w-40 object-cover rounded-md mb-2 border shadow-sm" />}
          <Input id="image" type="file" accept="image/*" required onChange={handleFileChange} />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/team")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Add Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
