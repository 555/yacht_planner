"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Waypoint, CalculationSettings, Marina } from "@/types/sailing";
import { calculateRoute } from "@/utils/sailing-calculations";

interface RouteResultsProps {
  waypoints: Waypoint[];
  settings: CalculationSettings;
  onRemoveWaypoint: (id: number) => void;
  selectedWaypointMarinas: Record<number, Marina[]>;
}

export function RouteResults({
  waypoints,
  settings,
  onRemoveWaypoint,
  selectedWaypointMarinas
}: RouteResultsProps) {
  const route = calculateRoute(waypoints, settings);

  if (waypoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Add waypoints to the map to see route calculations
          </p>
        </CardContent>
      </Card>
    );
  }

  const distanceUnit = settings.units === "imperial" ? "nm" : "km";
  const fuelUnit = settings.units === "imperial" ? "gal" : "L";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Route Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Total Distance</div>
              <div className="text-muted-foreground">
                {route.totalDistance.toFixed(1)} {distanceUnit}
              </div>
            </div>
            <div>
              <div className="font-medium">Total Time</div>
              <div className="text-muted-foreground">
                {route.totalTime >= 24 
                  ? `${Math.floor(route.totalTime / 24)}d ${Math.floor(route.totalTime % 24)}h`
                  : `${Math.floor(route.totalTime)}h`
                }
              </div>
            </div>
            <div>
              <div className="font-medium">Fuel Needed</div>
              <div className="text-muted-foreground">
                {route.totalFuel.toFixed(1)} {fuelUnit}
              </div>
            </div>
            <div>
              <div className="font-medium">Total Cost</div>
              <div className="text-muted-foreground">
                ${route.totalCost.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waypoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {waypoints.map((waypoint, index) => (
            <div key={waypoint.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">{index + 1}</Badge>
                <div>
                  <div className="font-medium text-sm">{waypoint.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveWaypoint(waypoint.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {route.segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {route.segments.map((segment, index) => (
              <div key={index} className="flex justify-between text-sm p-2 border rounded">
                <span>Segment {index + 1}</span>
                <span>{segment.distance.toFixed(1)} {distanceUnit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}