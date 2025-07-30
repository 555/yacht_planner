"use client";

import { useState, useCallback, useEffect } from "react";
import { MapComponent } from "./MapComponent";
import { CalculatorControls } from "./CalculatorControls";
import { RouteResults } from "./RouteResults";
import MarinaList from "./MarinaList";
import { Waypoint, CalculationSettings, Marina } from "@/types/sailing";

export function SailingCalculator() {
  // localStorage keys
  const WAYPOINTS_KEY = 'sailing_calculator_waypoints';
  const SETTINGS_KEY = 'sailing_calculator_settings';

  // Helper functions for localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const saveToStorage = <T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // Initialize state with default values to prevent hydration mismatch
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [settings, setSettings] = useState<CalculationSettings>({
    vesselSpeed: 6,
    fuelConsumption: 100,
    fuelPrice: 5.5,
    units: "imperial"
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [selectedWaypointMarinas, setSelectedWaypointMarinas] = useState<Record<number, Marina[]>>({});

  // Load data from localStorage after hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
    setWaypoints(loadFromStorage(WAYPOINTS_KEY, []));
    setSettings(loadFromStorage(SETTINGS_KEY, {
      vesselSpeed: 6,
      fuelConsumption: 100,
      fuelPrice: 5.5,
      units: "imperial"
    }));
  }, []);

  // Save waypoints to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(WAYPOINTS_KEY, waypoints);
    }
  }, [waypoints, isHydrated]);

  // Save settings to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(SETTINGS_KEY, settings);
    }
  }, [settings, isHydrated]);

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
    <div className="flex flex-col h-screen p-6 space-y-6" data-component-path="components/sailing/SailingCalculator.tsx">
      <div className="text-center space-y-4 flex-shrink-0">
        <h1 className="text-4xl font-bold text-foreground">
          Sailing Distance Calculator
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Plan your sailing route, calculate distances, and find nearby marinas. 
          Click on the map to add waypoints and create your sailing route.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div 
          className="lg:col-span-3 map-container rounded-[1rem]" 
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
            onRemoveWaypoint={removeWaypoint}
            marinas={marinas}
            selectedWaypointMarinas={selectedWaypointMarinas}
          />
        </div>
        
        <div className="space-y-6 overflow-scroll">
          <CalculatorControls
            settings={settings}
            onSettingsChange={setSettings}
          />
          
          <RouteResults
            waypoints={waypoints}
            settings={settings}
            onRemoveWaypoint={removeWaypoint}
            onClearRoute={clearRoute}
            selectedWaypointMarinas={selectedWaypointMarinas}
          />
          
          <MarinaList 
            onMarinaSelect={(marina) => {
              // Add marina as a waypoint
              if (marina.latitude && marina.longitude) {
                addWaypoint(marina.longitude, marina.latitude);
              }
            }}
            selectedRegion={waypoints.length > 0 ? 'Current Area' : undefined}
          />
        </div>
      </div>
    </div>
  );
}