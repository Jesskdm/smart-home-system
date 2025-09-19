"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertTriangle, Lightbulb, Lock, Thermometer, Wifi, PlusCircle, Home, Bell } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [devices, setDevices] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // Cargar datos en segundo plano sin bloquear UI
  useEffect(() => {
    if (!user || !db) return

    try {
      // Cargar dispositivos
      const devicesQuery = query(collection(db, "devices"), where("userId", "==", user.uid))
      const unsubscribeDevices = onSnapshot(
        devicesQuery,
        (snapshot) => {
          const devicesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setDevices(devicesData)
        },
        (error) => {
          console.error("Error loading devices:", error)
          setDevices([]) // Mantener array vacío si falla
        },
      )

      // Cargar alertas
      const alertsQuery = query(collection(db, "alerts"), where("userId", "==", user.uid))
      const unsubscribeAlerts = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const alertsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          // Ordenar por fecha más reciente
          alertsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })
          setAlerts(alertsData)
        },
        (error) => {
          console.error("Error loading alerts:", error)
          setAlerts([]) // Mantener array vacío si falla
        },
      )

      return () => {
        unsubscribeDevices()
        unsubscribeAlerts()
      }
    } catch (error) {
      console.error("Error setting up listeners:", error)
    }
  }, [user])

  const onlineDevices = devices.filter((d) => d.status === "online").length
  const securityScore = devices.length > 0 ? Math.round((onlineDevices / devices.length) * 100) : 85

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light":
        return <Lightbulb className="h-5 w-5" />
      case "lock":
        return <Lock className="h-5 w-5" />
      case "thermostat":
        return <Thermometer className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const simulateAlert = async () => {
    if (!user || !db || isSimulating) return

    setIsSimulating(true)

    try {
      const alertTypes = [
        {
          message: "Se detectó movimiento en la puerta principal",
          type: "motion_detection",
          severity: "medium",
        },
        {
          message: "Intento de acceso no autorizado detectado",
          type: "security_breach",
          severity: "high",
        },
        {
          message: "Batería baja en sensor de ventana",
          type: "low_battery",
          severity: "low",
        },
        {
          message: "Temperatura alta detectada en el salón",
          type: "temperature_alert",
          severity: "medium",
        },
        {
          message: "Puerta principal dejada abierta",
          type: "door_open",
          severity: "medium",
        },
      ]

      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]

      const alertData = {
        userId: user.uid,
        message: randomAlert.message,
        type: randomAlert.type,
        severity: randomAlert.severity,
        isRead: false,
        createdAt: Timestamp.now(),
        deviceId: devices.length > 0 ? devices[Math.floor(Math.random() * devices.length)].id : null,
      }

      console.log("Creating alert:", alertData)

      await addDoc(collection(db, "alerts"), alertData)

      toast({
        title: "¡Alerta simulada!",
        description: randomAlert.message,
        variant: randomAlert.severity === "high" ? "destructive" : "default",
      })

      // Simular notificación del navegador si está disponible
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Smart Home Alert", {
          body: randomAlert.message,
          icon: "/favicon.ico",
        })
      }
    } catch (error) {
      console.error("Error creating alert:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la alerta simulada. Revisa la consola para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsSimulating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 dark:text-red-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "low":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-blue-600 dark:text-blue-400"
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 dark:bg-red-900"
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900"
      case "low":
        return "bg-blue-100 dark:bg-blue-900"
      default:
        return "bg-blue-100 dark:bg-blue-900"
    }
  }

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header - Inmediato */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenido, {userData?.displayName || user?.email?.split("@")[0] || "Usuario"}
          </h1>
          <p className="text-muted-foreground">Panel de control de tu hogar inteligente</p>
        </div>
        <Button onClick={simulateAlert} variant="outline" size="sm" disabled={isSimulating || !db}>
          {isSimulating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Simulando...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Simular Alerta
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards - Inmediatos con datos dinámicos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineDevices} / {devices.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Conectados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seguridad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter((a) => !a.isRead).length}</div>
            <p className="text-xs text-muted-foreground">Sin leer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href="/dashboard/devices">Dispositivos</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
              <Link href="/dashboard/settings">Ajustes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos y Alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dispositivos</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/devices">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.slice(0, 3).map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-md ${device.status === "online" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                      >
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{device.status}</p>
                      </div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${device.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium">No hay dispositivos</h3>
                <p className="text-sm text-muted-foreground mb-4">Añade tu primer dispositivo</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/devices">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Añadir Dispositivo
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Actividad Reciente</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/alerts">Ver historial</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-md ${getSeverityBg(alert.severity)}`}>
                      <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${!alert.isRead ? "font-bold" : ""}`}>{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSeverityBg(alert.severity)} ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity === "high" ? "Crítica" : alert.severity === "medium" ? "Media" : "Baja"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {alert.createdAt?.toDate?.()?.toLocaleString() || "Hace un momento"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium">Todo tranquilo</h3>
                <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
