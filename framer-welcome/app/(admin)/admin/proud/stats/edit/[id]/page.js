"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function EditProudStatPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ label: "", number: "", sortOrder: "0" });

  useEffect(() => {
    const fetchStat = async () => {
      try {
        const res = await fetch(`/api/proud-stats?id=${id}`);
        const data = await res.json();
        if (res.ok) {
          setFormData({
            label: data.label || "",
            number: String(data.number || "0"),
            sortOrder: String(data.sortOrder || "0"),
          });
        } else {
          throw new Error(data.error || "Failed to load statistic");
        }
      } catch (error) {
        toast.error(error.message);
        router.push("/admin/proud");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStat();
  }, [id, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/proud-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          label: formData.label,
          number: parseInt(formData.number) || 0,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Statistic updated successfully!");
        router.push("/admin/proud");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update statistic");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading statistic data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Edit Statistic Card</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input id="label" required value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Value</Label>
          <Input id="number" type="number" required value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" type="number" required value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/proud")}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Stat"}
          </Button>
        </div>
      </form>
    </div>
  );
}
