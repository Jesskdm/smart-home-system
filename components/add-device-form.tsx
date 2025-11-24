"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

const DEVICE_TYPES = [
  { value: "light", label: "💡 Foco Inteligente" },
  { value: "lock", label: "🔒 Cerradura Inteligente" },
  { value: "thermostat", label: "🌡️ Termostato" },
  { value: "motion", label: "📍 Sensor de Movimiento" },
  { value: "camera", label: "📹 Cámara de Seguridad" },
]

export default function AddDeviceForm({ onDeviceAdded }: { onDeviceAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "light",
    location: "",
    ip_address: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user?.id) {
        throw new Error("No autorizado")
      }

      const defaultStatus: Record<string, any> = {
        power: false,
      }

      switch (formData.type) {
        case "light":
          defaultStatus.brightness = 50
          defaultStatus.colorTemp = 3000
          break
        case "lock":
          defaultStatus.locked = false
          break
        case "thermostat":
          defaultStatus.currentTemp = 20
          defaultStatus.targetTemp = 22
          break
        case "motion":
          defaultStatus.detected = false
          break
        case "camera":
          defaultStatus.recording = false
          defaultStatus.resolution = "1080p"
          defaultStatus.fps = 30
          break
      }

      const { error } = await supabase.from("devices").insert({
        user_id: session.session.user.id,
        name: formData.name,
        type: formData.type,
        location: formData.location,
        ip_address: formData.ip_address,
        status: defaultStatus,
      })

      if (error) throw error

      setFormData({ name: "", type: "light", location: "", ip_address: "" })
      onDeviceAdded()
      alert("Dispositivo agregado exitosamente")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="device-card max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Nombre</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Ej: Lámpara Sala"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {DEVICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Ubicación</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Ej: Sala"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">IP del Dispositivo</label>
          <input
            type="text"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="192.168.1.100 (opcional)"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-md bg-accent/10 border border-accent text-accent text-sm">{error}</div>
      )}

      <button type="submit" disabled={loading} className="w-full btn-primary font-medium mt-4 disabled:opacity-50">
        {loading ? "Agregando..." : "Agregar Dispositivo"}
      </button>
    </form>
  )
}
