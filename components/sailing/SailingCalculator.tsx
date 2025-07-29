"use client";

import { useState, useCallback } from "react";
import { MapComponent } from "./MapComponent";
import { CalculatorControls } from "./CalculatorControls";
import { RouteResults } from "./RouteResults";
import { Waypoint, CalculationSettings, Marina } from "@/types/sailing";

export function SailingCalculator() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [settings, setSettings] = useState<CalculationSettings>({
    vesselSpeed: 6,
    fuelConsumption: 3,
    fuelPrice: 5.5,
    units: "imperial"
  });
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [selectedWaypointMarinas, setSelectedWaypointMarinas] = useState<Record<number, Marina[]>>({});

  const addWaypoint = useCallback((lng: number, lat: number) => {
    setWaypoints(prev => {
      const newWaypoint: Waypoint = {
        id: Date.now(),
        lng,
        lat,
        name: `Waypoint ${prev.length + 1}`
      };
      return [...prev, newWaypoint];
    });
  }, []);

  const removeWaypoint = useCallback((id: number) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
    setSelectedWaypointMarinas(prev => {
      const newSelected = { ...prev };
      delete newSelected[id];
      return newSelected;
    });
  }, []);

  const updateWaypoint = useCallback((id: number, lng: number, lat: number) => {
    setWaypoints(prev => prev.map(w => 
      w.id === id ? { ...w, lng, lat } : w
    ));
  }, []);

  const clearRoute = useCallback(() => {
    setWaypoints([]);
    setSelectedWaypointMarinas({});
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Sailing Distance Calculator
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Plan your sailing route, calculate distances, and find nearby marinas. 
          Click on the map to add waypoints and create your sailing route.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div 
          className="lg:col-span-3 map-container" 
          data-lov-id="components/sailing/SailingCalculator.tsx:61:8"
          ref={(el) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              el.style.width = `${rect.width}px`;
              el.style.height = `${rect.height}px`;
            }
          }}
        >
          <MapComponent
            waypoints={waypoints}
            onAddWaypoint={addWaypoint}
            onUpdateWaypoint={updateWaypoint}
            marinas={marinas}
            selectedWaypointMarinas={selectedWaypointMarinas}
          />
        </div>
        
        <div className="space-y-6">
          <CalculatorControls
            settings={settings}
            onSettingsChange={setSettings}
            onClearRoute={clearRoute}
          />
          
          <RouteResults
            waypoints={waypoints}
            settings={settings}
            onRemoveWaypoint={removeWaypoint}
            selectedWaypointMarinas={selectedWaypointMarinas}
          />
        </div>
      </div>
    </div>
  );
}