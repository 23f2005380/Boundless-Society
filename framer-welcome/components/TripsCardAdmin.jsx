import Link from "next/link";
import { TrendingUpIcon, UsersIcon, CalendarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TripCardAdmin({ trip }) {
  const availableSeats = trip.totalSeats - trip.totalJoined;
  const fillPercentage =
    trip.totalSeats > 0
      ? Math.round((trip.totalJoined / trip.totalSeats) * 100)
      : 0;

  return (
    <Link href={`/admin/trip/view/${trip.id}`}>
      <Card className="@container/card cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="relative">
          <CardTitle className="@[250px]/card:text-2xl text-xl font-semibold">
            {trip.name}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {trip.totalJoined}/{trip.totalSeats} joined
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 text-sm">
          {trip.description && (
            <p className="line-clamp-2 text-muted-foreground">
              {trip.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex gap-1 text-xs">
              <UsersIcon className="size-3" />
              {availableSeats} seats left
            </Badge>
            {trip.femaleReservedSeats > 0 && (
              <Badge variant="secondary" className="text-xs">
                {trip.femaleReservedSeats} female reserved
              </Badge>
            )}
            {trip.coordinators?.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {trip.coordinators.length} coordinator
                {trip.coordinators.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
