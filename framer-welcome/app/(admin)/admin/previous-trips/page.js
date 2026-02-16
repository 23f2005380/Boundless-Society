"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";

export default function ManageTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch all trips
  const fetchTrips = async () => {
    try {
      const res = await fetch("/api/previous-trips");
      const data = await res.json();
      if (res.ok) {
        setTrips(data.trips || []);
      }
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/previous-trips/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Trip deleted successfully");
        setTrips((prev) => prev.filter((trip) => trip.id !== id));
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-10">Loading trips...</div>;

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm m-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Previous Trips</h1>
        <Button onClick={() => router.push("/admin/previous-trips/add")}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <p className="text-muted-foreground">No previous trips found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Heading</TableHead>
              <TableHead>Sub-heading</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.heading}</TableCell>
                <TableCell>{trip.subHeading}</TableCell>
                <TableCell>
                  {trip.img ? (
                    <img 
                      src={trip.img} 
                      alt={trip.heading} 
                      className="h-10 w-16 object-cover rounded bg-muted"
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
                    onClick={() => router.push(`/admin/previous-trips/edit/${trip.id}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* Delete Button */}
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(trip.id)}
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