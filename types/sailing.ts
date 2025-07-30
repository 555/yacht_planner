export interface Waypoint {
  id: number;
  lng: number;
  lat: number;
  name: string;
}

export interface Marina {
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  facilities?: string[];
  contact?: string;
  website?: string;
  region?: string;
  country?: string;
  distance?: number;
}

export interface CalculationSettings {
  vesselSpeed: number; // knots or km/h
  fuelConsumption: number; // gallons/hour or liters/hour
  fuelPrice: number; // per gallon or liter
  units: "imperial" | "metric";
}

export interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distance: number; // nautical miles or kilometers
  bearing: number;
}

export interface RouteCalculation {
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: number; // hours
  totalFuel: number;
  totalCost: number;
}