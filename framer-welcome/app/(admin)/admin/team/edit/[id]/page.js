"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    role: "", 
    type: "council", 
    term: "", 
    sortOrder: "0",
    image: "" 
  });
  
  const [newImage, setNewImage] = useState({ file: null, preview: null, base64: null });

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/team-members?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setFormData({ 
            name: data.name || "", 
            role: data.role || "", 
            type: data.type || "council", 
            term: data.term || "", 
            sortOrder: String(data.sortOrder || "0"),
            image: data.image || "" 
          });
        } else {
          throw new Error(data.error || "Failed to load member data");
        }
      } catch (error) { 
        toast.error(error.message); 
        router.push("/admin/team"); 
      } finally { 
        setLoading(false); 
      }
    };
    if (id) fetchMember();
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
      let imageUrl = formData.image;

      // 1. Upload new image if chosen
      if (newImage.base64) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [newImage.base64], folder: "team_members" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        imageUrl = uploadData.links?.[0];
      }

      // 2. Update member details
      const apiRes = await fetch(`/api/team-members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          ...formData, 
          image: imageUrl,
          sortOrder: parseInt(formData.sortOrder) || 0
        }),
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        throw new Error(errorData.error || "Failed to update member");
      }
      
      toast.success("Team member updated successfully!");
      router.push("/admin/team"); 
    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <div className="p-10 text-center">Loading member data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Team Member</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
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
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            required
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
          />
        </div>

        {/* Image Preview & Upload */}
        <div className="space-y-2">
          <Label>Profile Image</Label>
          <div className="flex flex-col gap-2">
            <img 
              src={newImage.preview || formData.image || "/placeholder.jpg"} 
              alt="Current Preview" 
              className="h-40 w-40 object-cover rounded-md border shadow-sm" 
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
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/team")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
