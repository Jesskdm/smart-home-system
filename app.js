const SUPABASE_URL = "https://vufsssdphryumshvvlcv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZnNzc2RwaHJ5dW1zaHZ2bGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTk4MzksImV4cCI6MjA4MDEzNTgzOX0.6SC5FULLxaOX_hei23VeVMp6zjJYU8I2LUakJ71H9mM";

const TABLE_MAP = {
  lights: "lights",
  locks: "locks",
  thermostats: "thermostats",
  sensors: "motion_sensors",
  cameras: "cameras",
};

const SECTION_TITLES = {
  lights: "Luces",
  locks: "Cerraduras",
  thermostats: "Termostato",
  sensors: "Sensores de Movimiento",
  cameras: "Camaras de Seguridad",
};

let data = { lights: [], locks: [], thermostats: [], sensors: [], cameras: [] };
let currentSection = "lights";
let currentCameraId = null;
let cameraZoomLevel = 1;
let cameraMicActive = false;
let cameraAudioActive = false;
let supabaseReady = false;

// ===========================
// STREAMING CONFIGURATION
// ===========================
const webrtcConnections = new Map();
const localStreams = new Map();
const streamingCanvases = new Map();

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// Servidor de Streaming RTSP URL (configurable)
let SIGNALING_SERVER_URL = "ws://localhost:8080";

// WebSocket connection para streaming
let streamingSocket = null;
let streamingConnected = false;

// Cache de frames para cada cámara
const frameCache = new Map();

// ===========================
// SUPABASE HELPERS
// ===========================
function sbHeaders() {
  return {
    apikey: SUPABASE_ANON,
    Authorization: "Bearer " + SUPABASE_ANON,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function sbSelect(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function sbInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function sbUpdate(table, id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: sbHeaders(),
    body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function sbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(res.statusText);
}

// ===========================
// INIT
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  navigateTo("lights");
  await loadAllData();
  setInterval(loadAllData, 5000);
});

// ===========================
// DATA LOADING
// ===========================
async function loadAllData() {
  try {
    const [lights, locks, thermostats, sensors, cameras] = await Promise.all([
      sbSelect("lights"),
      sbSelect("locks"),
      sbSelect("thermostats"),
      sbSelect("motion_sensors"),
      sbSelect("cameras"),
    ]);
    data = { lights, locks, thermostats, sensors, cameras };
    supabaseReady = true;
    updateBadge(true);
  } catch (err) {
    if (!supabaseReady) {
      data = getDefaults();
    }
    updateBadge(false);
  }
  renderCurrentSection();
  updateSidebarCounts();
}

function getDefaults() {
  return {
    lights: [
      { id: "d1", name: "Luz Sala", location: "Sala", is_online: true, is_on: true, brightness: 80, color: "#FFFFFF" },
      { id: "d2", name: "Luz Cocina", location: "Cocina", is_online: true, is_on: false, brightness: 100, color: "#FFF4E0" },
    ],
    locks: [
      { id: "d3", name: "Puerta Principal", location: "Entrada", is_online: true, is_locked: true, auto_lock: true },
      { id: "d4", name: "Puerta Garage", location: "Garage", is_online: true, is_locked: false, auto_lock: false },
    ],
    thermostats: [
      { id: "d5", name: "Termostato Central", location: "Sala", is_online: true, is_on: true, current_temp: 21.5, target_temp: 22, mode: "auto", humidity: 48 },
    ],
    sensors: [
      { id: "d6", name: "Sensor Entrada", location: "Entrada", is_online: true, is_active: true, motion_detected: false, sensitivity: "high" },
      { id: "d7", name: "Sensor Patio", location: "Patio", is_online: true, is_active: true, motion_detected: false, sensitivity: "medium" },
    ],
    cameras: [
      { id: "d8", name: "Camara Entrada", location: "Entrada", is_online: true, is_recording: false, camera_brand: "H-VIEW", resolution: "1080p", has_audio: true, has_mic: true },
      { id: "d9", name: "Camara Garage", location: "Garage", is_online: true, is_recording: false, camera_brand: "H-VIEW", resolution: "1080p", has_audio: true, has_mic: false },
    ],
  };
}

function updateBadge(connected) {
  const b1 = document.getElementById("connection-badge");
  const b2 = document.getElementById("topbar-badge");
  [b1, b2].forEach((b) => {
    if (!b) return;
    b.className = connected ? "badge badge-online" : "badge badge-offline";
    b.textContent = connected ? "Conectado" : "Local";
  });
}

function updateSidebarCounts() {
  Object.keys(data).forEach((key) => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = data[key].length;
  });
}

