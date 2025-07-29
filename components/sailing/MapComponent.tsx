"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  const [mapError, setMapError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const styleLoaded = useRef<boolean>(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const dragStartPositions = useRef<Map<number, mapboxgl.LngLat>>(new Map());
  const recentlyDragged = useRef<Set<number>>(new Set());
  const currentWaypoints = useRef<Waypoint[]>(waypoints);
  const lastResetTime = useRef<number>(0);
  const { toast } = useToast();

  // Keep waypoints ref updated
  useEffect(() => {
    currentWaypoints.current = waypoints;
  }, [waypoints]);

  // Initialize Mapbox token
  useEffect(() => {
    try {
      setMapboxToken("pk.eyJ1IjoiYWxvbmdzaWRleWFjaHRzIiwiYSI6ImNtZG9wZjQxeTAzcnMybXM5OTZ1NHJ1ZGYifQ.p-EJW0oDtDlpdaFxhq14yA");
    } catch (error) {
      setMapError("Failed to initialize map configuration");
    }
  }, []);

  // Debounced timer reset to prevent excessive timer creation
  const debouncedResetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastResetTime.current < 100) return; // Debounce within 100ms
    lastResetTime.current = now;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      if (!map.current) return;
      
      const freshWaypoints = currentWaypoints.current;
      if (freshWaypoints.length < 2) return;
      
      const coordinates = freshWaypoints.map(w => [w.lng, w.lat] as [number, number]);
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        maxZoom: 8,
        duration: 2500,
        easing: (t) => t * (2 - t)
      });
    }, 1000);
  }, []);

  // Check if point is on water - optimized function
  const isOnWater = useCallback((point: mapboxgl.Point) => {
    try {
      const features = map.current?.queryRenderedFeatures(point);
      if (!features) return false;
      
      return features.some(feature => feature.sourceLayer === 'water');
    } catch (error) {
      return false;
    }
  }, []);

  // Optimized waypoint update function with accessibility
  const updateWaypoints = useCallback(() => {
    if (!map.current || !styleLoaded.current) return;

    // Clear existing markers efficiently
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Create accessible waypoint markers
    waypoints.forEach((waypoint, index) => {
      const el = document.createElement("div");
      el.className = "waypoint-marker";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", `Waypoint ${index + 1} at ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}. Press Enter to remove or drag to move.`);
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(var(--primary));
        border: 3px solid hsl(var(--background));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(var(--primary-foreground));
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 8px hsl(var(--primary) / 0.4);
        z-index: 1000;
        position: absolute;
        transition: all 0.2s ease;
        outline: none;
      `;
      
      // Enhanced hover and focus effects
      const applyHoverState = () => {
        el.style.background = 'hsl(var(--destructive))';
        el.style.transform = 'scale(1.1)';
      };
      
      const applyNormalState = () => {
        el.style.background = 'hsl(var(--primary))';
        el.style.transform = 'scale(1)';
      };
      
      el.addEventListener('mouseenter', applyHoverState);
      el.addEventListener('mouseleave', applyNormalState);
      el.addEventListener('focus', applyHoverState);
      el.addEventListener('blur', applyNormalState);
      
      el.textContent = (index + 1).toString();

      // Accessible click and keyboard handlers
      const handleRemove = (e: Event) => {
        e.stopPropagation();
        if (!dragStartPositions.current.has(waypoint.id) && !recentlyDragged.current.has(waypoint.id)) {
          onRemoveWaypoint(waypoint.id);
          // Announce removal to screen readers
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.textContent = `Waypoint ${index + 1} removed`;
          announcement.style.position = 'absolute';
          announcement.style.left = '-10000px';
          document.body.appendChild(announcement);
          setTimeout(() => document.body.removeChild(announcement), 1000);
        }
      };
      
      el.addEventListener('click', handleRemove);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRemove(e);
        }
      });

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([waypoint.lng, waypoint.lat])
        .addTo(map.current!);

      // Optimized drag handlers
      marker.on("dragstart", () => {
        const lngLat = marker.getLngLat();
        dragStartPositions.current.set(waypoint.id, lngLat);
        el.style.transform = 'scale(1.1)';
        el.style.zIndex = '2000';
        el.setAttribute('aria-label', `Dragging waypoint ${index + 1}. Drop on water to move, or on land to cancel.`);
      });

      // Real-time drag feedback with semantic colors
      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        const point = map.current!.project(lngLat);
        
        if (isOnWater(point)) {
          el.style.background = 'hsl(var(--success))';
          el.style.borderColor = 'hsl(var(--success-foreground))';
        } else {
          el.style.background = 'hsl(var(--destructive))';
          el.style.borderColor = 'hsl(var(--destructive-foreground))';
        }
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const originalPosition = dragStartPositions.current.get(waypoint.id);
        
        // Reset visual state
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1000';
        el.style.background = 'hsl(var(--primary))';
        el.style.borderColor = 'hsl(var(--background))';
        el.setAttribute('aria-label', `Waypoint ${index + 1} at ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}. Press Enter to remove or drag to move.`);
        
        const point = map.current!.project(lngLat);
        const onWater = isOnWater(point);
        
        if (onWater) {
          onUpdateWaypoint(waypoint.id, lngLat.lng, lngLat.lat);
        } else {
          if (originalPosition) {
            marker.setLngLat(originalPosition);
            toast({
              title: "Invalid placement",
              description: "Waypoints can only be placed on water. The marker has been returned to its original position.",
              variant: "destructive",
            });
          }
        }
        
        // Cleanup drag state
        dragStartPositions.current.delete(waypoint.id);
        
        // Prevent immediate click removal
        recentlyDragged.current.add(waypoint.id);
        setTimeout(() => {
          recentlyDragged.current.delete(waypoint.id);
        }, 200);
      });

      // Accessible popup with waypoint info
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        className: 'waypoint-popup'
      }).setHTML(`
        <div role="dialog" aria-label="Waypoint information">
          <h3 class="font-semibold">${waypoint.name}</h3>
          <p class="text-sm text-muted-foreground">
            ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Click or press Enter to remove
          </p>
        </div>
      `);

      marker.setPopup(popup);
      markers.current.set(waypoint.id, marker);
    });

    // Optimized route line drawing
    if (waypoints.length > 1) {
      const coordinates = waypoints.map(w => [w.lng, w.lat]);
      
      try {
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
              "line-width": 3,
              "line-dasharray": [0.5, 2]
            }
          }, "waterway-label");
        }
      } catch (error) {
        // Silently handle route drawing errors
      }
    } else if (map.current.getLayer?.("route")) {
      try {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      } catch (error) {
        // Silently handle cleanup errors
      }
    }
    
    // Trigger auto-zoom timer
    debouncedResetTimer();
  }, [waypoints, onUpdateWaypoint, onRemoveWaypoint, isOnWater, toast, debouncedResetTimer]);

  // Main map initialization effect
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapboxToken === "YOUR_MAPBOX_TOKEN_HERE") {
      setIsLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/alongsideyachts/cmdki7mng000l01si77fv8p5x",
        center: [-74.5, 40],
        zoom: 2,
        maxZoom: 9.6,
        projection: { name: "mercator" },
        dragRotate: false,
        touchZoomRotate: false,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false
      }), "top-right");

      // Optimized resize handler
      const handleResize = () => {
        if (!map.current || !mapContainer.current) return;
        
        try {
          const actualMapContainer = mapContainer.current.closest('.map-container') as HTMLElement;
          if (actualMapContainer) {
            actualMapContainer.removeAttribute('style');
          }
          
          mapContainer.current.removeAttribute('style');
          
          const canvas = mapContainer.current.querySelector('.mapboxgl-canvas') as HTMLElement;
          if (canvas) {
            canvas.removeAttribute('style');
          }
          
          // Force reflow
          if (actualMapContainer) {
            actualMapContainer.offsetHeight;
          }
          mapContainer.current.offsetHeight;
          
          const containerToMeasure = actualMapContainer || mapContainer.current;
          const containerRect = containerToMeasure.getBoundingClientRect();
          const widthPx = `${containerRect.width}px`;
          const heightPx = `${containerRect.height}px`;
          
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
          
          map.current.resize();
        } catch (error) {
          // Silently handle resize errors
        }
      };

      // Add optimized resize listener
      window.addEventListener('resize', handleResize);

      // Initialize map features after style loads
      map.current.on('style.load', () => {
        styleLoaded.current = true;
        setIsLoading(false);
        
        // Optimized mousemove handler with cursor management
        map.current?.on("mousemove", (e) => {
          debouncedResetTimer();
          
          const canvas = map.current?.getCanvas();
          if (!canvas) return;
          
          try {
            const markerElements = document.elementsFromPoint(e.point.x, e.point.y);
            const hoveringMarker = markerElements.some(el => el.classList.contains('waypoint-marker'));
            const isDragging = dragStartPositions.current.size > 0;
        
            if (hoveringMarker) {
              canvas.style.cursor = 'pointer';
            } else if (isOnWater(e.point)) {
              canvas.style.cursor = isDragging ? 'grabbing' : 'crosshair';
            } else {
              canvas.style.cursor = isDragging ? 'not-allowed' : 'not-allowed';
            }
          } catch (error) {
            canvas.style.cursor = 'default';
          }
        });
      
        // Optimized click handler with accessibility
        map.current?.on("click", (e) => {
          debouncedResetTimer();
          
          if (isOnWater(e.point)) {
            onAddWaypoint(e.lngLat.lng, e.lngLat.lat);
          }
        });
      
        // Register interaction handlers
        map.current?.on("drag", debouncedResetTimer);
        map.current?.on("zoom", debouncedResetTimer);
        map.current?.on("pitch", debouncedResetTimer);
        map.current?.on("rotate", debouncedResetTimer);
        
        // Initialize waypoints if present
        if (waypoints.length > 0) {
          updateWaypoints();
        }
      });

      // Comprehensive cleanup
      return () => {
        styleLoaded.current = false;
        setIsLoading(false);
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
        window.removeEventListener('resize', handleResize);
        markers.current.forEach(marker => marker.remove());
        markers.current.clear();
        map.current?.remove();
      };
    } catch (error) {
      setMapError("Failed to initialize map. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, [mapboxToken, onAddWaypoint, isOnWater, debouncedResetTimer]);

  // Update waypoints when they change
  useEffect(() => {
    if (styleLoaded.current) {
      updateWaypoints();
    }
  }, [updateWaypoints]);

  // Error state
  if (mapError) {
    return (
      <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Map Error</h3>
          <p className="text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

  // Missing token state
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
    <div className="relative" style={{ height: '100%' }} role="application" aria-label="Interactive sailing route map">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapContainer}
        className="w-full rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%'
        }}
        tabIndex={0}
        role="img"
        aria-label="Sailing route map. Use Tab to navigate to waypoints, click on water to add new waypoints."
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
        .waypoint-marker:focus {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .waypoint-popup {
          font-family: inherit;
        }
        @media (prefers-reduced-motion: reduce) {
          .waypoint-marker {
            transition: none !important;
          }
        }
      `}</style>
      
      {/* Instructions overlay */}
      {waypoints.length === 0 && (
        <div 
          className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-md border"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-muted-foreground">
            Click on the map to add waypoints and create your sailing route
          </p>
        </div>
      )}
      
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {waypoints.length > 0 && `Route has ${waypoints.length} waypoint${waypoints.length === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}