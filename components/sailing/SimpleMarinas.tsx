"use client";

import { useEffect, useState } from 'react';
import { Marina } from '@/types/sailing';

interface SimpleMarinaDisplayProps {
  onMarinaSelect?: (marina: Marina) => void;
}

export function SimpleMarinaDisplay({ onMarinaSelect }: SimpleMarinaDisplayProps) {
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marinaMarkers, setMarinaMarkers] = useState<any[]>([]);

  // Fetch marinas from API
  useEffect(() => {
    const fetchMarinas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/marinas/');
        if (!response.ok) {
          throw new Error(`Failed to fetch marinas: ${response.status}`);
        }
        
        const data = await response.json();
        setMarinas(data.items || []);
        
        // Add markers to any existing Mapbox map
        addMarinasToMap(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load marinas');
      } finally {
        setLoading(false);
      }
    };

    fetchMarinas();
  }, []);

  const addMarinasToMap = (marinasData: Marina[]) => {
    // Find Mapbox map instance
    const mapboxMap = (window as any).mapboxMapInstance;
    
    if (!mapboxMap) {
      // Retry after a short delay if map isn't ready yet
      setTimeout(() => addMarinasToMap(marinasData), 1000);
      return;
    }

    // Clear existing marina markers
    marinaMarkers.forEach(marker => marker.remove());
    const newMarkers: any[] = [];

    marinasData.forEach(marina => {
      if (marina.latitude && marina.longitude) {
        // Create marina marker element
        const el = document.createElement('div');
        el.className = 'marina-marker';
        
        // Style the marker
        el.style.cssText = `
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 1;
        `;

        // Add marina icon (simplified anchor icon)
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

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
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
        el.appendChild(tooltip);

        // Add hover effects
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.15)';
          el.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.4)';
          tooltip.style.opacity = '1';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
          tooltip.style.opacity = '0';
        });
        
        // Click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onMarinaSelect) {
            onMarinaSelect(marina);
          }
        });

        // Create Mapbox marker
        const marker = new (window as any).mapboxgl.Marker({ 
          element: el,
          anchor: 'center'
        })
          .setLngLat([marina.longitude, marina.latitude])
          .addTo(mapboxMap);

        newMarkers.push(marker);
      }
    });

    setMarinaMarkers(newMarkers);
  };

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      marinaMarkers.forEach(marker => marker.remove());
    };
  }, [marinaMarkers]);

  if (loading) {
    return (
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <div className="text-sm text-gray-600">Loading marinas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
      <div className="text-sm font-medium text-gray-800 mb-2">
        Marinas ({marinas.length})
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white text-[8px]">⚓</div>
        Click markers to add as waypoints
      </div>
    </div>
  );
} 