"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

const CATEGORY_LABELS = {
  official: "Official Boundless Space",
  girls: "Girls Community",
  regional: "Regional Space",
};

export default function ManageWhatsappPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/whatsapp-groups");
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      } else {
        throw new Error(data.error || "Failed to load groups");
      }
    } catch (error) {
      toast.error(error.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/whatsapp-groups?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Group deleted successfully");
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-10">Loading WhatsApp groups...</div>;

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage WhatsApp & Chat Communities</h1>
        <Button onClick={() => router.push("/admin/whatsapp/add")}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">No groups found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group/City Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Link Type</TableHead>
              <TableHead>Bg Color</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.city}</TableCell>
                <TableCell>{CATEGORY_LABELS[group.category] || group.category}</TableCell>
                <TableCell>{group.linkType === "gspace" ? "G Space" : "WhatsApp"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span 
                      className="inline-block w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-xs font-mono">{group.color}</span>
                  </div>
                </TableCell>
                <TableCell>{group.sortOrder}</TableCell>
                <TableCell>
                  {group.img ? (
                    <img 
                      src={group.img} 
                      alt={group.city} 
                      className="h-10 w-16 object-cover rounded bg-muted border"
                    />
                  ) : (
                    "No Image"
                  )}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  {/* Edit Button */}
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => router.push(`/admin/whatsapp/edit/${group.id}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* Delete Button */}
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(group.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
