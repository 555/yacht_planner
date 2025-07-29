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
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [isStyleLoaded, setIsStyleLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Set Mapbox token directly
    setMapboxToken("pk.eyJ1IjoiYWxvbmdzaWRleWFjaHRzIiwiYSI6ImNtZG9wZjQxeTAzcnMybXM5OTZ1NHJ1ZGYifQ.p-EJW0oDtDlpdaFxhq14yA");
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapboxToken === "YOUR_MAPBOX_TOKEN_HERE") return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/alongsideyachts/clesibypt00hj01qfa6iqqgo5",
      center: [-74.5, 40],
      zoom: 9,
      projection: { name: "mercator" }
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Wait for style to load completely before setting flag
    map.current.on('style.load', () => {
      console.log('Style loaded event fired');
      setIsStyleLoaded(true);
    });

    // Add click handler for adding waypoints only after style loads
    map.current.on('style.load', () => {
      map.current?.on("click", (e) => {
        onAddWaypoint(e.lngLat.lng, e.lngLat.lat);
      });
    });

    return () => {
      setIsStyleLoaded(false);
      map.current?.remove();
    };
  }, [mapboxToken, onAddWaypoint]);

  // Update waypoint markers and routes - only when style is ready
  useEffect(() => {
    if (!map.current || !isStyleLoaded) {
      console.log('Skipping waypoint update - style not ready');
      return;
    }

    console.log('Processing waypoints:', waypoints.length);

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const el = document.createElement("div");
      el.className = "waypoint-marker";
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: hsl(var(--primary));
        border: 3px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
      markers.current.push(marker);
    });

    // Draw route line
    if (waypoints.length > 1) {
      console.log('Drawing route with', waypoints.length, 'waypoints');
      const coordinates = waypoints.map(w => [w.lng, w.lat]);
      
      if (map.current.getSource("route")) {
        console.log('Updating existing route source');
        (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates
          }
        });
      } else {
        console.log('Creating new route source');
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
  }, [waypoints, onUpdateWaypoint, isStyleLoaded]);

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
      />
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