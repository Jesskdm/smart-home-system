"use client"

import { useState } from "react"

interface Device {
  id: string
  name: string
  type: string
  status: Record<string, any>
  location: string
}

export default function DeviceCard({
  device,
  onUpdate,
  onDelete,
}: {
  device: Device
  onUpdate: (id: string, status: Record<string, any>) => void
  onDelete: (id: string) => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleTogglePower = () => {
    onUpdate(device.id, { ...device.status, power: !device.status.power })
  }

  const handleBrightnessChange = (brightness: number) => {
    onUpdate(device.id, { ...device.status, brightness })
  }

  const handleTemperatureChange = (temp: number) => {
    onUpdate(device.id, { ...device.status, temperature: temp })
  }

  const renderControls = () => {
    switch (device.type) {
      case "light":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Brillo</span>
              <span className="text-sm font-semibold">{device.status.brightness || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={device.status.brightness || 0}
              onChange={(e) => handleBrightnessChange(Number.parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
            />
            <div className="text-xs text-muted-foreground">Temperatura: {device.status.colorTemp || 3000}K</div>
          </div>
        )
      case "lock":
        return (
          <div className="text-center">
            <p className="text-sm font-semibold mb-3">{device.status.locked ? "🔒 Bloqueado" : "🔓 Desbloqueado"}</p>
          </div>
        )
      case "thermostat":
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Actual</p>
                <p className="text-2xl font-bold">{device.status.currentTemp || 20}°C</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Objetivo</p>
                <p className="text-2xl font-bold">{device.status.targetTemp || 22}°C</p>
              </div>
            </div>
            <input
              type="range"
              min="15"
              max="30"
              value={device.status.targetTemp || 22}
              onChange={(e) => handleTemperatureChange(Number.parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
            />
          </div>
        )
      case "motion":
        return (
          <div className="text-center">
            <p className="text-3xl mb-2">{device.status.detected ? "🚨" : "✓"}</p>
            <p className="text-sm font-semibold">
              {device.status.detected ? "Movimiento detectado" : "Sin movimiento"}
            </p>
          </div>
        )
      case "camera":
        return (
          <div className="space-y-2 text-center">
            <p className="text-3xl">📹</p>
            <p className="text-sm font-semibold">{device.status.recording ? "Grabando" : "Standby"}</p>
            <p className="text-xs text-muted-foreground">
              {device.status.resolution || "1080p"} @ {device.status.fps || 30}fps
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="device-card flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{device.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{device.type}</p>
          <p className="text-xs text-muted-foreground mt-1">{device.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePower}
            className={`toggle-switch ${device.status.power ? "active" : "inactive"}`}
          >
            <div className="inline-block w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex-1 my-4 py-4 border-y border-border">{renderControls()}</div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setIsDeleting(true)} className="btn-secondary text-sm flex-1">
          Eliminar
        </button>
        {isDeleting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
              <p className="text-muted-foreground mb-6">¿Estás seguro de que deseas eliminar "{device.name}"?</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleting(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDelete(device.id)
                    setIsDeleting(false)
                  }}
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
