"use client"

import { useState } from "react"
import { Lightbulb, Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SmartLightProps {
  device: any
  onUpdate: (id: string, updates: any) => void
}

export default function SmartLight({ device, onUpdate }: SmartLightProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleLight = async () => {
    setIsUpdating(true)
    await onUpdate(device.id, { status: !device.status })
    setIsUpdating(false)
  }

  const adjustBrightness = async (value: number) => {
    setIsUpdating(true)
    await onUpdate(device.id, { brightness: value })
    setIsUpdating(false)
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className={`w-5 h-5 ${device.status ? "text-yellow-500" : "text-gray-400"}`} />
            {device.name}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              device.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {device.status ? "Encendida" : "Apagada"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleLight}
          disabled={isUpdating}
          className={`w-full ${
            device.status
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-gray-300 hover:bg-gray-400 text-gray-700"
          }`}
        >
          {device.status ? "Apagar luz" : "Encender luz"}
        </Button>

        {device.status && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Brillo: {device.brightness}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={device.brightness || 80}
              onChange={(e) => adjustBrightness(Number.parseInt(e.target.value))}
              className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
