"use client";
// Cache bust: removed all toast references

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { Waypoint, Marina } from "@/types/sailing";

interface MapComponentProps {
  waypoints: Waypoint[];
  onAddWaypoint: (lng: number, lat: number) => void;
  onUpdateWaypoint: (id: number, lng: number, lat: number) => void;
  onRemoveWaypoint: (id: number) => void;
  marinas: Marina[];
  selectedWaypointMarinas: Record<number, Marina[]>;
  onFetchMarinas?: (bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
}

export function MapComponent({
  waypoints,
  onAddWaypoint,
  onUpdateWaypoint,
  onRemoveWaypoint,
  marinas,
  selectedWaypointMarinas,
  onFetchMarinas
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const marinaMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [mapError, setMapError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const styleLoaded = useRef<boolean>(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const dragStartPositions = useRef<Map<number, mapboxgl.LngLat>>(new Map());
  const recentlyDragged = useRef<Set<number>>(new Set());
  const currentWaypoints = useRef<Waypoint[]>(waypoints);
  const lastResetTime = useRef<number>(0);
  const lastBoundsUpdate = useRef<number>(0);
  const currentBounds = useRef<mapboxgl.LngLatBounds | null>(null);

  // Keep waypoints ref updated
  useEffect(() => {
    currentWaypoints.current = waypoints;
  }, [waypoints]);

  // Initialize Mapbox token from environment variable
  useEffect(() => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setMapError("Mapbox token not found. Please check your environment variables.");
        return;
      }
      setMapboxToken(token);
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

  // Function to redraw route line
  const updateRouteLineDisplay = useCallback(() => {
    if (!map.current || !styleLoaded.current || waypoints.length < 2) return;
    
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
      }
    } catch (error) {
      // Silently handle route redraw errors
    }
  }, [waypoints]);

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
        background: #221896;
        border: 3px solid #f4f4f4;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #f4f4f4;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 8px rgba(34, 24, 150, 0.4);
        z-index: 1000;
        position: absolute;
        outline: none;
        transform: translate(-50%, -50%);
      `;
      
      // Enhanced hover and focus effects (avoid transform to prevent positioning issues)
      const applyHoverState = () => {
        el.style.background = '#dc2626';
        el.style.boxShadow = '0 6px 12px rgba(220, 38, 38, 0.4)';
        el.style.backgroundImage = "url(\"data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5,9 2,12 5,15'/%3E%3Cpolyline points='9,5 12,2 15,5'/%3E%3Cpolyline points='15,19 12,22 9,19'/%3E%3Cpolyline points='19,9 22,12 19,15'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cline x1='12' y1='2' x2='12' y2='22'/%3E%3C/svg%3E\")";
        el.style.backgroundSize = '16px 16px';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.textContent = '';
      };
      
      const applyNormalState = () => {
        el.style.background = '#221896';
        el.style.boxShadow = '0 4px 8px rgba(34, 24, 150, 0.4)';
        el.style.backgroundImage = '';
        el.textContent = (index + 1).toString();
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
        draggable: true,
        anchor: 'center'
      });
      
      // Ensure map container dimensions are ready before positioning
      requestAnimationFrame(() => {
        marker.setLngLat([waypoint.lng, waypoint.lat]).addTo(map.current!);
      });

      // Optimized drag handlers
      marker.on("dragstart", () => {
        const lngLat = marker.getLngLat();
        dragStartPositions.current.set(waypoint.id, lngLat);
        el.style.boxShadow = '0 8px 16px rgba(34, 24, 150, 0.6)';
        el.style.zIndex = '2000';
        el.setAttribute('aria-label', `Dragging waypoint ${index + 1}. Drop on water to move, or on land to cancel.`);
      });

      // Real-time drag feedback with semantic colors
      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        const point = map.current!.project(lngLat);
        
        if (isOnWater(point)) {
          el.style.background = '#3be856';
          el.style.borderColor = '#f4f4f4';
        } else {
          el.style.background = '#dc2626';
          el.style.borderColor = '#040f0b';
        }
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const originalPosition = dragStartPositions.current.get(waypoint.id);
        
        // Reset visual state
        el.style.boxShadow = '0 4px 8px rgba(34, 24, 150, 0.4)';
        el.style.zIndex = '1000';
        el.style.background = '#221896';
        el.style.borderColor = '#f4f4f4';
        el.setAttribute('aria-label', `Waypoint ${index + 1} at ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}. Press Enter to remove or drag to move.`);
        
        const point = map.current!.project(lngLat);
        const onWater = isOnWater(point);
        
        if (onWater) {
          onUpdateWaypoint(waypoint.id, lngLat.lng, lngLat.lat);
        } else {
          if (originalPosition) {
            marker.setLngLat(originalPosition);
            // Redraw the line after marker position settles
            setTimeout(() => {
              updateRouteLineDisplay();
            }, 200);
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
              "line-color": "#221896",
              "line-width": 4,
              "line-dasharray": [1, 2],
              "line-opacity": 0.9
            }
          });
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
  }, [waypoints, onUpdateWaypoint, onRemoveWaypoint, isOnWater, debouncedResetTimer]);

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
        style: "mapbox://styles/alongsideyachts/cley4k7w8000o01o63hs1c6c5",
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
            void actualMapContainer.offsetHeight;
          }
          void mapContainer.current.offsetHeight;
          
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
        
        // Dynamic marina loading on map move/zoom
        const handleMapMove = () => {
          const now = Date.now();
          if (now - lastBoundsUpdate.current < 1000) return; // Debounce 1 second
          
          lastBoundsUpdate.current = now;
          
          if (onFetchMarinas && map.current) {
            const bounds = map.current.getBounds();
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            
            onFetchMarinas({
              minLat: sw.lat,
              minLng: sw.lng,
              maxLat: ne.lat,
              maxLng: ne.lng
            });
          }
        };
        
        map.current?.on("moveend", handleMapMove);
        map.current?.on("zoomend", handleMapMove);
        
        // Initialize waypoints if present
        if (waypoints.length > 0) {
          updateWaypoints();
        }
        
        // Initialize marina markers
        updateMarinaMarkers();
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
        marinaMarkers.current.forEach(marker => marker.remove());
        marinaMarkers.current.clear();
        map.current?.remove();
      };
    } catch (error) {
      setMapError("Failed to initialize map. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, [mapboxToken, onAddWaypoint, isOnWater, debouncedResetTimer]);

  // Create marina markers
  const updateMarinaMarkers = useCallback(() => {
    if (!map.current || !styleLoaded.current) return;

            // Clear existing marina markers and tooltips
        marinaMarkers.current.forEach(marker => {
          const element = marker.getElement();
          // Remove any tooltips that might be attached to document.body
          const existingTooltips = document.querySelectorAll('[data-marina-tooltip]');
          existingTooltips.forEach(tooltip => tooltip.remove());
          marker.remove();
        });
        marinaMarkers.current.clear();

    // Create marina markers
    marinas.forEach((marina) => {
      if (marina.latitude && marina.longitude) {
        // Create marina marker element
        const el = document.createElement('div');
        el.className = 'marina-marker';
        
        // Style the marker (similar to waypoint but smaller and different color)
        el.style.cssText = `
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 500;
          position: absolute;
          outline: none;
          transform: translate(-50%, -50%);
        `;

        // Add marina icon (anchor emoji)
        el.innerHTML = `
          <div style="
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: #0284c7;
          ">⚓</div>
        `;

        // Add tooltip (positioned below marker with fixed offset)
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: fixed;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        tooltip.textContent = marina.name;
        tooltip.setAttribute('data-marina-tooltip', marina.id);
        document.body.appendChild(tooltip);

        // Add hover effects (avoiding transform to prevent positioning issues)
        el.addEventListener('mouseenter', (e) => {
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
          
          // Position tooltip relative to mouse position
          const rect = el.getBoundingClientRect();
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.style.opacity = '1';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.width = '28px';
          el.style.height = '28px';
          el.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
          tooltip.style.opacity = '0';
        });
        
        // Click handler to add marina as waypoint
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onAddWaypoint(marina.longitude!, marina.latitude!);
        });

        // Create Mapbox marker
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        });
        
        // Add to map
        requestAnimationFrame(() => {
          marker.setLngLat([marina.longitude!, marina.latitude!]).addTo(map.current!);
        });

        marinaMarkers.current.set(marina.id, marker);
      }
    });
  }, [marinas, onAddWaypoint]);

  // Update waypoints when they change
  useEffect(() => {
    if (styleLoaded.current) {
      updateWaypoints();
      updateRouteLineDisplay();
    }
  }, [waypoints, updateWaypoints]);

  // Update marina markers when marinas change
  useEffect(() => {
    if (styleLoaded.current) {
      updateMarinaMarkers();
    }
  }, [marinas, updateMarinaMarkers]);

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
        className="w-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
        style={{
          position: 'relative',
          height: '100%',
          borderRadius: '1rem'
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
          width: 100% !important;
          height: 100% !important;
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
          outline: 2px solid #221896;
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