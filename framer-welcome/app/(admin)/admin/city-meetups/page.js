"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TrashIcon, PlusIcon, PencilIcon } from "lucide-react";

export default function ManageCityMeetupsPage() {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMeetups = async () => {
    try {
      const res = await fetch("/api/city-meetups");
      const data = await res.json();
      if (res.ok) {
        setMeetups(data.meetups || []);
      }
    } catch (error) {
      toast.error("Failed to load city meetups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetups();
  }, []);

const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this meetup?")) return;

    try {
      // Changed to use ?id= param strategy
      const res = await fetch(`/api/city-meetups?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Meetup deleted successfully");
        setMeetups((prev) => prev.filter((meetup) => meetup.id !== id));
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-10">Loading city meetups...</div>;

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage City Meetups</h1>
        <Button onClick={() => router.push("/admin/city-meetups/add")}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Meetup
        </Button>
      </div>

      {meetups.length === 0 ? (
        <p className="text-muted-foreground">No city meetups found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Main Section</TableHead>
              <TableHead>Sub Section</TableHead>
              <TableHead>City Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetups.map((meetup) => (
              <TableRow key={meetup.id}>
                <TableCell className="font-medium">{meetup.mainSection}</TableCell>
                <TableCell>{meetup.subSection}</TableCell>
                <TableCell>{meetup.cityName}</TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" 
                      style={{ backgroundColor: meetup.color || "#FEFAE7" }}
                    />
                    <span className="text-xs text-muted-foreground ">
                      {meetup.color || "#FEFAE7"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  {meetup.img ? (
                    <img 
                      src={meetup.img} 
                      alt={meetup.cityName} 
                      className="h-10 w-16 object-cover rounded bg-muted"
                    />
                  ) : (
                    "No Image"
                  )}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => router.push(`/admin/city-meetups/edit/${meetup.id}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>

                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(meetup.id)}
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