// ===========================
// NAVIGATION
// ===========================
function navigateTo(section) {
  currentSection = section;

  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });

  document.querySelectorAll(".content-section").forEach((el) => {
    el.classList.toggle("active", el.id === "section-" + section);
  });

  const title = document.getElementById("section-title");
  if (title) title.textContent = SECTION_TITLES[section] || section;

  document.getElementById("sidebar").classList.remove("open");
  renderCurrentSection();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ===========================
// RENDERING
// ===========================
function renderCurrentSection() {
  const section = currentSection;
  const items = data[section] || [];
  const gridId = section + "-grid";
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">--</div><div class="empty-text">No hay dispositivos</div><div class="empty-sub">Agrega uno con el boton de arriba</div></div>';
    return;
  }

  items.forEach((item) => {
    if (section === "cameras") {
      grid.appendChild(createCameraCard(item));
    } else {
      grid.appendChild(createDeviceCard(section, item));
    }
  });
}

// ===========================
// DEVICE CARDS
// ===========================
function createDeviceCard(section, device) {
  const card = document.createElement("div");
  card.className = "device-card";
  const online = device.is_online !== false;
  let controls = "";

  switch (section) {
    case "lights":
      controls = `
        <div class="device-control">
          <button class="btn btn-toggle ${device.is_on ? "on" : "off"}" onclick="toggleLight('${device.id}', ${!device.is_on})">
            ${device.is_on ? "Encendido" : "Apagado"}
          </button>
        </div>
        <div class="device-control">
          <span class="control-label">Brillo: ${device.brightness}%</span>
          <input type="range" min="0" max="100" value="${device.brightness}" class="slider" onchange="updateBrightness('${device.id}', this.value)">
        </div>
        <div class="device-control">
          <span class="control-label">Color</span>
          <input type="color" value="${device.color || '#FFFFFF'}" class="color-picker" onchange="updateLightColor('${device.id}', this.value)">
        </div>`;
      break;

    case "locks":
      controls = `
        <div class="device-control">
          <button class="btn btn-toggle ${device.is_locked ? "on" : "off"}" onclick="toggleLock('${device.id}', ${!device.is_locked})">
            ${device.is_locked ? "Bloqueada" : "Desbloqueada"}
          </button>
        </div>
        <div class="device-control">
          <label class="switch-label">
            <span>Auto-bloqueo</span>
            <input type="checkbox" ${device.auto_lock ? "checked" : ""} onchange="toggleAutoLock('${device.id}', this.checked)">
          </label>
        </div>`;
      break;

    case "thermostats":
      controls = `
        <div class="device-control">
          <button class="btn btn-toggle ${device.is_on ? "on" : "off"}" onclick="toggleThermostat('${device.id}', ${!device.is_on})">
            ${device.is_on ? "Encendido" : "Apagado"}
          </button>
        </div>
        <div class="device-control">
          <span class="control-label">Actual: ${device.current_temp}C</span>
        </div>
        <div class="device-control">
          <span class="control-label">Objetivo: ${device.target_temp}C</span>
          <div class="temp-controls">
            <button class="btn btn-sm" onclick="adjustTemp('${device.id}', -0.5)">-</button>
            <span class="temp-value">${device.target_temp}C</span>
            <button class="btn btn-sm" onclick="adjustTemp('${device.id}', 0.5)">+</button>
          </div>
        </div>
        <div class="device-control">
          <span class="control-label">Modo</span>
          <select class="mode-select" onchange="changeMode('${device.id}', this.value)">
            <option value="auto" ${device.mode === "auto" ? "selected" : ""}>Auto</option>
            <option value="cool" ${device.mode === "cool" ? "selected" : ""}>Enfriar</option>
            <option value="heat" ${device.mode === "heat" ? "selected" : ""}>Calentar</option>
            <option value="fan" ${device.mode === "fan" ? "selected" : ""}>Ventilador</option>
          </select>
        </div>
        <div class="device-control">
          <span class="control-label">Humedad: ${device.humidity}%</span>
        </div>`;
      break;

    case "sensors":
      controls = `
        <div class="device-control">
          <div class="motion-status ${device.motion_detected ? "detected" : "idle"}">
            ${device.motion_detected ? "Movimiento Detectado" : "Sin Movimiento"}
          </div>
        </div>
        <div class="device-control">
          <label class="switch-label">
            <span>Activo</span>
            <input type="checkbox" ${device.is_active ? "checked" : ""} onchange="toggleSensorActive('${device.id}', this.checked)">
          </label>
        </div>
        <div class="device-control">
          <span class="control-label">Sensibilidad</span>
          <select class="mode-select" onchange="changeSensitivity('${device.id}', this.value)">
            <option value="low" ${device.sensitivity === "low" ? "selected" : ""}>Baja</option>
            <option value="medium" ${device.sensitivity === "medium" ? "selected" : ""}>Media</option>
            <option value="high" ${device.sensitivity === "high" ? "selected" : ""}>Alta</option>
          </select>
        </div>`;
      break;
  }

  card.innerHTML = `
    <div class="device-header">
      <div>
        <div class="device-name">${device.name}</div>
        <div class="device-location">${device.location || "-"}</div>
      </div>
      <div class="device-header-right">
        <div class="device-indicator ${online ? "online" : "offline"}"></div>
        <button class="btn-icon btn-delete" onclick="deleteDevice('${currentSection}', '${device.id}')" title="Eliminar">&#x2715;</button>
      </div>
    </div>
    <div class="device-body">${controls}</div>`;

  return card;
}

