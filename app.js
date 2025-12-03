/**
 * APLICACIÓN DE CONTROL DE DISPOSITIVOS INTELIGENTES
 * Gestiona la interfaz de usuario y la lógica de interacción
 * Se conecta al backend que ya está conectado a Supabase
 */

// Tipos de dispositivos
const DEVICE_TYPES = {
  LIGHT: "light",
  LOCK: "lock",
  THERMOSTAT: "thermostat",
  MOTION_SENSOR: "motion_sensor",
  CAMERA: "camera",
}

// Mapeo de secciones
const SECTION_MAPPING = {
  [DEVICE_TYPES.LIGHT]: "lights-grid",
  [DEVICE_TYPES.LOCK]: "locks-grid",
  [DEVICE_TYPES.THERMOSTAT]: "thermostats-grid",
  [DEVICE_TYPES.MOTION_SENSOR]: "motion-sensors-grid",
  [DEVICE_TYPES.CAMERA]: "cameras-grid",
}

// Variables globales
let allDevices = []
let pollingInterval = null

/**
 * Inicialización de la aplicación
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Inicializando aplicación")
  updateConnectionStatus(false, "Cargando...")

  // Cargar dispositivos inmediatamente
  await loadDevices()

  // Configurar polling para actualizaciones en tiempo real (cada 5 segundos)
  pollingInterval = setInterval(loadDevices, 5000)
})

/**
 * Carga todos los dispositivos desde el backend API
 */
async function loadDevices() {
  console.log("[v0] Cargando dispositivos desde API...")

  try {
    const response = await fetch("/api/devices")

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()
    allDevices = data.devices || []

    console.log("[v0] Dispositivos cargados:", allDevices.length)

    if (allDevices.length === 0) {
      console.warn("[v0] No se encontraron dispositivos. Mostrando ejemplos.")
      loadDemoDevices()
      return
    }

    renderDevices()
    updateConnectionStatus(true, "Smart Home Control")
  } catch (error) {
    console.error("[v0] Error al cargar dispositivos:", error.message)
    loadDemoDevices()
    updateConnectionStatus(false, "Modo Demo")
  }
}

/**
 * Carga dispositivos de demostración (si el backend falla)
 */
function loadDemoDevices() {
  console.log("[v0] Cargando dispositivos de demostración")

  allDevices = [
    {
      id: "1",
      name: "Luz Sala",
      type: "light",
      location: "Sala",
      status: { online: true, power: false, brightness: 100 },
    },
    {
      id: "2",
      name: "Luz Dormitorio",
      type: "light",
      location: "Dormitorio",
      status: { online: true, power: true, brightness: 50 },
    },
    {
      id: "3",
      name: "Puerta Principal",
      type: "lock",
      location: "Entrada",
      status: { online: true, locked: true },
    },
    {
      id: "4",
      name: "Puerta Garage",
      type: "lock",
      location: "Garage",
      status: { online: true, locked: false },
    },
    {
      id: "5",
      name: "Termostato Principal",
      type: "thermostat",
      location: "Sala",
      status: { online: true, temperature: 22, target: 22 },
    },
    {
      id: "6",
      name: "Sensor Entrada",
      type: "motion_sensor",
      location: "Entrada",
      status: { online: true, motion_detected: false },
    },
    {
      id: "7",
      name: "Cámara Entrada",
      type: "camera",
      location: "Entrada",
      status: { online: true, recording: true },
    },
  ]

  renderDevices()
}

/**
 * Actualiza el estado de conexión en la UI
 */
function updateConnectionStatus(connected, message) {
  const statusElement = document.getElementById("connection-status")
  const userElement = document.getElementById("user-info")

  if (connected) {
    statusElement.classList.remove("disconnected")
    statusElement.classList.add("connected")
    statusElement.textContent = "✓ Conectado"
  } else {
    statusElement.classList.remove("connected")
    statusElement.classList.add("disconnected")
    statusElement.textContent = "⚠️ " + message
  }

  userElement.textContent = message
}

/**
 * Renderiza todos los dispositivos en sus secciones
 */
function renderDevices() {
  Object.values(SECTION_MAPPING).forEach((gridId) => {
    document.getElementById(gridId).innerHTML = ""
  })

  // Agrupar y renderizar dispositivos por tipo
  Object.values(DEVICE_TYPES).forEach((type) => {
    const devicesOfType = allDevices.filter((d) => d.type === type)
    const gridId = SECTION_MAPPING[type]

    if (devicesOfType.length === 0) {
      document.getElementById(gridId).innerHTML =
        '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No hay dispositivos de este tipo</p>'
      return
    }

    devicesOfType.forEach((device) => {
      const card = createDeviceCard(device)
      document.getElementById(gridId).appendChild(card)
    })
  })
}

