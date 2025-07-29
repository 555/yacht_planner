"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Waypoint, Marina } from "@/types/sailing";
import { useToast } from "@/hooks/use-toast";

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
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const dragStartPositions = useRef<Map<number, mapboxgl.LngLat>>(new Map());
  const recentlyDragged = useRef<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Set Mapbox token directly
    console.log('Setting Mapbox token');
    setMapboxToken("pk.eyJ1IjoiYWxvbmdzaWRleWFjaHRzIiwiYSI6ImNtZG9wZjQxeTAzcnMybXM5OTZ1NHJ1ZGYifQ.p-EJW0oDtDlpdaFxhq14yA");
  }, []);

  // Check if point is on water - shared function
  const isOnWater = useCallback((point: mapboxgl.Point) => {
    const features = map.current?.queryRenderedFeatures(point);
    if (!features) return false;
    
    // Check for water features - look specifically for water source layer
    const waterFeatures = features.filter(feature => {
      const sourceLayer = feature.sourceLayer;
      return sourceLayer === 'water';
    });
    
    return waterFeatures.length > 0;
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
        background: #2a1063;
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
        transition: background-color 0.2s ease;
      `;
      
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.background = '#d03434';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.background = '#2a1063';
      });
      el.textContent = (index + 1).toString();
      
      console.log('Element created:', el, 'with text:', el.textContent);

      // Add click handler to remove waypoint (disabled during drag and briefly after)
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Marker click event - waypoint:', waypoint.id, 'isDragging:', dragStartPositions.current.has(waypoint.id), 'recentlyDragged:', recentlyDragged.current.has(waypoint.id));
        // Only allow removal if not currently dragging this marker AND not recently dragged
        if (!dragStartPositions.current.has(waypoint.id) && !recentlyDragged.current.has(waypoint.id)) {
          console.log('Removing waypoint:', waypoint.id);
          onRemoveWaypoint(waypoint.id);
        } else {
          console.log('Click blocked - marker is being dragged or recently dragged');
        }
      });

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([waypoint.lng, waypoint.lat])
        .addTo(map.current!);

      console.log('Marker created and added to map:', marker);

      // Store original position on drag start
      marker.on("dragstart", () => {
        const lngLat = marker.getLngLat();
        dragStartPositions.current.set(waypoint.id, lngLat);
        console.log('DRAGSTART - waypoint:', waypoint.id, 'position:', lngLat, 'dragPositions size:', dragStartPositions.current.size);
        // Add visual feedback during drag
        el.style.transform = 'scale(1.1)';
        el.style.zIndex = '2000';
      });

      // Add drag event for real-time visual feedback
      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        const point = map.current!.project(lngLat);
        
        if (isOnWater(point)) {
          el.style.background = '#059669'; // Green for valid
          el.style.borderColor = '#d1fae5';
        } else {
          el.style.background = '#dc2626'; // Red for invalid
          el.style.borderColor = '#fee2e2';
        }
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const originalPosition = dragStartPositions.current.get(waypoint.id);
        console.log('DRAGEND - waypoint:', waypoint.id, 'newPosition:', lngLat, 'originalPosition:', originalPosition);
        
        // Reset visual feedback
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1000';
        el.style.background = '#2a1063';
        el.style.borderColor = 'white';
        
        // Convert to screen coordinates for water detection
        const point = map.current!.project(lngLat);
        const onWater = isOnWater(point);
        console.log('Water check - onWater:', onWater, 'point:', point);
        
        if (onWater) {
          // Valid drop on water - update waypoint
          console.log('Valid drop - updating waypoint position');
          onUpdateWaypoint(waypoint.id, lngLat.lng, lngLat.lat);
        } else {
          // Invalid drop on land - revert to original position
          console.log('Invalid drop on land - reverting position');
          if (originalPosition) {
            console.log('Reverting to original position:', originalPosition);
            marker.setLngLat(originalPosition);
            toast({
              title: "Invalid placement",
              description: "Waypoints can only be placed on water. The marker has been returned to its original position.",
              variant: "destructive",
            });
          }
        }
        
        // Always clean up drag state after dragend
        console.log('Cleaning up drag state for waypoint:', waypoint.id);
        dragStartPositions.current.delete(waypoint.id);
        
        // Mark as recently dragged to prevent immediate click removal
        recentlyDragged.current.add(waypoint.id);
        setTimeout(() => {
          recentlyDragged.current.delete(waypoint.id);
          console.log('Cleared recently dragged flag for waypoint:', waypoint.id);
        }, 200); // 200ms delay to prevent click after drag
        
        console.log('Final dragPositions size:', dragStartPositions.current.size);
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
            "line-color": "#2a1063",
            "line-width": 3,
            "line-dasharray": [0.5, 2]
          }
        }, "waterway-label");
      }
    } else if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
    
    // Auto-zoom to fit route after inactivity with nice framing
    const resetInactivityTimer = () => {
      console.log('resetInactivityTimer called - waypoints:', waypoints.length);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        console.log('Cleared existing inactivity timer');
      }
      
      if (waypoints.length > 1) {
        console.log('Setting new inactivity timer for', waypoints.length, 'waypoints');
        inactivityTimer.current = setTimeout(() => {
          console.log('Inactivity timer triggered - executing fitBounds');
          if (!map.current) {
            console.log('Map not available for fitBounds');
            return;
          }
          
          const coordinates = waypoints.map(w => [w.lng, w.lat] as [number, number]);
          const bounds = new mapboxgl.LngLatBounds();
          coordinates.forEach(coord => bounds.extend(coord));
          console.log('Fitting bounds for coordinates:', coordinates);
          
          map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 }, // Generous padding for nice framing
            maxZoom: 8, // Prevent zooming too close for short routes
            duration: 2500, // Slightly longer animation for smoother feel
            easing: (t) => t * (2 - t) // gentle ease-out function
          });
        }, 1000);
      } else {
        console.log('Not setting timer - need more than 1 waypoint');
      }
    };
    
    console.log('Calling resetInactivityTimer from updateWaypoints');
    resetInactivityTimer();
  }, [waypoints, onUpdateWaypoint, onRemoveWaypoint, isOnWater, toast]);

  useEffect(() => {
    console.log('Map effect triggered - container:', !!mapContainer.current, 'token:', !!mapboxToken);
    if (!mapContainer.current || !mapboxToken || mapboxToken === "YOUR_MAPBOX_TOKEN_HERE") return;

    console.log('Initializing Mapbox map');
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/alongsideyachts/cmdki7mng000l01si77fv8p5x",
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
      
      // Reset inactivity timer on user interaction with enhanced framing
      const resetTimer = () => {
        console.log('resetTimer called from map interaction - waypoints:', waypoints.length);
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          console.log('Cleared existing timer from map interaction');
        }
        
        if (waypoints.length > 1) {
          console.log('Setting new timer from map interaction');
          inactivityTimer.current = setTimeout(() => {
            console.log('Map interaction timer triggered - executing fitBounds');
            if (!map.current) {
              console.log('Map not available for fitBounds from interaction');
              return;
            }
            
            const coordinates = waypoints.map(w => [w.lng, w.lat] as [number, number]);
            const bounds = new mapboxgl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord));
            console.log('Fitting bounds from interaction for coordinates:', coordinates);
            
            map.current.fitBounds(bounds, {
              padding: { top: 100, bottom: 100, left: 100, right: 100 }, // Generous padding for nice framing
              maxZoom: 8, // Prevent zooming too close for short routes
              duration: 2500, // Slightly longer animation for smoother feel
              easing: (t) => t * (2 - t) // gentle ease-out function
            });
          }, 1000);
        } else {
          console.log('Not setting timer from interaction - need more than 1 waypoint');
        }
      };
      
      
      // Add mousemove handler for cursor changes and reset timer
      map.current?.on("mousemove", (e) => {
        resetTimer();
        
        const canvas = map.current?.getCanvas();
        if (!canvas) return;
        
        // Check if hovering over a marker
        const markerElements = document.elementsFromPoint(e.point.x, e.point.y);
        const hoveringMarker = markerElements.some(el => el.classList.contains('waypoint-marker'));
        
        // Check if we're currently dragging a marker
        const isDragging = Array.from(dragStartPositions.current.keys()).length > 0;
        
        if (hoveringMarker) {
          canvas.style.cursor = 'pointer';
        } else if (isOnWater(e.point)) {
          canvas.style.cursor = isDragging ? 'grabbing' : 'crosshair';
        } else {
          canvas.style.cursor = isDragging ? 'not-allowed' : 'not-allowed';
        }
      });
      
      // Add click handler with water detection and reset timer
      map.current?.on("click", (e) => {
        resetTimer();
        console.log('Map clicked at:', e.lngLat.lng, e.lngLat.lat);
        
        if (isOnWater(e.point)) {
          onAddWaypoint(e.lngLat.lng, e.lngLat.lat);
        }
      });
      
      // Reset timer on other map interactions
      map.current?.on("drag", resetTimer);
      map.current?.on("zoom", resetTimer);
      map.current?.on("pitch", resetTimer);
      map.current?.on("rotate", resetTimer);
      
      // If we have waypoints, update them now
      if (waypoints.length > 0) {
        console.log('Calling updateWaypoints from style.load');
        updateWaypoints();
      }
    });

    return () => {
      console.log('Cleaning up map');
      styleLoaded.current = false;
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
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
          pointer-events: auto !important;
        }
        .mapboxgl-canvas-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          pointer-events: auto !important;
        }
        .mapboxgl-canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          pointer-events: auto !important;
        }
        .waypoint-marker {
          pointer-events: auto !important;
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