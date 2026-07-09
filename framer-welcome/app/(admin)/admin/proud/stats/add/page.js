"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function AddProudStatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ label: "", number: "", sortOrder: "0" });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/proud-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label,
          number: parseInt(formData.number) || 0,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Statistic added successfully!");
        router.push("/admin/proud");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save statistic");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card text-card-foreground rounded-xl shadow-sm mt-10 border border-border">
      <h1 className="text-2xl font-bold mb-6">Add Statistic Card</h1>
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="label">Label (e.g. Members, Trips, Meetups)</Label>
          <Input id="label" required value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Value (e.g. 5200 for 5200+)</Label>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Add Stat"}
          </Button>
        </div>
      </form>
    </div>
  );
}
