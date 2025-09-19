"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Battery, Home, Lock, MoreHorizontal, Pencil, Plus, Search, Settings, Trash } from "lucide-react"
import { getDeviceTypeIcon } from "@/lib/utils"

interface DeviceManagementProps {
  homes: any[]
  devices: any[]
  deviceTypes: any[]
}

export default function DeviceManagement({ homes, devices: initialDevices, deviceTypes }: DeviceManagementProps) {
  const { toast } = useToast()
  const [devices, setDevices] = useState(initialDevices)
  const [selectedHome, setSelectedHome] = useState(homes.length > 0 ? homes[0].id : "")
  const [selectedType, setSelectedType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: "",
    deviceTypeId: "",
    homeId: selectedHome,
    location: "",
    ipAddress: "",
    macAddress: "",
  })

  // Filtrar dispositivos por hogar, tipo y búsqueda
  const filteredDevices = devices.filter((device) => {
    const matchesHome = selectedHome ? device.home_id === selectedHome : true
    const matchesType = selectedType !== "all" ? device.device_type_id === Number.parseInt(selectedType) : true
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.location && device.location.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesHome && matchesType && matchesSearch
  })

  const handleAddDevice = async () => {
    try {
      const supabase = createClient()

      // Validar campos requeridos
      if (!newDevice.name || !newDevice.deviceTypeId || !newDevice.homeId) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        })
        return
      }

      // Crear dispositivo
      const { data: deviceData, error: deviceError } = await supabase
        .from("devices")
        .insert({
          name: newDevice.name,
          device_type_id: Number.parseInt(newDevice.deviceTypeId),
          home_id: newDevice.homeId,
          location: newDevice.location || null,
          ip_address: newDevice.ipAddress || null,
          mac_address: newDevice.macAddress || null,
          status: "online",
          battery_level: 100,
        })
        .select()

      if (deviceError) {
        throw deviceError
      }

      // Obtener dispositivos actualizados
      const { data: updatedDevices } = await supabase
        .from("devices")
        .select(`
          *,
          device_types(*)
        `)
        .in(
          "home_id",
          homes.map((home) => home.id),
        )

      if (updatedDevices) {
        setDevices(updatedDevices)
      }

      toast({
        title: "Dispositivo añadido",
        description: `El dispositivo ${newDevice.name} ha sido añadido correctamente.`,
      })

      // Limpiar formulario
      setNewDevice({
        name: "",
        deviceTypeId: "",
        homeId: selectedHome,
        location: "",
        ipAddress: "",
        macAddress: "",
      })

      // Cerrar diálogo
      setIsAddDeviceOpen(false)
    } catch (error: any) {
      toast({
        title: "Error al añadir dispositivo",
        description: error.message || "Ha ocurrido un error al añadir el dispositivo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este dispositivo? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const supabase = createClient()

      // Eliminar dispositivo
      const { error } = await supabase.from("devices").delete().eq("id", deviceId)

      if (error) {
        throw error
      }

      // Actualizar lista de dispositivos
      setDevices(devices.filter((device) => device.id !== deviceId))

      toast({
        title: "Dispositivo eliminado",
        description: "El dispositivo ha sido eliminado correctamente.",
      })
    } catch (error: any) {
      toast({
        title: "Error al eliminar dispositivo",
        description: error.message || "Ha ocurrido un error al eliminar el dispositivo.",
        variant: "destructive",
      })
    }
  }

  const handleToggleDeviceStatus = async (deviceId: string, currentStatus: string) => {
    try {
      const supabase = createClient()

      const newStatus = currentStatus === "online" ? "offline" : "online"

      // Actualizar estado del dispositivo
      const { error } = await supabase.from("devices").update({ status: newStatus }).eq("id", deviceId)

      if (error) {
        throw error
      }

      // Actualizar lista de dispositivos
      setDevices(devices.map((device) => (device.id === deviceId ? { ...device, status: newStatus } : device)))

      toast({
        title: "Estado actualizado",
        description: `El dispositivo ahora está ${newStatus === "online" ? "conectado" : "desconectado"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error al actualizar el estado del dispositivo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispositivos</h1>
          <p className="text-muted-foreground">Gestiona y controla tus dispositivos inteligentes.</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar dispositivos..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Dispositivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Dispositivo</DialogTitle>
                <DialogDescription>Añade un nuevo dispositivo a tu hogar inteligente.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Nombre del Dispositivo</Label>
                  <Input
                    id="deviceName"
                    placeholder="Cámara Principal"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceType">Tipo de Dispositivo</Label>
                  <Select
                    value={newDevice.deviceTypeId}
                    onValueChange={(value) => setNewDevice({ ...newDevice, deviceTypeId: value })}
                  >
                    <SelectTrigger id="deviceType">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homeId">Hogar</Label>
                  <Select
                    value={newDevice.homeId}
                    onValueChange={(value) => setNewDevice({ ...newDevice, homeId: value })}
                  >
                    <SelectTrigger id="homeId">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Entrada Principal"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">Dirección IP</Label>
                  <Input
                    id="ipAddress"
                    placeholder="192.168.1.100"
                    value={newDevice.ipAddress}
                    onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macAddress">Dirección MAC</Label>
                  <Input
                    id="macAddress"
                    placeholder="00:1A:2B:3C:4D:5E"
                    value={newDevice.macAddress}
                    onChange={(e) => setNewDevice({ ...newDevice, macAddress: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddDevice}>Añadir Dispositivo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {homes.length > 1 && (
                <div>
                  <p className="text-sm font-medium mb-2">Hogar</p>
                  <Select value={selectedHome} onValueChange={setSelectedHome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los hogares" />
                    </SelectTrigger>
                    <SelectContent>
                      {homes.map((home) => (
                        <SelectItem key={home.id} value={home.id}>
                          {home.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-2">Tipo de Dispositivo</p>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm">Total de Dispositivos</p>
                <Badge variant="secondary">{devices.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">Conectados</p>
                <Badge variant="default">{devices.filter((d) => d.status === "online").length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">Desconectados</p>
                <Badge variant="destructive">{devices.filter((d) => d.status !== "online").length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Todos los Dispositivos</CardTitle>
              <CardDescription>{filteredDevices.length} dispositivos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="cameras">Cámaras</TabsTrigger>
                  <TabsTrigger value="locks">Cerraduras</TabsTrigger>
                  <TabsTrigger value="sensors">Sensores</TabsTrigger>
                  <TabsTrigger value="other">Otros</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {filteredDevices.length > 0 ? (
                    <div className="space-y-4">
                      {filteredDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-md ${device.status === "online" ? "bg-primary/10" : "bg-muted"}`}
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
                                {device.location && <span className="ml-2">• {device.location}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {device.battery_level !== null && (
                              <div
                                className={`flex items-center text-sm ${device.battery_level < 20 ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                <Battery className="h-4 w-4 mr-1" />
                                {device.battery_level}%
                              </div>
                            )}
                            <Switch
                              checked={device.status === "online"}
                              onCheckedChange={() => handleToggleDeviceStatus(device.id, device.status)}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/devices/${device.id}`}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configurar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/devices/${device.id}/edit`}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteDevice(device.id)}>
                                  <Trash className="h-4 w-4 mr-2 text-destructive" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">No hay dispositivos</h3>
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        No se encontraron dispositivos con los filtros seleccionados.
                      </p>
                      <Button className="mt-4" onClick={() => setIsAddDeviceOpen(true)}>
                        Añadir Dispositivo
                      </Button>
                    </div>
                  )}
                </TabsContent>
                {/* Contenido similar para otras pestañas */}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