/**
 * Crea una tarjeta de dispositivo
 */
function createDeviceCard(device) {
  const card = document.createElement("div")
  card.className = "device-card"
  card.setAttribute("data-device-id", device.id)

  const status = device.status || {}
  const isOnline = status.online !== false

  let content = `
        <div class="device-header">
            <div>
                <div class="device-name">${device.name}</div>
                <div class="device-type">${device.type} • ${device.location || "N/A"}</div>
            </div>
            <div class="device-indicator ${isOnline ? "online" : "offline"}"></div>
        </div>
        <div class="device-body">
    `

  // Contenido específico por tipo de dispositivo
  switch (device.type) {
    case DEVICE_TYPES.LIGHT:
      content += renderLightControl(device, status)
      break
    case DEVICE_TYPES.LOCK:
      content += renderLockControl(device, status)
      break
    case DEVICE_TYPES.THERMOSTAT:
      content += renderThermostatControl(device, status)
      break
    case DEVICE_TYPES.MOTION_SENSOR:
      content += renderMotionSensorControl(device, status)
      break
    case DEVICE_TYPES.CAMERA:
      content += renderCameraControl(device, status)
      break
  }

  content += "</div>"
  card.innerHTML = content

  return card
}

/**
 * Renderiza controles para luz inteligente
 */
function renderLightControl(device, status) {
  const isPowered = status.power || false
  const brightness = status.brightness || 100

  return `
        <div class="device-control">
            <label class="control-label">Estado</label>
            <button class="btn btn-toggle ${isPowered ? "active" : "inactive"}" onclick="toggleLight('${device.id}', ${!isPowered})">
                ${isPowered ? "💡 Encendido" : "🌙 Apagado"}
            </button>
        </div>
        <div class="device-control">
            <label class="control-label">Brillo: ${brightness}%</label>
            <input type="range" min="0" max="100" value="${brightness}" class="slider" 
                onchange="updateLightBrightness('${device.id}', this.value)" />
        </div>
    `
}

/**
 * Renderiza controles para cerradura inteligente
 */
function renderLockControl(device, status) {
  const isLocked = status.locked || false

  return `
        <div class="device-control">
            <label class="control-label">Estado</label>
            <button class="btn btn-toggle ${isLocked ? "active" : "inactive"}" onclick="toggleLock('${device.id}', ${!isLocked})">
                ${isLocked ? "🔒 Bloqueada" : "🔓 Desbloqueada"}
            </button>
        </div>
    `
}

/**
 * Renderiza controles para termostato
 */
function renderThermostatControl(device, status) {
  const temperature = status.temperature || 20
  const target = status.target || 20

  return `
        <div class="device-control">
            <label class="control-label">Temperatura Actual: ${temperature}°C</label>
        </div>
        <div class="device-control">
            <label class="control-label">Temperatura Objetivo: ${target}°C</label>
            <div class="input-group">
                <button class="btn btn-secondary" onclick="adjustTemperature('${device.id}', ${target - 1})">−</button>
                <input type="text" class="input-small" value="${target}" readonly>
                <button class="btn btn-secondary" onclick="adjustTemperature('${device.id}', ${target + 1})">+</button>
            </div>
        </div>
    `
}

/**
 * Renderiza controles para sensor de movimiento
 */
function renderMotionSensorControl(device, status) {
  const motionDetected = status.motion_detected || false

  return `
        <div class="device-control">
            <label class="control-label">Estado</label>
            <div style="padding: 15px; background: ${motionDetected ? "var(--warning)" : "var(--surface-light)"}; border-radius: 8px; text-align: center; color: white; font-weight: 600; animation: ${motionDetected ? "pulse 0.5s infinite" : "none"}">
                ${motionDetected ? "🚨 Movimiento Detectado" : "✓ Sin Movimiento"}
            </div>
        </div>
    `
}

/**
 * Renderiza controles para cámara de seguridad
 */
