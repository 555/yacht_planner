"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Waypoint, Marina } from "@/types/sailing";

interface MapComponentProps {
  waypoints: Waypoint[];
  onAddWaypoint: (lng: number, lat: number) => void;
  onUpdateWaypoint: (id: number, lng: number, lat: number) => void;
  onRemoveWaypoint: (id: number) => void;
  marinas: Marina[];
  selectedWaypointMarinas: Record<number, Marina[]>;
}

export function MapComponent({
  waypoints,
  onAddWaypoint,
  onUpdateWaypoint,
  onRemoveWaypoint,
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

  // Memoize the updateWaypoints function to prevent unnecessary re-renders
  const updateWaypoints = useCallback(() => {
    console.log('updateWaypoints called - map:', !!map.current, 'styleLoaded:', styleLoaded.current, 'waypoints:', waypoints.length);
    if (!map.current || !styleLoaded.current) {
      console.log('Cannot update waypoints - style not ready');
      return;
    }

    console.log('Current markers count:', markers.current.size);
    console.log('Waypoints to process:', waypoints);

    // Clear existing markers and rebuild them
    markers.current.forEach(marker => {
      console.log('Removing existing marker');
      marker.remove();
    });
    markers.current.clear();

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      console.log('Creating marker for waypoint:', waypoint.id, 'at', waypoint.lat, waypoint.lng);
      
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
      
      console.log('Element created:', el, 'with text:', el.textContent);

      // Add click handler to remove waypoint
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemoveWaypoint(waypoint.id);
      });

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([waypoint.lng, waypoint.lat])
        .addTo(map.current!);

      console.log('Marker created and added to map:', marker);

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
            <p class="text-xs text-muted-foreground mt-1">
              Click marker to remove
            </p>
          </div>
        `);

      marker.setPopup(popup);
      markers.current.set(waypoint.id, marker);
      console.log('Marker added to markers map. Total markers:', markers.current.size);
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
            "line-color": "#3b82f6",
            "line-width": 3,
            "line-dasharray": [5, 5]
          }
        }, "waterway-label");
      }
    } else if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
  }, [waypoints, onUpdateWaypoint, onRemoveWaypoint]);

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
      maxZoom: 9.6,
      projection: { name: "mercator" },
      dragRotate: false,
      touchZoomRotate: false
    });

    console.log('Map created, adding controls');
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Resize handler - remove styles, measure, set dimensions, and resize map
    const handleResize = () => {
      console.log('handleResize called');
      if (!map.current || !mapContainer.current) {
        console.log('handleResize: missing map or container');
        return;
      }
      
      console.log('handleResize: removing styles');
      
      // Find the actual .map-container element (parent container)
      const actualMapContainer = mapContainer.current.closest('.map-container') as HTMLElement;
      if (actualMapContainer) {
        console.log('handleResize: found .map-container, removing styles');
        actualMapContainer.removeAttribute('style');
      }
      
      // Also remove styles from our ref container
      mapContainer.current.removeAttribute('style');
      
      const canvas = mapContainer.current.querySelector('.mapboxgl-canvas') as HTMLElement;
      if (canvas) {
        canvas.removeAttribute('style');
        console.log('handleResize: removed canvas styles');
      }
      
      // Force a reflow to ensure styles are completely cleared
      if (actualMapContainer) {
        actualMapContainer.offsetHeight;
      }
      mapContainer.current.offsetHeight;
      
      // Measure the container dimensions
      const containerToMeasure = actualMapContainer || mapContainer.current;
      const containerRect = containerToMeasure.getBoundingClientRect();
      const widthPx = `${containerRect.width}px`;
      const heightPx = `${containerRect.height}px`;
      
      console.log('handleResize: new dimensions', widthPx, heightPx);
      
      // Set new inline dimensions on the actual container
      if (actualMapContainer) {
        actualMapContainer.style.width = widthPx;
        actualMapContainer.style.height = heightPx;
      }
      
      mapContainer.current.style.width = widthPx;
      mapContainer.current.style.height = heightPx;
      
      if (canvas) {
        canvas.style.width = widthPx;
        canvas.style.height = heightPx;
      }
      
      // Call map resize
      map.current.resize();
      console.log('handleResize: map.resize() called');
    };

    // Add window resize listener immediately
    window.addEventListener('resize', handleResize);
    console.log('Added resize event listener');

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
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
    };
  }, [mapboxToken, onAddWaypoint]);

  // Call updateWaypoints when waypoints change OR when style loads
  useEffect(() => {
    console.log('Waypoints effect triggered - waypoints:', waypoints.length, 'styleLoaded:', styleLoaded.current);
    if (styleLoaded.current) {
      updateWaypoints();
    }
  }, [updateWaypoints]);

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
    <div className="relative" style={{ height: '100%' }}>
      <div
        ref={mapContainer}
        className="w-full rounded-lg shadow-lg"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%'
        }}
      />
      <style>{`
        .mapboxgl-map {
          width: 100% !important;
          height: 100% !important;
        }
        .mapboxgl-canvas-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        .mapboxgl-canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
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