// ===========================
// CAMERA CARDS
// ===========================
function createCameraCard(cam) {
  const card = document.createElement("div");
  card.className = "camera-card";
  card.setAttribute("data-camera-id", cam.id);
  card.onclick = () => openCameraView(cam.id);

  const isStreaming = cam.connection_type === "webrtc" || cam.stream_url;
  const isLocalCam = cam.use_local_camera;

  card.innerHTML = `
    <div class="camera-feed-preview">
      ${isLocalCam ? `
        <video class="camera-video-preview" data-camera-id="${cam.id}" autoplay muted playsinline></video>
        <div class="camera-no-signal" style="display:none">Sin senal</div>
      ` : isStreaming ? `
        <img class="camera-stream-preview" data-camera-id="${cam.id}" alt="${cam.name}">
        <div class="camera-no-signal" style="display:none">Conectando...</div>
      ` : cam.snapshot_url ? `
        <img src="${cam.snapshot_url}" alt="${cam.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="camera-no-signal" style="display:none">Sin senal</div>
      ` : `
        <div class="camera-no-signal">
          <span class="no-signal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/>
              <rect x="2" y="7" width="14" height="10" rx="2"/>
              <line x1="2" y1="2" x2="22" y2="22" stroke-linecap="round"/>
            </svg>
          </span>
          <span>Sin configurar</span>
        </div>
      `}
      <div class="camera-card-overlay">
        <div>
          <div class="camera-card-name">${cam.name}</div>
          <div class="camera-card-location">${cam.location || ""} | ${cam.camera_brand || "---"} | ${cam.resolution || "---"}</div>
        </div>
        <div class="camera-status-badges">
          ${isStreaming ? '<span class="camera-badge webrtc">RTSP</span>' : ''}
          ${isLocalCam ? '<span class="camera-badge local">Local</span>' : ''}
          <div class="camera-rec-dot ${cam.is_recording ? "" : "off"}"></div>
        </div>
      </div>
    </div>`;

  // Iniciar conexion segun tipo
  setTimeout(() => {
    if (isLocalCam) {
      const videoEl = card.querySelector("video");
      if (videoEl) connectCamera(cam.id, videoEl);
    } else if (isStreaming) {
      const imgEl = card.querySelector("img.camera-stream-preview");
      if (imgEl) connectCamera(cam.id, imgEl);
    }
  }, 100);

  return card;
}

function setCameraGrid(cols) {
  const grid = document.getElementById("cameras-grid");
  grid.className = "cameras-grid grid-" + cols;
  document.querySelectorAll(".grid-btn").forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.grid) === cols);
  });
}

