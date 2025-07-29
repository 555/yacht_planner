export interface Waypoint {
  id: number;
  lng: number;
  lat: number;
  name: string;
}

export interface Marina {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
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