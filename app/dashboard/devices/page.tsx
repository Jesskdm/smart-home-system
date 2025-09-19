"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Lightbulb, Lock, Thermometer, Trash2, Home, QrCode, Download, Copy } from "lucide-react"
import QRCode from "qrcode"

export default function DevicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [devices, setDevices] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: "", type: "light", location: "" })
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [deviceConfig, setDeviceConfig] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "devices"), where("userId", "==", user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [user])

  const generateDeviceConfig = (deviceData: any) => {
    const config = {
      deviceId: deviceData.id,
      deviceName: deviceData.name,
      deviceType: deviceData.type,
      location: deviceData.location,
      userId: user?.uid,
      apiEndpoint: `${window.location.origin}/api/devices/${deviceData.id}`,
      setupInstructions: {
        step1: "Conecta el dispositivo a la red WiFi",
        step2: "Escanea este código QR con la app del dispositivo",
        step3: "El dispositivo se configurará automáticamente",
        step4: "Verifica la conexión en el dashboard",
      },
      networkConfig: {
        ssid: "SmartHome_Network",
        security: "WPA2",
        autoConnect: true,
      },
      timestamp: new Date().toISOString(),
      version: "1.0",
    }
    return config
  }

  const generateQRCode = async (config: any) => {
    try {
      setIsGenerating(true)
      const configString = JSON.stringify(config, null, 2)
      const qrDataUrl = await QRCode.toDataURL(configString, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      setQrCodeUrl(qrDataUrl)
      return qrDataUrl
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      })
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddDevice = async () => {
    if (!user || !newDevice.name || !newDevice.type) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" })
      return
    }

    try {
      setIsGenerating(true)

      // Crear dispositivo en Firebase
      const deviceRef = await addDoc(collection(db, "devices"), {
        ...newDevice,
        userId: user.uid,
        status: "offline",
        createdAt: new Date(),
        macAddress: `00:${Math.random().toString(16).substr(2, 2).toUpperCase()}:${Math.random().toString(16).substr(2, 2).toUpperCase()}:${Math.random().toString(16).substr(2, 2).toUpperCase()}:${Math.random().toString(16).substr(2, 2).toUpperCase()}:${Math.random().toString(16).substr(2, 2).toUpperCase()}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
        firmwareVersion: "1.0.0",
      })

      const deviceData = {
        id: deviceRef.id,
        ...newDevice,
      }

      // Generar configuración del dispositivo
      const config = generateDeviceConfig(deviceData)
      setDeviceConfig(config)

      // Generar código QR
      await generateQRCode(config)

      toast({ title: "Dispositivo añadido correctamente" })

      // Cerrar diálogo de añadir y abrir diálogo de QR
      setIsDialogOpen(false)
      setIsQRDialogOpen(true)

      // Limpiar formulario
      setNewDevice({ name: "", type: "light", location: "" })
    } catch (error) {
      console.error("Error adding device:", error)
      toast({ title: "Error al añadir dispositivo", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "online" ? "offline" : "online"
    await updateDoc(doc(db, "devices", id), { status: newStatus })

    toast({
      title: "Estado actualizado",
      description: `Dispositivo ${newStatus === "online" ? "conectado" : "desconectado"}`,
    })
  }

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("¿Eliminar este dispositivo?")) return
    await deleteDoc(doc(db, "devices", id))
    toast({ title: "Dispositivo eliminado" })
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.download = `${deviceConfig?.deviceName || "device"}-qr-config.png`
    link.href = qrCodeUrl
    link.click()
  }

  const copyConfig = async () => {
    if (!deviceConfig) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(deviceConfig, null, 2))
      toast({
        title: "Configuración copiada",
        description: "La configuración se ha copiado al portapapeles",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la configuración",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light":
        return <Lightbulb className="h-6 w-6" />
      case "lock":
        return <Lock className="h-6 w-6" />
      case "thermostat":
        return <Thermometer className="h-6 w-6" />
      default:
        return <Home className="h-6 w-6" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dispositivos</h1>
          <p className="text-muted-foreground">Gestiona tus dispositivos inteligentes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Dispositivo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nombre del Dispositivo</Label>
                <Input
                  id="name"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="Ej: Luz del salón"
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  placeholder="Ej: Salón principal"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Dispositivo</Label>
                <Select value={newDevice.type} onValueChange={(value) => setNewDevice({ ...newDevice, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">💡 Luz Inteligente</SelectItem>
                    <SelectItem value="lock">🔒 Cerradura Inteligente</SelectItem>
                    <SelectItem value="thermostat">🌡️ Termostato</SelectItem>
                    <SelectItem value="camera">📷 Cámara de Seguridad</SelectItem>
                    <SelectItem value="sensor">🔍 Sensor de Movimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDevice} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generando...
                  </>
                ) : (
                  "Añadir y Generar QR"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de código QR */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Configuración del Dispositivo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deviceConfig && (
              <div className="text-center">
                <h3 className="font-medium mb-2">{deviceConfig.deviceName}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Escanea este código QR con tu dispositivo para configurarlo automáticamente
                </p>
              </div>
            )}

            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Instrucciones:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Conecta el dispositivo a la corriente</li>
                <li>2. Abre la app del dispositivo</li>
                <li>3. Escanea el código QR</li>
                <li>4. El dispositivo se configurará automáticamente</li>
              </ol>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={copyConfig}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Config
            </Button>
            <Button variant="outline" onClick={downloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Descargar QR
            </Button>
            <Button onClick={() => setIsQRDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${device.status === "online" ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800"}`}
                >
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{device.location}</p>
                </div>
              </div>
              <Switch
                checked={device.status === "online"}
                onCheckedChange={() => handleToggleStatus(device.id, device.status)}
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${device.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm capitalize">{device.status}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const config = generateDeviceConfig(device)
                      setDeviceConfig(config)
                      generateQRCode(config).then(() => {
                        setIsQRDialogOpen(true)
                      })
                    }}
                    title="Ver código QR"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDevice(device.id)}
                    className="text-destructive hover:text-destructive"
                    title="Eliminar dispositivo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {device.ipAddress && <div className="mt-2 text-xs text-muted-foreground">IP: {device.ipAddress}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay dispositivos</h3>
            <p className="text-sm text-muted-foreground mb-4">Añade tu primer dispositivo inteligente</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Dispositivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
