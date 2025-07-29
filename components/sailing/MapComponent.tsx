"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Waypoint, Marina } from "@/types/sailing";

interface MapComponentProps {
  waypoints: Waypoint[];
  onAddWaypoint: (lng: number, lat: number) => void;
  onUpdateWaypoint: (id: number, lng: number, lat: number) => void;
  marinas: Marina[];
  selectedWaypointMarinas: Record<number, Marina[]>;
}

export function MapComponent({
  waypoints,
  onAddWaypoint,
  onUpdateWaypoint,
  marinas,
  selectedWaypointMarinas
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const styleLoaded = useRef<boolean>(false);

  useEffect(() => {
    // Set Mapbox token directly
    console.log('Setting Mapbox token');
    setMapboxToken("pk.eyJ1IjoiYWxvbmdzaWRleWFjaHRzIiwiYSI6ImNtZG9wZjQxeTAzcnMybXM5OTZ1NHJ1ZGYifQ.p-EJW0oDtDlpdaFxhq14yA");
  }, []);

  // Function to create a marker for a waypoint
  const createMarker = (waypoint: Waypoint, index: number) => {
    const el = document.createElement("div");
    el.className = "waypoint-marker";
    el.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      z-index: 1000;
      position: absolute;
    `;
    el.textContent = (index + 1).toString();

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([waypoint.lng, waypoint.lat])
      .addTo(map.current!);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onUpdateWaypoint(waypoint.id, lngLat.lng, lngLat.lat);
    });

    // Add popup with waypoint info
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div>
          <h3 class="font-semibold">${waypoint.name}</h3>
          <p class="text-sm text-muted-foreground">
            ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}
          </p>
        </div>
      `);

    marker.setPopup(popup);
    return marker;
  };

  // Function to update waypoints and routes
  const updateWaypoints = () => {
    if (!map.current || !styleLoaded.current) {
      return;
    }

    // Get current marker IDs
    const currentMarkerIds = new Set(markers.current.keys());
    const waypointIds = new Set(waypoints.map(w => w.id));

    // Remove markers for waypoints that no longer exist
    currentMarkerIds.forEach(id => {
      if (!waypointIds.has(id)) {
        const marker = markers.current.get(id);
        if (marker) {
          marker.remove();
          markers.current.delete(id);
        }
      }
    });

    // Add or update markers for current waypoints
    waypoints.forEach((waypoint, index) => {
      const existingMarker = markers.current.get(waypoint.id);
      
      if (existingMarker) {
        // Update existing marker position and number
        existingMarker.setLngLat([waypoint.lng, waypoint.lat]);
        const el = existingMarker.getElement();
        el.textContent = (index + 1).toString();
      } else {
        // Create new marker
        const marker = createMarker(waypoint, index);
        markers.current.set(waypoint.id, marker);
      }
    });

    // Update route line
    if (waypoints.length > 1) {
      const coordinates = waypoints.map(w => [w.lng, w.lat]);
      
      if (map.current.getSource("route")) {
        (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates
          }
        });
      } else {
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates
            }
          }
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "hsl(var(--primary))",
            "line-width": 3
          }
        });
      }
    } else if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
  };

  useEffect(() => {
    console.log('Map effect triggered - container:', !!mapContainer.current, 'token:', !!mapboxToken);
    if (!mapContainer.current || !mapboxToken || mapboxToken === "YOUR_MAPBOX_TOKEN_HERE") return;

    console.log('Initializing Mapbox map');
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/alongsideyachts/clesibypt00hj01qfa6iqqgo5",
      center: [-74.5, 40],
      zoom: 2,
      projection: { name: "mercator" }
    });

    console.log('Map created, adding controls');
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Everything map-related happens ONLY after style loads
    map.current.on('style.load', () => {
      console.log('Style loaded - initializing map features');
      styleLoaded.current = true;
      
      // Add click handler
      map.current?.on("click", (e) => {
        console.log('Map clicked at:', e.lngLat.lng, e.lngLat.lat);
        onAddWaypoint(e.lngLat.lng, e.lngLat.lat);
      });
      
      // If we have waypoints, update them now
      if (waypoints.length > 0) {
        console.log('Calling updateWaypoints from style.load');
        updateWaypoints();
      }
    });

    return () => {
      console.log('Cleaning up map');
      styleLoaded.current = false;
      map.current?.remove();
    };
  }, [mapboxToken, onAddWaypoint]);

  // Call updateWaypoints when waypoints change OR when style loads
  useEffect(() => {
    console.log('Waypoints effect triggered - waypoints:', waypoints.length, 'styleLoaded:', styleLoaded.current);
    if (styleLoaded.current && waypoints.length > 0) {
      updateWaypoints();
    }
  }, [waypoints, onUpdateWaypoint]);

  if (!mapboxToken || mapboxToken === "YOUR_MAPBOX_TOKEN_HERE") {
    return (
      <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Mapbox Token Required</h3>
          <p className="text-muted-foreground">
            Please provide your Mapbox API token to use the map functionality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="h-[600px] w-full rounded-lg shadow-lg"
        style={{
          position: 'relative'
        }}
      />
      <style>{`
        .mapboxgl-canvas-container {
          position: relative !important;
          width: 100% !important;
          height: 600px !important;
        }
        .mapboxgl-canvas {
          position: absolute !important;
        }
      `}</style>
      {waypoints.length === 0 && (
        <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-md border">
          <p className="text-sm text-muted-foreground">
            Click on the map to add waypoints and create your sailing route
          </p>
        </div>
      )}
    </div>
  );
}