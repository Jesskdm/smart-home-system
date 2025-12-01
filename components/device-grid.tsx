"use client"

import { useState, useEffect } from "react"
import SmartLight from "./devices/smart-light"
import SmartLock from "./devices/smart-lock"
import Thermostat from "./devices/thermostat"
import MotionSensor from "./devices/motion-sensor"
import SecurityCamera from "./devices/security-camera"

interface Device {
  id: string
  name: string
  type: string
  status: boolean
  [key: string]: any
}

export default function DeviceGrid({ supabase }: { supabase: any }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDevices = async () => {
      if (!supabase) return

      try {
        const { data, error } = await supabase.from("devices").select("*")

        if (error) {
          console.error("[v0] Error cargando dispositivos:", error)
          // Mostrar datos de ejemplo si hay error
          setDevices(getMockDevices())
        } else {
          setDevices(data || getMockDevices())
        }
      } catch (err) {
        console.error("[v0] Error en loadDevices:", err)
        setDevices(getMockDevices())
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [supabase])

  const handleDeviceUpdate = async (deviceId: string, updates: any) => {
    try {
      const { error } = await supabase.from("devices").update(updates).eq("id", deviceId)

      if (error) {
        console.error("[v0] Error actualizando dispositivo:", error)
        return
      }

      setDevices(devices.map((d) => (d.id === deviceId ? { ...d, ...updates } : d)))
    } catch (err) {
      console.error("[v0] Error en handleDeviceUpdate:", err)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Cargando dispositivos...</div>
  }

  const renderDevice = (device: Device) => {
    switch (device.type) {
      case "light":
        return <SmartLight device={device} onUpdate={handleDeviceUpdate} />
      case "lock":
        return <SmartLock device={device} onUpdate={handleDeviceUpdate} />
      case "thermostat":
        return <Thermostat device={device} onUpdate={handleDeviceUpdate} />
      case "motion_sensor":
        return <MotionSensor device={device} onUpdate={handleDeviceUpdate} />
      case "camera":
        return <SecurityCamera device={device} onUpdate={handleDeviceUpdate} />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id}>{renderDevice(device)}</div>
        ))}
      </div>
    </div>
  )
}

function getMockDevices(): Device[] {
  return [
    { id: "1", name: "Luz Sala", type: "light", status: true, brightness: 80 },
    { id: "2", name: "Cerradura Principal", type: "lock", status: true, locked: true },
    { id: "3", name: "Termostato", type: "thermostat", status: true, temperature: 22, target: 22 },
    { id: "4", name: "Sensor Movimiento", type: "motion_sensor", status: true, motion_detected: false },
    { id: "5", name: "Cámara Entrada", type: "camera", status: true, recording: true },
  ]
}
