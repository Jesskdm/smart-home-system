"use client"

import { useState } from "react"
import { Camera, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SecurityCameraProps {
  device: any
  onUpdate: (id: string, updates: any) => void
}

export default function SecurityCamera({ device, onUpdate }: SecurityCameraProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleRecording = async () => {
    setIsUpdating(true)
    await onUpdate(device.id, { recording: !device.recording })
    setIsUpdating(false)
  }

  const togglePower = async () => {
    setIsUpdating(true)
    await onUpdate(device.id, { status: !device.status })
    setIsUpdating(false)
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-500" />
            {device.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {device.recording && <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                device.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {device.status ? "Conectada" : "Desconectada"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-black rounded-lg h-40 flex items-center justify-center">
          <Camera className="w-12 h-12 text-gray-600" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={toggleRecording}
            disabled={isUpdating || !device.status}
            className={`${
              device.recording ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 hover:bg-gray-500"
            } text-white`}
          >
            {device.recording ? "Grabando" : "Grabar"}
          </Button>
          <Button
            onClick={togglePower}
            disabled={isUpdating}
            className={`${device.status ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 hover:bg-gray-500"} text-white`}
          >
            {device.status ? "Apagar" : "Encender"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
