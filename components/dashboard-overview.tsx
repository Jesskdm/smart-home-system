"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Battery,
  BellRing,
  Camera,
  DoorOpen,
  Lock,
  ShieldCheck,
  Wifi,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDeviceTypeIcon, getAlertSeverityColor } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils"

interface DashboardOverviewProps {
  homes: any[]
  devices: any[]
  alerts: any[]
}

export default function DashboardOverview({ homes, devices, alerts }: DashboardOverviewProps) {
  const [selectedHome, setSelectedHome] = useState(homes.length > 0 ? homes[0].id : "")
  const [systemStatus, setSystemStatus] = useState("online")
  const [securityLevel, setSecurityLevel] = useState(85)

  // Filtrar dispositivos por hogar seleccionado
  const filteredDevices = selectedHome ? devices.filter((device) => device.home_id === selectedHome) : devices

  // Filtrar alertas por hogar seleccionado
  const filteredAlerts = selectedHome ? alerts.filter((alert) => alert.home_id === selectedHome) : alerts

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitoreo y control de tu hogar inteligente.</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          {homes.length > 1 && (
            <Select value={selectedHome} onValueChange={setSelectedHome}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar hogar" />
              </SelectTrigger>
              <SelectContent>
                {homes.map((home) => (
                  <SelectItem key={home.id} value={home.id}>
                    {home.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Badge variant={systemStatus === "online" ? "default" : "destructive"} className="px-3 py-1">
            <div className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full mr-2 ${systemStatus === "online" ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              Sistema {systemStatus === "online" ? "En línea" : "Desconectado"}
            </div>
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nivel de Seguridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{securityLevel}%</div>
              <ShieldCheck
                className={`h-6 w-6 ${securityLevel > 70 ? "text-green-500" : securityLevel > 40 ? "text-yellow-500" : "text-red-500"}`}
              />
            </div>
            <Progress value={securityLevel} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{filteredDevices.length}</div>
              <div className="flex -space-x-2">
                {filteredDevices.length > 0 ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                  </>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {filteredDevices.filter((d) => d.status === "online").length} conectados,{" "}
              {filteredDevices.filter((d) => d.status !== "online").length} desconectados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{filteredAlerts.length}</div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {filteredAlerts.filter((a) => a.severity === "high").length} críticas,{" "}
              {filteredAlerts.filter((a) => a.severity === "medium").length} medias
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Estable</div>
              <Wifi className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">Última interrupción: hace 3 días</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Estado de Dispositivos</CardTitle>
            <CardDescription>Monitoreo en tiempo real de tus dispositivos conectados.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDevices.length > 0 ? (
              <div className="space-y-4">
                {filteredDevices.slice(0, 5).map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-md ${device.status === "online" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                      >
                        {device.device_types ? (
                          <span className="flex h-5 w-5 items-center justify-center">
                            {getDeviceTypeIcon(device.device_types.name)}
                          </span>
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <div
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${device.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          {device.status === "online" ? "Conectado" : "Desconectado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {device.battery_level !== null && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Battery className="h-4 w-4 mr-1" />
                          {device.battery_level}%
                        </div>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/devices/${device.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No hay dispositivos</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  No se encontraron dispositivos conectados.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/devices/add">Añadir Dispositivo</Link>
                </Button>
              </div>
            )}
          </CardContent>
          {filteredDevices.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/devices">Ver todos los dispositivos</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
            <CardDescription>Notificaciones y eventos de seguridad.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length > 0 ? (
              <div className="space-y-4">
                {filteredAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div
                      className={`p-2 rounded-md ${
                        alert.severity === "high"
                          ? "bg-red-100 dark:bg-red-900"
                          : alert.severity === "medium"
                            ? "bg-yellow-100 dark:bg-yellow-900"
                            : "bg-blue-100 dark:bg-blue-900"
                      }`}
                    >
                      <BellRing className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{alert.type}</p>
                        <Badge variant={getAlertSeverityColor(alert.severity)}>
                          {alert.severity === "high" ? "Crítica" : alert.severity === "medium" ? "Media" : "Baja"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(alert.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BellRing className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No hay alertas</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">No se encontraron alertas recientes.</p>
              </div>
            )}
          </CardContent>
          {filteredAlerts.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/alerts">Ver todas las alertas</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad del Sistema</CardTitle>
          <CardDescription>Monitoreo de actividad y rendimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="day">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="day">Día</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
              <div className="flex items-center text-sm text-muted-foreground">
                <Activity className="h-4 w-4 mr-1" />
                Actividad normal
              </div>
            </div>
            <TabsContent value="day" className="pt-4">
              <div className="h-[200px] flex items-end justify-between gap-2">
                {Array.from({ length: 24 }).map((_, i) => {
                  const height = Math.random() * 100
                  return (
                    <div key={i} className="relative flex-1">
                      <div
                        className="bg-primary/10 rounded-t-md w-full absolute bottom-0"
                        style={{ height: `${height}%` }}
                      ></div>
                      {i % 4 === 0 && <div className="absolute -bottom-6 text-xs text-muted-foreground">{i}:00</div>}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
            <TabsContent value="week" className="pt-4">
              <div className="h-[200px] flex items-end justify-between gap-6">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => {
                  const height = Math.random() * 100
                  return (
                    <div key={i} className="relative flex-1">
                      <div
                        className="bg-primary/10 rounded-t-md w-full absolute bottom-0"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="absolute -bottom-6 text-xs text-muted-foreground w-full text-center">{day}</div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
            <TabsContent value="month" className="pt-4">
              <div className="h-[200px] flex items-end justify-between gap-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const height = Math.random() * 100
                  return (
                    <div key={i} className="relative flex-1">
                      <div
                        className="bg-primary/10 rounded-t-md w-full absolute bottom-0"
                        style={{ height: `${height}%` }}
                      ></div>
                      {i % 5 === 0 && <div className="absolute -bottom-6 text-xs text-muted-foreground">{i + 1}</div>}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
