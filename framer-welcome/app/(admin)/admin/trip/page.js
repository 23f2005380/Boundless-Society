"use client";

import React from "react";
import Link from "next/link";
import { PlusIcon, Loader2Icon } from "lucide-react";
import { TripCardAdmin } from "@/components/TripsCardAdmin";
import { Button } from "@/components/ui/button";

function TripsPage() {
  const [trips, setTrips] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch("/api/trip");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch trips");
        }

        setTrips(data.trips);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">Trips</h1>
        <Button asChild size="sm">
          <Link href="/admin/trip/add">
            <PlusIcon className="mr-2 size-4" />
            Add New Trip
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No trips created yet
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/admin/trip/add">
                  <PlusIcon className="mr-2 size-4" />
                  Create your first trip
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCardAdmin key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripsPage;