// ===========================
// CAMERA FULL VIEW
// ===========================
function openCameraView(camId) {
  const cam = data.cameras.find((c) => c.id === camId);
  if (!cam) return;

  currentCameraId = camId;
  cameraZoomLevel = 1;
  cameraMicActive = false;
  cameraAudioActive = false;

  document.getElementById("camera-view-title").textContent = cam.name + " - " + (cam.location || "");

  const feed = document.getElementById("camera-feed-full");
  const isWebRTC = cam.connection_type === "webrtc" || cam.use_local_camera;

  if (isWebRTC) {
    feed.innerHTML = `
      <video id="camera-full-video" data-camera-id="${cam.id}" autoplay playsinline style="transform:scale(1)"></video>
      <div class="camera-placeholder-full" style="display:none">Conectando...</div>
    `;
    
    const videoEl = document.getElementById("camera-full-video");
    
    // Verificar si ya hay un stream activo para esta camara
    const existingStream = localStreams.get(camId);
    if (existingStream) {
      videoEl.srcObject = existingStream;
      videoEl.play().catch(e => console.log("[WebRTC] Autoplay bloqueado:", e));
    } else {
      connectCamera(camId, videoEl);
    }
  } else if (cam.snapshot_url) {
    feed.innerHTML = `<img id="camera-full-img" src="${cam.snapshot_url}" alt="${cam.name}" style="transform:scale(1)" onerror="this.outerHTML='<div class=\\'camera-placeholder-full\\'>Error de conexion</div>'">`;
  } else {
    feed.innerHTML = `
      <div class="camera-placeholder-full">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/>
          <rect x="2" y="7" width="14" height="10" rx="2"/>
        </svg>
        <span>Camara sin configurar</span>
        <span class="placeholder-hint">Haz click en Ajustes para conectarla</span>
      </div>
    `;
  }

  const btnMic = document.getElementById("btn-mic");
  const btnAudio = document.getElementById("btn-audio");
  const btnRec = document.getElementById("btn-record");

  btnMic.classList.remove("active");
  btnMic.disabled = !cam.has_mic;
  btnMic.title = cam.has_mic ? "Microfono" : "Sin microfono";

  btnAudio.classList.remove("active");
  btnAudio.disabled = !cam.has_audio;
  btnAudio.title = cam.has_audio ? "Audio" : "Sin audio";

  btnRec.classList.toggle("active", cam.is_recording);

  const info = document.getElementById("camera-info-bar");
  if (info) {
    const connectionType = isWebRTC ? (cam.use_local_camera ? "Local" : "WebRTC") : "HTTP";
    info.innerHTML = `
      <span>${cam.camera_brand || "---"}</span>
      <span>${cam.resolution || "---"}</span>
      <span class="connection-type ${connectionType.toLowerCase()}">${connectionType}</span>
      ${cam.has_night_vision ? '<span>Vision nocturna</span>' : ''}
    `;
  }

  document.getElementById("camera-view-modal").classList.remove("hidden");
}

function closeCameraViewModal() {
  // Pausar video si existe
  const video = document.getElementById("camera-full-video");
  if (video) {
    video.pause();
    // No detener el stream, solo pausar para permitir reconexion rapida
  }
  
  document.getElementById("camera-view-modal").classList.add("hidden");
  currentCameraId = null;
}

function toggleCameraMic() {
  cameraMicActive = !cameraMicActive;
  document.getElementById("btn-mic").classList.toggle("active", cameraMicActive);
}

function toggleCameraAudio() {
  cameraAudioActive = !cameraAudioActive;
  document.getElementById("btn-audio").classList.toggle("active", cameraAudioActive);
}

function zoomCamera(direction) {
  cameraZoomLevel = Math.max(1, Math.min(4, cameraZoomLevel + direction * 0.5));
  
  // Aplicar zoom a imagen o video
  const img = document.getElementById("camera-full-img");
  const video = document.getElementById("camera-full-video");
  
  if (img) img.style.transform = "scale(" + cameraZoomLevel + ")";
  if (video) video.style.transform = "scale(" + cameraZoomLevel + ")";
  
  const label = document.getElementById("zoom-label");
  if (label) label.textContent = cameraZoomLevel.toFixed(1) + "x";
}

async function toggleCameraRecording() {
  if (!currentCameraId) return;
  const cam = data.cameras.find((c) => c.id === currentCameraId);
  if (!cam) return;
  const newVal = !cam.is_recording;

  try {
    await sbUpdate("cameras", currentCameraId, { is_recording: newVal });
  } catch {
    cam.is_recording = newVal;
  }

  document.getElementById("btn-record").classList.toggle("active", newVal);
  await loadAllData();
}

// ===========================
// DEVICE ACTIONS
// ===========================
async function toggleLight(id, val) {
  try { await sbUpdate("lights", id, { is_on: val }); } catch { const d = data.lights.find((x) => x.id === id); if (d) d.is_on = val; }
  await loadAllData();
}

async function updateBrightness(id, val) {
  try { await sbUpdate("lights", id, { brightness: parseInt(val) }); } catch { const d = data.lights.find((x) => x.id === id); if (d) d.brightness = parseInt(val); }
  await loadAllData();
}

async function updateLightColor(id, val) {
  try { await sbUpdate("lights", id, { color: val }); } catch { const d = data.lights.find((x) => x.id === id); if (d) d.color = val; }
  await loadAllData();
}

async function toggleLock(id, val) {
  try { await sbUpdate("locks", id, { is_locked: val }); } catch { const d = data.locks.find((x) => x.id === id); if (d) d.is_locked = val; }
  await loadAllData();
}

async function toggleAutoLock(id, val) {
  try { await sbUpdate("locks", id, { auto_lock: val }); } catch { const d = data.locks.find((x) => x.id === id); if (d) d.auto_lock = val; }
  await loadAllData();
}

