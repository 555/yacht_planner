"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CalculationSettings } from "@/types/sailing";

interface CalculatorControlsProps {
  settings: CalculationSettings;
  onSettingsChange: (settings: CalculationSettings) => void;
}

export function CalculatorControls({
  settings,
  onSettingsChange
}: CalculatorControlsProps) {
  const updateSetting = (key: keyof CalculationSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleUnits = () => {
    const newUnits = settings.units === "imperial" ? "metric" : "imperial";
    
    let newSettings = { ...settings, units: newUnits };
    
    if (newUnits === "metric") {
      // Converting from imperial to metric
      newSettings.vesselSpeed = Math.round(settings.vesselSpeed * 1.85 * 10) / 10;
      newSettings.fuelConsumption = Math.round(settings.fuelConsumption * 3.75 * 10) / 10;
      newSettings.fuelPrice = Math.round((settings.fuelPrice / 3.75) * 100) / 100;
    } else {
      // Converting from metric to imperial
      newSettings.vesselSpeed = Math.round((settings.vesselSpeed / 1.85) * 10) / 10;
      newSettings.fuelConsumption = Math.round((settings.fuelConsumption / 3.75) * 10) / 10;
      newSettings.fuelPrice = Math.round(settings.fuelPrice * 3.75 * 100) / 100;
    }
    
    onSettingsChange(newSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vessel Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="units"
            checked={settings.units === "metric"}
            onCheckedChange={toggleUnits}
          />
          <Label htmlFor="units">
            {settings.units === "imperial" ? "Imperial" : "Metric"} Units
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">
            Vessel Speed ({settings.units === "imperial" ? "knots" : "km/h"})
          </Label>
          <Input
            id="speed"
            type="number"
            min="1"
            max="50"
            value={settings.vesselSpeed}
            onChange={(e) => updateSetting("vesselSpeed", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="consumption">
            Fuel Consumption ({settings.units === "imperial" ? "gal/h" : "L/h"})
          </Label>
          <Input
            id="consumption"
            type="number"
            min="0.1"
            step="0.1"
            value={settings.fuelConsumption}
            onChange={(e) => updateSetting("fuelConsumption", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">
            Fuel Price (per {settings.units === "imperial" ? "gallon" : "liter"})
          </Label>
          <Input
            id="price"
            type="number"
            min="0.1"
            step="0.1"
            value={settings.fuelPrice}
            onChange={(e) => updateSetting("fuelPrice", Number(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>
  );
}