"use client"

import { Activity, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MotionSensorProps {
  device: any
  onUpdate: (id: string, updates: any) => void
}

export default function MotionSensor({ device, onUpdate }: MotionSensorProps) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity
              className={`w-5 h-5 ${device.motion_detected ? "text-red-500 animate-pulse" : "text-green-500"}`}
            />
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
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              device.motion_detected ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <AlertCircle className={`w-6 h-6 ${device.motion_detected ? "text-red-600" : "text-green-600"}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className={`text-lg font-bold ${device.motion_detected ? "text-red-600" : "text-green-600"}`}>
              {device.motion_detected ? "Movimiento detectado" : "Sin movimiento"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">Último evento: Hace 5 minutos</p>
      </CardContent>
    </Card>
  )
}