function renderCameraControl(device, status) {
  const isRecording = status.recording || false
  const cameraUrl = device.camera_url || null
  const cameraType = device.camera_type || "demo"

  let cameraHtml = ""

  if (cameraUrl && cameraType !== "demo") {
    // Si es una cámara IP real, mostrar el stream
    cameraHtml = `
      <div class="device-control">
        <label class="control-label">Stream en Vivo</label>
        <div class="camera-preview">
          <img src="${cameraUrl}" alt="Stream de cámara" class="camera-stream" onerror="this.src='/camera-error.jpg'; this.style.width='100px';">
          <div class="camera-status">${isRecording ? "🔴 Grabando" : "⭕ Sin grabar"}</div>
        </div>
      </div>
    `
  } else {
    // Modo demo - mostrar placeholder con opción de conectar
    cameraHtml = `
      <div class="device-control">
        <label class="control-label">Sin Configurar</label>
        <div class="camera-preview">
          <div class="placeholder-camera">
            📹 Click en + Agregar Cámara
          </div>
        </div>
      </div>
    `
  }

  cameraHtml += `
    <div class="device-control">
      <label class="control-label">Grabación</label>
      <button class="btn btn-toggle ${isRecording ? "active" : "inactive"}" onclick="toggleCamera('${device.id}', ${!isRecording})">
        ${isRecording ? "🔴 Grabando" : "⭕ Parada"}
      </button>
    </div>
  `

  if (device.camera_url) {
    cameraHtml += `
      <div class="device-control">
        <button class="btn btn-secondary" style="width: 100%;" onclick="editCameraConfig('${device.id}')">
          ⚙️ Editar Configuración
        </button>
      </div>
    `
  }

  return cameraHtml
}

/**
 * Funciones de control de dispositivos
 */

async function toggleLight(deviceId, power) {
  console.log("[v0] Cambiando luz", deviceId, "a", power)
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, power }

  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await loadDevices()
    }
  } catch (error) {
    console.error("[v0] Error al actualizar luz:", error)
  }
}

async function updateLightBrightness(deviceId, brightness) {
  console.log("[v0] Actualizando brillo a", brightness)
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, brightness: Number.parseInt(brightness) }

  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await loadDevices()
    }
  } catch (error) {
    console.error("[v0] Error al actualizar brillo:", error)
  }
}

async function toggleLock(deviceId, locked) {
  console.log("[v0] Cambiando cerradura", deviceId, "a", locked)
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, locked }

  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await loadDevices()
    }
  } catch (error) {
    console.error("[v0] Error al actualizar cerradura:", error)
  }
}

async function adjustTemperature(deviceId, newTarget) {
  console.log("[v0] Ajustando temperatura a", newTarget)
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  // Limitar temperatura entre 15 y 30 grados
  const target = Math.max(15, Math.min(30, newTarget))
  const newStatus = { ...device.status, target }

  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await loadDevices()
    }
  } catch (error) {
    console.error("[v0] Error al actualizar temperatura:", error)
  }
}

async function toggleCamera(deviceId, recording) {
  console.log("[v0] Cambiando grabación de cámara a", recording)
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, recording }

  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await loadDevices()
    }
  } catch (error) {
    console.error("[v0] Error al actualizar cámara:", error)
  }
}

/**
 * Funciones para gestionar configuración de cámaras
 */

function openCameraSetupModal() {
  document.getElementById("camera-setup-modal").classList.remove("hidden")
  document.getElementById("camera-setup-form").reset()
}

function closeCameraSetupModal() {
  document.getElementById("camera-setup-modal").classList.add("hidden")
}

async function handleCameraSetup(event) {
  event.preventDefault()

  const name = document.getElementById("camera-name").value
  const location = document.getElementById("camera-location").value
  const cameraUrl = document.getElementById("camera-url").value
  const username = document.getElementById("camera-username").value
  const password = document.getElementById("camera-password").value
  const cameraType = document.getElementById("camera-type").value

  console.log("[v0] Guardando configuración de cámara...")

  try {
    const response = await fetch("/api/add-camera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location,
        camera_url: cameraUrl,
        camera_username: username,
        camera_password: password,
        camera_type: cameraType,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log("[v0] Cámara guardada exitosamente")
      closeCameraSetupModal()
      await loadDevices()
      alert("Cámara configurada correctamente")
    } else {
      console.error("[v0] Error al guardar cámara:", data.message)
      alert("Error: " + (data.message || "No se pudo guardar la cámara"))
    }
  } catch (error) {
    console.error("[v0] Error al conectar con el servidor:", error)
    alert("Error de conexión: " + error.message)
  }
}

function editCameraConfig(deviceId) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device || !device.camera_url) return

  document.getElementById("camera-name").value = device.name
  document.getElementById("camera-location").value = device.location || ""
  document.getElementById("camera-url").value = device.camera_url
  document.getElementById("camera-username").value = device.camera_username || ""
  document.getElementById("camera-password").value = device.camera_password || ""
  document.getElementById("camera-type").value = device.camera_type || "ip"

  openCameraSetupModal()
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCameraSetupModal()
  }
})