async function toggleThermostat(id, val) {
  try { await sbUpdate("thermostats", id, { is_on: val }); } catch { const d = data.thermostats.find((x) => x.id === id); if (d) d.is_on = val; }
  await loadAllData();
}

async function adjustTemp(id, delta) {
  const d = data.thermostats.find((x) => x.id === id);
  if (!d) return;
  const newVal = Math.max(10, Math.min(35, (d.target_temp || 20) + delta));
  try { await sbUpdate("thermostats", id, { target_temp: newVal }); } catch { d.target_temp = newVal; }
  await loadAllData();
}

async function changeMode(id, val) {
  try { await sbUpdate("thermostats", id, { mode: val }); } catch { const d = data.thermostats.find((x) => x.id === id); if (d) d.mode = val; }
  await loadAllData();
}

async function toggleSensorActive(id, val) {
  try { await sbUpdate("motion_sensors", id, { is_active: val }); } catch { const d = data.sensors.find((x) => x.id === id); if (d) d.is_active = val; }
  await loadAllData();
}

async function changeSensitivity(id, val) {
  try { await sbUpdate("motion_sensors", id, { sensitivity: val }); } catch { const d = data.sensors.find((x) => x.id === id); if (d) d.sensitivity = val; }
  await loadAllData();
}

async function deleteDevice(section, id) {
  if (!confirm("Eliminar este dispositivo?")) return;
  const table = TABLE_MAP[section];
  try { await sbDelete(table, id); } catch { data[section] = data[section].filter((x) => x.id !== id); }
  await loadAllData();
}

// ===========================
// ADD DEVICE MODAL
// ===========================
function openAddDeviceModal(type) {
  const titles = { lights: "Agregar Luz", locks: "Agregar Cerradura", thermostats: "Agregar Termostato", sensors: "Agregar Sensor" };
  document.getElementById("add-device-title").textContent = titles[type] || "Agregar Dispositivo";
  document.getElementById("device-section-input").value = type;
  document.getElementById("add-device-form").reset();
  document.getElementById("add-device-modal").classList.remove("hidden");
}

function closeAddDeviceModal() {
  document.getElementById("add-device-modal").classList.add("hidden");
}

async function handleAddDevice(event) {
  event.preventDefault();
  const section = document.getElementById("device-section-input").value;
  const name = document.getElementById("device-name").value.trim();
  const location = document.getElementById("device-location").value.trim();
  if (!name) return;

  const table = TABLE_MAP[section];
  const defaults = {
    lights: { name, location, is_on: false, brightness: 100, color: "#FFFFFF" },
    locks: { name, location, is_locked: true, auto_lock: false },
    thermostats: { name, location, is_on: false, current_temp: 20, target_temp: 22, mode: "auto", humidity: 45 },
    sensors: { name, location, is_active: true, motion_detected: false, sensitivity: "medium" },
  };

  const row = defaults[section];

  try {
    await sbInsert(table, row);
  } catch {
    row.id = "local-" + Date.now();
    row.is_online = true;
    data[section].push(row);
  }

  closeAddDeviceModal();
  await loadAllData();
}

// ===========================
// ADD CAMERA MODAL
// ===========================
function openCameraSetupModal() {
  document.getElementById("camera-setup-form").reset();
  document.getElementById("camera-setup-modal").classList.remove("hidden");
}

function closeCameraSetupModal() {
  document.getElementById("camera-setup-modal").classList.add("hidden");
}

async function handleCameraSetup(event) {
  event.preventDefault();

  // Obtener tipo de conexion seleccionado
  const connectionType = document.querySelector('input[name="connection-type"]:checked')?.value || "webrtc";

  const row = {
    name: document.getElementById("camera-name").value.trim(),
    location: document.getElementById("camera-location").value.trim(),
    stream_url: document.getElementById("camera-stream-url").value.trim() || null,
    snapshot_url: document.getElementById("camera-snapshot-url").value.trim() || null,
    camera_username: document.getElementById("camera-username").value.trim() || null,
    camera_password: document.getElementById("camera-password").value.trim() || null,
    camera_brand: document.getElementById("camera-brand").value.trim() || "H-VIEW",
    resolution: document.getElementById("camera-resolution").value,
    has_audio: document.getElementById("camera-has-audio").checked,
    has_mic: document.getElementById("camera-has-mic").checked,
    has_night_vision: document.getElementById("camera-has-nightvision").checked,
    is_recording: false,
    connection_type: connectionType,
    use_local_camera: connectionType === "local",
  };

  if (!row.name) return;

  try {
    await sbInsert("cameras", row);
  } catch {
    row.id = "local-" + Date.now();
    row.is_online = true;
    data.cameras.push(row);
  }

  closeCameraSetupModal();
  await loadAllData();
}

