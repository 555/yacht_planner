"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Marina {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  facilities?: string[];
  contact?: string;
  website?: string;
}

interface MarinaListProps {
  onMarinaSelect?: (marina: Marina) => void;
  selectedRegion?: string;
}

export default function MarinaList({ onMarinaSelect, selectedRegion }: MarinaListProps) {
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarinas();
  }, [selectedRegion]);

  const fetchMarinas = async () => {
    try {
      setLoading(true);
      // Replace with your actual Webflow API endpoint
      const response = await fetch('/api/marinas/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch marinas');
      }
      
      const data = await response.json();
      setMarinas(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marinas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marinas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading marinas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marinas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            <p>{error}</p>
            <button 
              onClick={fetchMarinas}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Nearby Marinas
          {selectedRegion && <span className="text-sm font-normal ml-2">in {selectedRegion}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {marinas.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No marinas found in this area</p>
          ) : (
            marinas.map((marina) => (
              <div
                key={marina.id}
                className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onMarinaSelect?.(marina)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{marina.name}</h4>
                    {marina.description && (
                      <p className="text-sm text-gray-600 mt-1">{marina.description}</p>
                    )}
                    {marina.facilities && marina.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {marina.facilities.slice(0, 3).map((facility, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {facility}
                          </span>
                        ))}
                        {marina.facilities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{marina.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {marina.latitude && marina.longitude && (
                    <div className="text-xs text-gray-500 ml-2">
                      {marina.latitude.toFixed(4)}, {marina.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
                {(marina.contact || marina.website) && (
                  <div className="flex gap-4 mt-2 text-sm">
                    {marina.contact && (
                      <span className="text-blue-600">{marina.contact}</span>
                    )}
                    {marina.website && (
                      <a
                        href={marina.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}