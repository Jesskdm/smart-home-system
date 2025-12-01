"use client"

import { useState } from "react"
import { Thermometer, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ThermostatProps {
  device: any
  onUpdate: (id: string, updates: any) => void
}

export default function Thermostat({ device, onUpdate }: ThermostatProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const adjustTemperature = async (delta: number) => {
    setIsUpdating(true)
    const newTemp = Math.max(16, Math.min(30, (device.target || 22) + delta))
    await onUpdate(device.id, { target: newTemp })
    setIsUpdating(false)
  }

  const togglePower = async () => {
    setIsUpdating(true)
    await onUpdate(device.id, { status: !device.status })
    setIsUpdating(false)
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-purple-500" />
            {device.name}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              device.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {device.status ? "Activo" : "Inactivo"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Temperatura actual</p>
          <p className="text-3xl font-bold text-purple-600">{device.temperature}°C</p>
          <p className="text-sm text-muted-foreground mt-2">Meta: {device.target || 22}°C</p>
        </div>

        {device.status && (
          <div className="flex gap-2">
            <Button
              onClick={() => adjustTemperature(-1)}
              disabled={isUpdating}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => adjustTemperature(1)}
              disabled={isUpdating}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button
          onClick={togglePower}
          disabled={isUpdating}
          className={`w-full ${
            device.status ? "bg-purple-500 hover:bg-purple-600" : "bg-gray-400 hover:bg-gray-500"
          } text-white`}
        >
          {device.status ? "Apagar" : "Encender"}
        </Button>
      </CardContent>
    </Card>
  )
}
