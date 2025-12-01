"use client"
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

export default function DeviceGrid({
  devices,
  onDeviceUpdate,
}: {
  devices: Device[]
  onDeviceUpdate: (deviceId: string, updates: Record<string, any>) => Promise<void>
}) {
  const renderDevice = (device: Device) => {
    switch (device.type) {
      case "light":
        return <SmartLight device={device} onUpdate={onDeviceUpdate} />
      case "lock":
        return <SmartLock device={device} onUpdate={onDeviceUpdate} />
      case "thermostat":
        return <Thermostat device={device} onUpdate={onDeviceUpdate} />
      case "motion_sensor":
        return <MotionSensor device={device} onUpdate={onDeviceUpdate} />
      case "camera":
        return <SecurityCamera device={device} onUpdate={onDeviceUpdate} />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {devices.map((device) => (
        <div key={device.id}>{renderDevice(device)}</div>
      ))}
    </div>
  )
}