function editCameraConfig(camId) {
  closeCameraViewModal();
  const cam = data.cameras.find((c) => c.id === camId);
  if (!cam) return;

  document.getElementById("camera-name").value = cam.name || "";
  document.getElementById("camera-location").value = cam.location || "";
  document.getElementById("camera-stream-url").value = cam.stream_url || "";
  document.getElementById("camera-snapshot-url").value = cam.snapshot_url || "";
  document.getElementById("camera-username").value = cam.camera_username || "";
  document.getElementById("camera-password").value = cam.camera_password || "";
  document.getElementById("camera-brand").value = cam.camera_brand || "H-VIEW";
  document.getElementById("camera-resolution").value = cam.resolution || "1080p";
  document.getElementById("camera-has-audio").checked = !!cam.has_audio;
  document.getElementById("camera-has-mic").checked = !!cam.has_mic;
  document.getElementById("camera-has-nightvision").checked = !!cam.has_night_vision;

  document.getElementById("camera-setup-modal").classList.remove("hidden");
}

// ===========================
// KEYBOARD
// ===========================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCameraViewModal();
    closeCameraSetupModal();
    closeAddDeviceModal();
  }
});

// ===========================
// STREAMING FUNCTIONS (RTSP via WebSocket MJPEG)
// ===========================

/**
 * Inicializa la conexion WebSocket para streaming RTSP
 */
function initSignalingConnection() {
  if (streamingSocket && streamingSocket.readyState === WebSocket.OPEN) {
    return;
  }

  console.log("[Streaming] Conectando a:", SIGNALING_SERVER_URL);
  streamingSocket = new WebSocket(SIGNALING_SERVER_URL);

  streamingSocket.onopen = () => {
    console.log("[Streaming] Conectado al servidor RTSP");
    streamingConnected = true;
    updateWebRTCStatus(true);
    
    // Re-suscribirse a camaras activas
    streamingCanvases.forEach((canvas, cameraId) => {
      subscribeToCamera(cameraId);
    });
  };

  streamingSocket.onclose = () => {
    console.log("[Streaming] Desconectado del servidor");
    streamingConnected = false;
    updateWebRTCStatus(false);
    // Reconectar despues de 5 segundos
    setTimeout(initSignalingConnection, 5000);
  };

  streamingSocket.onerror = (error) => {
    console.error("[Streaming] Error de conexion:", error);
    streamingConnected = false;
    updateWebRTCStatus(false);
  };

  streamingSocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleStreamingMessage(message);
    } catch (error) {
      console.error("[Streaming] Error parseando mensaje:", error);
    }
  };
}

/**
 * Maneja mensajes del servidor de streaming
 */
function handleStreamingMessage(message) {
  const { type, cameraId, data: msgData } = message;
  console.log("[v0] Mensaje recibido:", type, "para camara:", cameraId);

  switch (type) {
    case "frame":
      // Recibir frame MJPEG y renderizar
      renderFrame(cameraId, msgData);
      break;
    case "cameras-list":
      console.log("[v0] Camaras disponibles en servidor:", message.cameras);
      // Guardar lista de camaras del servidor para mapeo
      window.serverCameras = message.cameras;
      break;
    case "subscribed":
      console.log("[v0] Suscrito exitosamente a camara:", cameraId);
      updateCameraConnectionStatus(cameraId, "connected");
      break;
    case "error":
      console.error("[v0] Error del servidor:", message.message, "camara:", cameraId);
      showCameraError(cameraId, message.message);
      break;
    case "stream-ended":
      console.log("[v0] Stream terminado:", cameraId);
      updateCameraConnectionStatus(cameraId, "disconnected");
      break;
  }
}

/**
 * Renderiza un frame JPEG en el canvas/img de la camara
 */
let frameCount = 0;
function renderFrame(cameraId, base64Data) {
  frameCount++;
  if (frameCount % 30 === 0) {
    console.log("[v0] Frames recibidos:", frameCount, "para:", cameraId);
  }
  
  // Actualizar cache
  frameCache.set(cameraId, base64Data);
  
  // Buscar elementos para renderizar
  const imgElements = document.querySelectorAll(`img[data-camera-stream="${cameraId}"]`);
  const canvasElements = document.querySelectorAll(`canvas[data-camera-stream="${cameraId}"]`);
  
  if (frameCount === 1) {
    console.log("[v0] Elementos img encontrados:", imgElements.length);
    console.log("[v0] Elementos canvas encontrados:", canvasElements.length);
    console.log("[v0] Buscando selector:", `[data-camera-stream="${cameraId}"]`);
  }
  
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;
  
  // Renderizar en imagenes
  imgElements.forEach(img => {
    img.src = dataUrl;
  });
  
  // Renderizar en canvas
  canvasElements.forEach(canvas => {
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  });
}

