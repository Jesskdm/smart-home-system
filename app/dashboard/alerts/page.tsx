"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  Bell,
  Shield,
  Thermometer,
  Battery,
  DoorOpen,
  Eye,
  EyeOff,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function AlertsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<any[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  // Cargar alertas
  useEffect(() => {
    if (!user || !db) return

    try {
      const alertsQuery = query(collection(db, "alerts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

      const unsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const alertsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setAlerts(alertsData)
          setLoading(false)
        },
        (error) => {
          console.error("Error loading alerts:", error)
          setAlerts([])
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up alerts listener:", error)
      setLoading(false)
    }
  }, [user])

  // Filtrar alertas
  useEffect(() => {
    let filtered = alerts

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (alert) =>
          alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filtrar por severidad
    if (severityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.severity === severityFilter)
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      const isRead = statusFilter === "read"
      filtered = filtered.filter((alert) => alert.isRead === isRead)
    }

    setFilteredAlerts(filtered)
  }, [alerts, searchQuery, severityFilter, statusFilter])

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), { isRead: true })
      toast({
        title: "Alerta marcada como leída",
        description: "La alerta ha sido marcada como leída.",
      })
    } catch (error) {
      console.error("Error marking alert as read:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la alerta como leída.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsUnread = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), { isRead: false })
      toast({
        title: "Alerta marcada como no leída",
        description: "La alerta ha sido marcada como no leída.",
      })
    } catch (error) {
      console.error("Error marking alert as unread:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la alerta como no leída.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta alerta?")) return

    try {
      await deleteDoc(doc(db, "alerts", alertId))
      toast({
        title: "Alerta eliminada",
        description: "La alerta ha sido eliminada correctamente.",
      })
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta.",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    const unreadAlerts = alerts.filter((alert) => !alert.isRead)

    try {
      const promises = unreadAlerts.map((alert) => updateDoc(doc(db, "alerts", alert.id), { isRead: true }))
      await Promise.all(promises)

      toast({
        title: "Todas las alertas marcadas como leídas",
        description: `${unreadAlerts.length} alertas marcadas como leídas.`,
      })
    } catch (error) {
      console.error("Error marking all alerts as read:", error)
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las alertas como leídas.",
        variant: "destructive",
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "motion_detection":
        return <Bell className="h-4 w-4" />
      case "security_breach":
        return <Shield className="h-4 w-4" />
      case "temperature_alert":
        return <Thermometer className="h-4 w-4" />
      case "low_battery":
        return <Battery className="h-4 w-4" />
      case "door_open":
        return <DoorOpen className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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
        return "bg-gray-100 dark:bg-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historial de Alertas</h1>
            <p className="text-muted-foreground">Cargando alertas...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Historial de Alertas</h1>
          <p className="text-muted-foreground">
            {alerts.length} alertas totales • {alerts.filter((a) => !a.isRead).length} sin leer
          </p>
        </div>
        {alerts.filter((a) => !a.isRead).length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alertas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                <SelectItem value="high">Críticas</SelectItem>
                <SelectItem value="medium">Medias</SelectItem>
                <SelectItem value="low">Bajas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                    !alert.isRead ? "bg-muted/50 border-primary/20" : ""
                  }`}
                >
                  <div className={`p-2 rounded-md ${getSeverityBg(alert.severity)}`}>{getSeverityIcon(alert.type)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${!alert.isRead ? "font-bold" : ""}`}>{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity === "high" ? "Crítica" : alert.severity === "medium" ? "Media" : "Baja"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {alert.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => (alert.isRead ? handleMarkAsUnread(alert.id) : handleMarkAsRead(alert.id))}
                          title={alert.isRead ? "Marcar como no leída" : "Marcar como leída"}
                        >
                          {alert.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar alerta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {alert.createdAt?.toDate
                          ? formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true, locale: es })
                          : "Fecha desconocida"}
                      </span>
                      <span>{alert.createdAt?.toDate?.()?.toLocaleString("es-ES") || ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {alerts.length === 0 ? "No hay alertas" : "No se encontraron alertas"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {alerts.length === 0
                  ? "Aún no se han generado alertas en tu sistema."
                  : "Intenta ajustar los filtros para ver más resultados."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas Críticas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alerts.filter((a) => a.severity === "high").length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-md">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas Medias</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {alerts.filter((a) => a.severity === "medium").length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas Bajas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {alerts.filter((a) => a.severity === "low").length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                  <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
