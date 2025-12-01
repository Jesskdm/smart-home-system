"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface ActivityLog {
  id: string
  device_id: string
  action: string
  details: string
  created_at: string
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadLogs = async () => {
    try {
      const response = await fetch("/api/activity-logs")
      const result = await response.json()

      if (result.success) {
        setLogs(result.data || [])
      }
    } catch (error) {
      console.error("[v0] Error cargando logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5" />
          Registro de actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-sm">Cargando...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-400 text-sm">Sin actividad registrada</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="text-xs bg-slate-700/50 p-2 rounded border border-slate-600">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-blue-400">{log.action}</span>
                  <span className="text-slate-400">{formatTime(log.created_at)}</span>
                </div>
                <p className="text-slate-300 mt-1 truncate">{log.details}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
