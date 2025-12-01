"use client"

import { useState } from "react"
import { Lock, LockOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SmartLockProps {
  device: any
  onUpdate: (id: string, updates: any) => void
}

export default function SmartLock({ device, onUpdate }: SmartLockProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleLock = async () => {
    setIsUpdating(true)
    await onUpdate(device.id, { locked: !device.locked })
    setIsUpdating(false)
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {device.locked ? (
              <Lock className="w-5 h-5 text-red-500" />
            ) : (
              <LockOpen className="w-5 h-5 text-orange-500" />
            )}
            {device.name}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              device.locked ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}
          >
            {device.locked ? "Bloqueada" : "Desbloqueada"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleLock}
          disabled={isUpdating}
          className={`w-full ${
            device.locked ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {device.locked ? "Desbloquear" : "Bloquear"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Estado: {device.locked ? "Asegurada" : "Abierta"}</p>
      </CardContent>
    </Card>
  )
}
