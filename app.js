/**
 * APLICACIÓN DE CONTROL DE DISPOSITIVOS INTELIGENTES
 * Gestiona la interfaz de usuario y la lógica de interacción
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
let supabaseSubscription = null

// Declaración de la variable supabase
const supabase = {
  initialize: async (url, key) => {
    // Simulación de inicialización
    return true
  },
  getDevices: async () => {
    // Simulación de obtención de dispositivos
    return []
  },
  subscribeToChanges: (callback) => {
    // Simulación de suscripción a cambios
    return { unsubscribe: () => {} }
  },
  updateDeviceStatus: async (deviceId, newStatus) => {
    // Simulación de actualización de estado de dispositivo
  },
  logActivity: async (deviceId, activity, oldStatus, newStatus) => {
    // Simulación de registro de actividad
  },
}

/**
 * Inicialización de la aplicación
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[App] Inicializando aplicación")

  // Verificar si hay credenciales guardadas
  const savedUrl = localStorage.getItem("supabase_url")
  const savedKey = localStorage.getItem("supabase_key")

  if (savedUrl && savedKey) {
    await connectToSupabase(savedUrl, savedKey)
  } else {
    showConfigModal()
  }

  // Event listeners del formulario
  document.getElementById("config-form").addEventListener("submit", handleConfigSubmit)
})

/**
 * Mostrar modal de configuración
 */
function showConfigModal() {
  const modal = document.getElementById("config-modal")
  modal.classList.remove("hidden")
}

/**
 * Ocultar modal de configuración
 */
function hideConfigModal() {
  const modal = document.getElementById("config-modal")
  modal.classList.add("hidden")
}

/**
 * Maneja el envío del formulario de configuración
 */
async function handleConfigSubmit(e) {
  e.preventDefault()

  const url = document.getElementById("supabase-url").value
  const key = document.getElementById("supabase-key").value

  if (!url || !key) {
    alert("Por favor completa todos los campos")
    return
  }

  // Guardar en localStorage
  localStorage.setItem("supabase_url", url)
  localStorage.setItem("supabase_key", key)

  await connectToSupabase(url, key)
}

/**
 * Conecta a Supabase y carga los dispositivos
 */
async function connectToSupabase(url, key) {
  console.log("[App] Conectando a Supabase...")

  const connected = await supabase.initialize(url, key)

  if (!connected) {
    updateConnectionStatus(false)
    alert("Error al conectar con Supabase. Verifica tus credenciales.")
    localStorage.removeItem("supabase_url")
    localStorage.removeItem("supabase_key")
    showConfigModal()
    return
  }

  updateConnectionStatus(true)
  hideConfigModal()

  // Cargar dispositivos
  await loadDevices()

  // Suscribirse a cambios en tiempo real
  if (supabaseSubscription) {
    supabaseSubscription.unsubscribe()
  }

  supabaseSubscription = supabase.subscribeToChanges((payload) => {
    console.log("[App] Cambio detectado en tiempo real")
    loadDevices()
  })
}

/**
 * Actualiza el estado de conexión en la UI
 */
function updateConnectionStatus(connected) {
  const statusElement = document.getElementById("connection-status")
  const userElement = document.getElementById("user-info")

  if (connected) {
    statusElement.classList.remove("disconnected")
    statusElement.classList.add("connected")
    statusElement.textContent = "✓ Conectado"
    userElement.textContent = "Smart Home Control"
  } else {
    statusElement.classList.remove("connected")
    statusElement.classList.add("disconnected")
    statusElement.textContent = "✗ Desconectado"
    userElement.textContent = "Esperando conexión..."
  }
}

/**
 * Carga todos los dispositivos desde Supabase
 */
async function loadDevices() {
  console.log("[App] Cargando dispositivos...")

  allDevices = await supabase.getDevices()

  if (allDevices.length === 0) {
    console.warn("[App] No se encontraron dispositivos. Mostrando ejemplos.")
    loadDemoDevices()
    return
  }

  renderDevices()
}

/**
 * Carga dispositivos de demostración (si no hay datos en Supabase)
 */
function loadDemoDevices() {
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
 * Renderiza todos los dispositivos en sus secciones
 */
function renderDevices() {
  // Limpiar grillas
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

  return `
        <div class="device-control">
            <label class="control-label">Grabación</label>
            <button class="btn btn-toggle ${isRecording ? "active" : "inactive"}" onclick="toggleCamera('${device.id}', ${!isRecording})">
                ${isRecording ? "🔴 Grabando" : "⭕ Parada"}
            </button>
        </div>
    `
}

/**
 * FUNCIONES DE CONTROL DE DISPOSITIVOS
 */

async function toggleLight(deviceId, power) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, power }

  await supabase.updateDeviceStatus(deviceId, newStatus)
  await supabase.logActivity(deviceId, `Luz ${power ? "encendida" : "apagada"}`, device.status, newStatus)

  loadDevices()
}

async function updateLightBrightness(deviceId, brightness) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, brightness: Number.parseInt(brightness) }

  await supabase.updateDeviceStatus(deviceId, newStatus)
  await supabase.logActivity(deviceId, `Brillo ajustado a ${brightness}%`, device.status, newStatus)

  loadDevices()
}

async function toggleLock(deviceId, locked) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, locked }

  await supabase.updateDeviceStatus(deviceId, newStatus)
  await supabase.logActivity(deviceId, `Cerradura ${locked ? "bloqueada" : "desbloqueada"}`, device.status, newStatus)

  loadDevices()
}

async function adjustTemperature(deviceId, newTarget) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  // Limitar temperatura entre 15 y 30 grados
  const target = Math.max(15, Math.min(30, newTarget))
  const newStatus = { ...device.status, target }

  await supabase.updateDeviceStatus(deviceId, newStatus)
  await supabase.logActivity(deviceId, `Temperatura objetivo: ${target}°C`, device.status, newStatus)

  loadDevices()
}

async function toggleCamera(deviceId, recording) {
  const device = allDevices.find((d) => d.id === deviceId)
  if (!device) return

  const newStatus = { ...device.status, recording }

  await supabase.updateDeviceStatus(deviceId, newStatus)
  await supabase.logActivity(deviceId, `Grabación ${recording ? "iniciada" : "detenida"}`, device.status, newStatus)

  loadDevices()
}
