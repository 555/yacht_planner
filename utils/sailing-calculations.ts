import { Waypoint, CalculationSettings, RouteCalculation, RouteSegment } from "@/types/sailing";

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in nautical miles
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Calculate the bearing from one point to another
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRadians(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLng);
  
  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate complete route information
 */
export function calculateRoute(waypoints: Waypoint[], settings: CalculationSettings): RouteCalculation {
  if (waypoints.length < 2) {
    return {
      segments: [],
      totalDistance: 0,
      totalTime: 0,
      totalFuel: 0,
      totalCost: 0
    };
  }

  const segments: RouteSegment[] = [];
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    let distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    
    // Convert to kilometers if metric units
    if (settings.units === "metric") {
      distance = distance * 1.852; // Convert nautical miles to kilometers
    }
    
    const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);
    
    segments.push({
      from,
      to,
      distance,
      bearing
    });
    
    totalDistance += distance;
  }

  const totalTime = totalDistance / settings.vesselSpeed;
  const totalFuel = totalTime * settings.fuelConsumption;
  const totalCost = totalFuel * settings.fuelPrice;

  return {
    segments,
    totalDistance,
    totalTime,
    totalFuel,
    totalCost
  };
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}