/**
 * Suscribirse a una camara RTSP
 */
function subscribeToCamera(cameraId) {
  console.log("[v0] subscribeToCamera llamado con:", cameraId);
  console.log("[v0] WebSocket estado:", streamingSocket?.readyState, "OPEN=", WebSocket.OPEN);
  
  // Buscar datos de la cámara
  const cam = data.cameras.find(c => c.id === cameraId || c.id === parseInt(cameraId));
  console.log("[v0] Datos de camara encontrados:", cam);
  
  if (streamingSocket?.readyState === WebSocket.OPEN) {
    const msg = {
      type: "subscribe",
      cameraId: String(cameraId),
      // Enviar URL RTSP para registro dinámico
      rtspUrl: cam?.stream_url || null,
      options: {
        name: cam?.name || "Camera",
        width: cam?.resolution === "4K" ? 3840 : cam?.resolution === "2K" ? 2560 : cam?.resolution === "1080p" ? 1920 : 1280,
        height: cam?.resolution === "4K" ? 2160 : cam?.resolution === "2K" ? 1440 : cam?.resolution === "1080p" ? 1080 : 720,
        fps: 15
      }
    };
    console.log("[v0] Enviando mensaje:", JSON.stringify(msg));
    streamingSocket.send(JSON.stringify(msg));
  } else {
    console.log("[v0] WebSocket no conectado, no se puede suscribir");
  }
}

/**
 * Desuscribirse de una camara
 */
function unsubscribeFromCamera(cameraId) {
  if (streamingSocket?.readyState === WebSocket.OPEN) {
    streamingSocket.send(JSON.stringify({
      type: "unsubscribe",
      cameraId: cameraId
    }));
  }
  streamingCanvases.delete(cameraId);
}

/**
 * Inicia streaming RTSP para una camara
 */
function startRTSPStreaming(cameraId, targetElement) {
  const camIdStr = String(cameraId);
  console.log("[v0] startRTSPStreaming llamado");
  console.log("[v0] cameraId:", camIdStr);
  console.log("[v0] targetElement:", targetElement?.tagName, targetElement?.className);
  
  // Guardar referencia al elemento
  streamingCanvases.set(camIdStr, targetElement);
  
  // Marcar elemento para recibir frames
  targetElement.setAttribute("data-camera-stream", camIdStr);
  console.log("[v0] Atributo data-camera-stream establecido:", targetElement.getAttribute("data-camera-stream"));
  
  // Suscribirse si ya estamos conectados
  if (streamingConnected) {
    console.log("[v0] Ya conectado, suscribiendo...");
    subscribeToCamera(camIdStr);
  } else {
    console.log("[v0] No conectado, iniciando conexion...");
    initSignalingConnection();
    // Esperar a que conecte y luego suscribir
    const checkConnection = setInterval(() => {
      if (streamingConnected) {
        clearInterval(checkConnection);
        subscribeToCamera(camIdStr);
      }
    }, 500);
    // Timeout después de 10 segundos
    setTimeout(() => clearInterval(checkConnection), 10000);
  }
}

/**
 * Detiene streaming de una camara
 */
function stopRTSPStreaming(cameraId) {
  unsubscribeFromCamera(cameraId);
  
  // Limpiar atributos de elementos
  const elements = document.querySelectorAll(`[data-camera-stream="${cameraId}"]`);
  elements.forEach(el => el.removeAttribute("data-camera-stream"));
}

/**
 * Actualiza el estado de conexion en la UI
 */
function updateWebRTCStatus(connected) {
  const statusEl = document.getElementById("webrtc-status");
  if (statusEl) {
    statusEl.className = connected ? "webrtc-status connected" : "webrtc-status disconnected";
    statusEl.textContent = connected ? "Servidor Activo" : "Servidor Desconectado";
  }
}

/**
 * Actualiza el estado de conexion de una camara
 */
function updateCameraConnectionStatus(cameraId, state) {
  const card = document.querySelector(`[data-camera-id="${cameraId}"]`);
  if (card) {
    card.setAttribute("data-connection-state", state);
  }
}

/**
 * Intenta conectar usando getUserMedia (camara local/webcam)
 */
