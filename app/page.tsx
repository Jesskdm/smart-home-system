"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import DeviceCard from "@/components/device-card"
import AddDeviceForm from "@/components/add-device-form"

interface Device {
  id: string
  name: string
  type: "light" | "lock" | "thermostat" | "motion" | "camera"
  status: Record<string, any>
  ip_address?: string
  location: string
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        window.location.href = "/auth"
        return
      }
      setUser(data.session.user)
      fetchDevices()
    }

    checkAuth()
  }, [])

  async function fetchDevices() {
    try {
      const { data } = await supabase.from("devices").select("*").order("created_at", { ascending: false })

      setDevices(data || [])
    } catch (error) {
      console.error("Error fetching devices:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/auth"
  }

  async function handleUpdateDevice(deviceId: string, newStatus: Record<string, any>) {
    try {
      await supabase.from("devices").update({ status: newStatus }).eq("id", deviceId)

      setDevices(devices.map((d) => (d.id === deviceId ? { ...d, status: newStatus } : d)))

      // Log activity
      await supabase.from("device_logs").insert({
        device_id: deviceId,
        action: JSON.stringify(newStatus),
      })
    } catch (error) {
      console.error("Error updating device:", error)
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    try {
      await supabase.from("devices").delete().eq("id", deviceId)

      setDevices(devices.filter((d) => d.id !== deviceId))
    } catch (error) {
      console.error("Error deleting device:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Control Remoto</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona tus dispositivos IoT</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Add Device Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Agregar Dispositivo</h2>
          <AddDeviceForm onDeviceAdded={fetchDevices} />
        </div>

        {/* Devices Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            {devices.length === 0 ? "Sin dispositivos" : "Mis Dispositivos"}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando dispositivos...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 device-card">
              <p className="text-muted-foreground mb-4">No has agregado dispositivos aún</p>
              <p className="text-sm text-muted-foreground">
                Usa el formulario anterior para agregar tu primer dispositivo
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onUpdate={handleUpdateDevice}
                  onDelete={handleDeleteDevice}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
