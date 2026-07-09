"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

const TYPE_LABELS = {
  founder: "Founder",
  council: "Council Member",
  dept_head: "Department Head",
};

export default function ManageTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch all team members
  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team-members");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      } else {
        throw new Error(data.error || "Failed to load team members");
      }
    } catch (error) {
      toast.error(error.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this team member? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/team-members?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Team member deleted successfully");
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-10">Loading team members...</div>;

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Team & Council</h1>
        <Button onClick={() => router.push("/admin/team/add")}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Member
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-muted-foreground">No team members found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{TYPE_LABELS[member.type] || member.type}</TableCell>
                <TableCell>{member.term || "N/A"}</TableCell>
                <TableCell>{member.sortOrder}</TableCell>
                <TableCell>
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="h-10 w-10 object-cover rounded bg-muted"
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
                    onClick={() => router.push(`/admin/team/edit/${member.id}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* Delete Button */}
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(member.id)}
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
