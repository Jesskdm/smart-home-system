/**
 * Smart Home - Control de Dispositivos
 * Tablas separadas: lights, locks, thermostats, motion_sensors, cameras
 */

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
  card.onclick = () => openCameraView(cam.id);

  const hasUrl = cam.stream_url || cam.snapshot_url;

  card.innerHTML = `
    <div class="camera-feed-preview">
      ${hasUrl ? `<img src="${cam.snapshot_url || cam.stream_url}" alt="${cam.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><div class="camera-no-signal" style="display:none">Sin senal</div>` : `<div class="camera-no-signal">Sin configurar</div>`}
      <div class="camera-card-overlay">
        <div>
          <div class="camera-card-name">${cam.name}</div>
          <div class="camera-card-location">${cam.location || ""} | ${cam.camera_brand || "---"} | ${cam.resolution || "---"}</div>
        </div>
        <div class="camera-rec-dot ${cam.is_recording ? "" : "off"}"></div>
      </div>
    </div>`;

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
  const hasUrl = cam.stream_url || cam.snapshot_url;

  if (hasUrl) {
    feed.innerHTML = `<img id="camera-full-img" src="${cam.stream_url || cam.snapshot_url}" alt="${cam.name}" style="transform:scale(1)" onerror="this.outerHTML='<div class=\\'camera-placeholder-full\\'>Error de conexion</div>'">`;
  } else {
    feed.innerHTML = '<div class="camera-placeholder-full">Camara sin configurar<br>Haz click en Ajustes para conectarla</div>';
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
    info.innerHTML = `<span>${cam.camera_brand || "---"}</span><span>${cam.resolution || "---"}</span><span>${cam.has_night_vision ? "Vision nocturna" : ""}</span>`;
  }

  document.getElementById("camera-view-modal").classList.remove("hidden");
}

function closeCameraViewModal() {
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
  const img = document.getElementById("camera-full-img");
  if (img) img.style.transform = "scale(" + cameraZoomLevel + ")";
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