async function tryLocalCameraFallback(cameraId, videoElement) {
  const cam = data.cameras.find((c) => c.id === cameraId);
  if (!cam) return false;

  // Si es una camara local (webcam del dispositivo)
  if (cam.camera_type === "local" || cam.use_local_camera) {
    try {
      const constraints = {
        video: {
          width: { ideal: cam.resolution === "4K" ? 3840 : cam.resolution === "2K" ? 2560 : cam.resolution === "1080p" ? 1920 : 1280 },
          height: { ideal: cam.resolution === "4K" ? 2160 : cam.resolution === "2K" ? 1440 : cam.resolution === "1080p" ? 1080 : 720 },
        },
        audio: cam.has_audio || false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreams.set(cameraId, stream);
      videoElement.srcObject = stream;
      await videoElement.play();
      console.log("[Streaming] Camara local conectada:", cameraId);
      return true;
    } catch (error) {
      console.error("[Streaming] Error accediendo camara local:", error);
      return false;
    }
  }

  return false;
}

/**
 * Conecta una camara usando el mejor metodo disponible
 */
async function connectCamera(cameraId, targetElement) {
  const cam = data.cameras.find((c) => c.id === cameraId);
  if (!cam) return;

  // Mostrar estado de carga
  showCameraLoading(cameraId, true);

  // 1. Intentar con camara local primero (webcam)
  if (cam.use_local_camera && targetElement.tagName === "VIDEO") {
    if (await tryLocalCameraFallback(cameraId, targetElement)) {
      showCameraLoading(cameraId, false);
      return;
    }
  }

  // 2. Intentar streaming RTSP via WebSocket
  if (cam.connection_type === "webrtc" || cam.stream_url) {
    startRTSPStreaming(cameraId, targetElement);
    showCameraLoading(cameraId, false);
    return;
  }

  // 3. Fallback: Imagen estatica
  if (cam.snapshot_url) {
    showCameraSnapshot(cameraId, cam.snapshot_url);
    showCameraLoading(cameraId, false);
    return;
  }

  // 4. Mostrar mensaje de configuracion
  showCameraError(cameraId, "Configura el servidor de streaming");
  showCameraLoading(cameraId, false);
}

/**
 * Muestra estado de carga para una camara
 */
function showCameraLoading(cameraId, loading) {
  const container = document.querySelector(`[data-camera-id="${cameraId}"]`);
  if (!container) return;

  let loader = container.querySelector(".camera-loader");
  if (loading && !loader) {
    loader = document.createElement("div");
    loader.className = "camera-loader";
    loader.innerHTML = '<div class="loader-spinner"></div><span>Conectando...</span>';
    container.appendChild(loader);
  } else if (!loading && loader) {
    loader.remove();
  }
}

/**
 * Muestra un snapshot estatico de la camara
 */
function showCameraSnapshot(cameraId, snapshotUrl) {
  const container = document.querySelector(`[data-camera-id="${cameraId}"]`);
  if (!container) return;

  const video = container.querySelector("video");
  if (video) {
    video.style.display = "none";
  }

  let img = container.querySelector("img.camera-snapshot");
  if (!img) {
    img = document.createElement("img");
    img.className = "camera-snapshot";
    container.appendChild(img);
  }
  img.src = snapshotUrl;
  img.alt = "Camera snapshot";
}

/**
 * Muestra error de conexion
 */
function showCameraError(cameraId, message) {
  const container = document.querySelector(`[data-camera-id="${cameraId}"]`);
  if (!container) return;

  let errorEl = container.querySelector(".camera-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "camera-error";
    container.appendChild(errorEl);
  }
  errorEl.innerHTML = `<span class="error-icon">!</span><span>${message}</span>`;
}

/**
 * Configura el servidor de senalizacion
 */
function setSignalingServer(url) {
  SIGNALING_SERVER_URL = url;
  if (signalingSocket) {
    signalingSocket.close();
  }
  initSignalingConnection();
}

/**
 * Obtiene dispositivos de camara disponibles
 */
async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch (error) {
    console.error("[WebRTC] Error enumerando dispositivos:", error);
    return [];
  }
}

/**
 * Abre modal para configurar servidor WebRTC
 */
function openWebRTCSettings() {
  document.getElementById("webrtc-settings-modal").classList.remove("hidden");
  document.getElementById("signaling-server-url").value = SIGNALING_SERVER_URL;
}

function closeWebRTCSettings() {
  document.getElementById("webrtc-settings-modal").classList.add("hidden");
}

function saveWebRTCSettings() {
  const url = document.getElementById("signaling-server-url").value.trim();
  if (url) {
    setSignalingServer(url);
    localStorage.setItem("webrtc-signaling-server", url);
  }
  closeWebRTCSettings();
}

// Cargar configuracion guardada al iniciar
document.addEventListener("DOMContentLoaded", () => {
  const savedServer = localStorage.getItem("webrtc-signaling-server");
  if (savedServer) {
    SIGNALING_SERVER_URL = savedServer;
  }
  
  // Intentar conectar al servidor de senalizacion
  initSignalingConnection();
});
