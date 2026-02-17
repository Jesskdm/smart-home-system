"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import DeviceGrid from "@/components/device-grid"
import ActivityLog from "@/components/activity-log"
import { AlertCircle, Loader2 } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  location: string
  status: boolean
  brightness?: number
  temperature?: number
  is_locked?: boolean
  is_recording?: boolean
  last_motion?: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Cargando dispositivos desde API...")

      const response = await fetch("/api/devices")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar dispositivos")
      }

      setDevices(result.data || [])
      console.log("[v0] Dispositivos cargados:", result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      console.error("[v0] Error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceUpdate = async (deviceId: string, updates: Record<string, any>) => {
    try {
      console.log("[v0] Actualizando dispositivo:", deviceId, updates)

      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar dispositivo")
      }

      setDevices((prev) => prev.map((device) => (device.id === deviceId ? result.data : device)))

      await fetch("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          action: Object.keys(updates)[0],
          details: JSON.stringify(updates),
        }),
      })

      console.log("[v0] Dispositivo actualizado:", result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      console.error("[v0] Error al actualizar:", errorMessage)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-900/20 border border-red-800 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-200">Error de conexión</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-slate-400">Cargando dispositivos...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No hay dispositivos disponibles</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DeviceGrid devices={devices} onDeviceUpdate={handleDeviceUpdate} />
            </div>
            <div>
              <ActivityLog />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
