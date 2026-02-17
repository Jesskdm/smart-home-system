/**
 * Smart Home - Control de Dispositivos
 * Navegacion por secciones + vista avanzada de camaras
 */

const DEVICE_TYPES = {
  LIGHT: "light",
  LOCK: "lock",
  THERMOSTAT: "thermostat",
  MOTION_SENSOR: "motion_sensor",
  CAMERA: "camera",
};

const SECTION_MAP = {
  lights: { type: DEVICE_TYPES.LIGHT, grid: "lights-grid", empty: "lights-empty" },
  locks: { type: DEVICE_TYPES.LOCK, grid: "locks-grid", empty: "locks-empty" },
  thermostats: { type: DEVICE_TYPES.THERMOSTAT, grid: "thermostats-grid", empty: "thermostats-empty" },
  sensors: { type: DEVICE_TYPES.MOTION_SENSOR, grid: "sensors-grid", empty: "sensors-empty" },
  cameras: { type: DEVICE_TYPES.CAMERA, grid: "cameras-grid", empty: "cameras-empty" },
};

const SECTION_TITLES = {
  lights: "Luces",
  locks: "Cerraduras",
  thermostats: "Termostato",
  sensors: "Sensores",
  cameras: "Camaras",
};

let allDevices = [];
let currentSection = "lights";
let currentCameraId = null;
let cameraZoomLevel = 1;
let cameraMicActive = false;
let cameraAudioActive = false;
let pollingInterval = null;

// ===========================
// INIT
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadDevices();
  pollingInterval = setInterval(loadDevices, 5000);
});

// ===========================
// NAVIGATION
// ===========================
function navigateTo(section) {
  currentSection = section;

  // Update nav
  document.querySelectorAll(".nav-item[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });

  // Update content
  document.querySelectorAll(".content-section").forEach((el) => {
    el.classList.toggle("active", el.id === `section-${section}`);
  });

  // Update topbar title
  const title = document.getElementById("section-title");
  if (title) title.textContent = SECTION_TITLES[section] || section;

  // Close mobile sidebar
  document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
  } else {
    sidebar.classList.toggle("collapsed");
  }
}

// ===========================
// DATA LOADING
// ===========================
async function loadDevices() {
  try {
    const response = await fetch("/api/devices");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allDevices = data.devices || [];
    updateBadge(true);
  } catch (err) {
    if (allDevices.length === 0) {
      allDevices = getDefaultDevices();
    }
    updateBadge(false);
  }
  renderAllSections();
}

function getDefaultDevices() {
  return [
    { id: "1", name: "Luz Sala", type: "light", location: "Sala", status: { online: true, power: true, brightness: 80 } },
    { id: "2", name: "Luz Cocina", type: "light", location: "Cocina", status: { online: true, power: false, brightness: 100 } },
    { id: "3", name: "Puerta Principal", type: "lock", location: "Entrada", status: { online: true, locked: true } },
    { id: "4", name: "Puerta Garage", type: "lock", location: "Garage", status: { online: true, locked: false } },
    { id: "5", name: "Termostato Central", type: "thermostat", location: "Sala", status: { online: true, temperature: 22, target: 22 } },
    { id: "6", name: "Sensor Entrada", type: "motion_sensor", location: "Entrada", status: { online: true, motion_detected: false } },
    { id: "7", name: "Sensor Patio", type: "motion_sensor", location: "Patio", status: { online: true, motion_detected: true } },
    { id: "8", name: "Camara Entrada", type: "camera", location: "Entrada", status: { online: true, recording: true }, camera_url: null },
    { id: "9", name: "Camara Garage", type: "camera", location: "Garage", status: { online: true, recording: false }, camera_url: null },
  ];
}

function updateBadge(connected) {
  const badges = [document.getElementById("connection-badge"), document.getElementById("topbar-badge")];
  badges.forEach((b) => {
    if (!b) return;
    b.className = connected ? "badge badge-online" : "badge badge-offline";
    b.textContent = connected ? "Conectado" : "Offline";
  });
}

// ===========================
// RENDERING
// ===========================
function renderAllSections() {
  Object.entries(SECTION_MAP).forEach(([section, config]) => {
    const devices = allDevices.filter((d) => d.type === config.type);
    const grid = document.getElementById(config.grid);
    if (!grid) return;

    grid.innerHTML = "";

    if (devices.length === 0) {
      const empty = document.getElementById(config.empty);
      if (empty) {
        grid.appendChild(empty.cloneNode(true));
      }
      return;
    }

    if (section === "cameras") {
      devices.forEach((d) => grid.appendChild(createCameraCard(d)));
    } else {
      devices.forEach((d) => grid.appendChild(createDeviceCard(d)));
    }
  });
}

// ===========================
// DEVICE CARDS
// ===========================
function createDeviceCard(device) {
  const card = document.createElement("div");
  card.className = "device-card";
  const s = device.status || {};
  const online = s.online !== false;

  let controls = "";

  switch (device.type) {
    case DEVICE_TYPES.LIGHT:
      controls = `
        <div class="device-control">
          <button class="btn btn-toggle ${s.power ? "on" : "off"}" onclick="toggleLight('${device.id}', ${!s.power})">
            ${s.power ? "Encendido" : "Apagado"}
          </button>
        </div>
        <div class="device-control">
          <span class="control-label">Brillo: ${s.brightness || 100}%</span>
          <input type="range" min="0" max="100" value="${s.brightness || 100}" class="slider" onchange="updateBrightness('${device.id}', this.value)">
        </div>`;
      break;

    case DEVICE_TYPES.LOCK:
      controls = `
        <div class="device-control">
          <button class="btn btn-toggle ${s.locked ? "on" : "off"}" onclick="toggleLock('${device.id}', ${!s.locked})">
            ${s.locked ? "Bloqueada" : "Desbloqueada"}
          </button>
        </div>`;
      break;

    case DEVICE_TYPES.THERMOSTAT:
      controls = `
        <div class="device-control">
          <span class="control-label">Actual: ${s.temperature || 20}C</span>
        </div>
        <div class="device-control">
          <span class="control-label">Objetivo: ${s.target || 20}C</span>
          <div class="input-group">
            <button class="btn btn-secondary" onclick="adjustTemp('${device.id}', ${(s.target || 20) - 1})">-</button>
            <input type="text" class="input-small" value="${s.target || 20}" readonly>
            <button class="btn btn-secondary" onclick="adjustTemp('${device.id}', ${(s.target || 20) + 1})">+</button>
          </div>
        </div>`;
      break;

    case DEVICE_TYPES.MOTION_SENSOR:
      const detected = s.motion_detected || false;
      controls = `
        <div class="device-control">
          <div class="motion-status ${detected ? "detected" : "idle"}">
            ${detected ? "Movimiento Detectado" : "Sin Movimiento"}
          </div>
        </div>`;
      break;
  }

  card.innerHTML = `
    <div class="device-header">
      <div>
        <div class="device-name">${device.name}</div>
        <div class="device-location">${device.location || "-"}</div>
      </div>
      <div class="device-indicator ${online ? "online" : "offline"}"></div>
    </div>
    <div class="device-body">${controls}</div>`;

  return card;
}

// ===========================
// CAMERA CARDS (Grid view)
// ===========================
function createCameraCard(device) {
  const card = document.createElement("div");
  card.className = "camera-card";
  card.onclick = () => openCameraView(device.id);

  const s = device.status || {};
  const url = device.camera_url;
  const recording = s.recording || false;

  card.innerHTML = `
    <div class="camera-feed-preview">
      ${url ? `<img src="${url}" alt="${device.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"><div class="camera-no-signal" style="display:none">Sin senal</div>` : `<div class="camera-no-signal">Sin configurar</div>`}
      <div class="camera-card-overlay">
        <div>
          <div class="camera-card-name">${device.name}</div>
          <div class="camera-card-location">${device.location || ""}</div>
        </div>
        <div class="camera-rec-dot ${recording ? "" : "off"}"></div>
      </div>
    </div>`;

  return card;
}

function setCameraGrid(cols) {
  const grid = document.getElementById("cameras-grid");
  grid.className = `cameras-grid grid-${cols}`;

  document.querySelectorAll(".grid-btn").forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.grid) === cols);
  });
}

// ===========================
// CAMERA FULL VIEW
// ===========================
function openCameraView(deviceId) {
  const device = allDevices.find((d) => d.id === deviceId);
  if (!device) return;

  currentCameraId = deviceId;
  cameraZoomLevel = 1;
  cameraMicActive = false;
  cameraAudioActive = false;

  document.getElementById("camera-view-title").textContent = `${device.name} - ${device.location || ""}`;

  const feed = document.getElementById("camera-feed-full");
  if (device.camera_url) {
    feed.innerHTML = `<img id="camera-full-img" src="${device.camera_url}" alt="${device.name}" style="transform: scale(1)" onerror="this.outerHTML='<div class=\\'camera-placeholder-full\\'>Sin senal</div>'">`;
  } else {
    feed.innerHTML = `<div class="camera-placeholder-full">Camara sin configurar - usa Ajustes para conectarla</div>`;
  }

  // Reset button states
  document.getElementById("btn-mic").classList.remove("active");
  document.getElementById("btn-audio").classList.remove("active");
  const isRec = device.status?.recording || false;
  document.getElementById("btn-record").classList.toggle("active", isRec);

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
  if (img) {
    img.style.transform = `scale(${cameraZoomLevel})`;
  }
}

async function toggleCameraRecording() {
  if (!currentCameraId) return;
  const device = allDevices.find((d) => d.id === currentCameraId);
  if (!device) return;

  const newRec = !(device.status?.recording || false);
  await updateDeviceStatus(currentCameraId, { ...device.status, recording: newRec });
  document.getElementById("btn-record").classList.toggle("active", newRec);
}

// ===========================
// DEVICE ACTIONS
// ===========================
async function updateDeviceStatus(deviceId, newStatus) {
  try {
    const resp = await fetch(`/api/devices/${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (resp.ok) await loadDevices();
  } catch (err) {
    // Fallback: update locally
    const device = allDevices.find((d) => d.id === deviceId);
    if (device) {
      device.status = newStatus;
      renderAllSections();
    }
  }
}

async function toggleLight(id, power) {
  const d = allDevices.find((x) => x.id === id);
  if (d) await updateDeviceStatus(id, { ...d.status, power });
}

async function updateBrightness(id, val) {
  const d = allDevices.find((x) => x.id === id);
  if (d) await updateDeviceStatus(id, { ...d.status, brightness: parseInt(val) });
}

async function toggleLock(id, locked) {
  const d = allDevices.find((x) => x.id === id);
  if (d) await updateDeviceStatus(id, { ...d.status, locked });
}

async function adjustTemp(id, target) {
  const d = allDevices.find((x) => x.id === id);
  if (d) await updateDeviceStatus(id, { ...d.status, target: Math.max(15, Math.min(30, target)) });
}

async function toggleCamera(id, recording) {
  const d = allDevices.find((x) => x.id === id);
  if (d) await updateDeviceStatus(id, { ...d.status, recording });
}

// ===========================
// MODALS: ADD DEVICE
// ===========================
function openAddDeviceModal(type) {
  const titles = {
    light: "Agregar Luz",
    lock: "Agregar Cerradura",
    thermostat: "Agregar Termostato",
    motion_sensor: "Agregar Sensor",
  };
  document.getElementById("add-device-title").textContent = titles[type] || "Agregar Dispositivo";
  document.getElementById("device-type-input").value = type;
  document.getElementById("add-device-form").reset();
  document.getElementById("add-device-modal").classList.remove("hidden");
}

function closeAddDeviceModal() {
  document.getElementById("add-device-modal").classList.add("hidden");
}

async function handleAddDevice(event) {
  event.preventDefault();
  const type = document.getElementById("device-type-input").value;
  const name = document.getElementById("device-name").value;
  const location = document.getElementById("device-location").value;

  const defaults = {
    light: { online: true, power: false, brightness: 100 },
    lock: { online: true, locked: true },
    thermostat: { online: true, temperature: 20, target: 20 },
    motion_sensor: { online: true, motion_detected: false },
  };

  const newDevice = {
    id: Date.now().toString(),
    name,
    type,
    location,
    status: defaults[type] || { online: true },
  };

  try {
    const resp = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDevice),
    });
    if (resp.ok) {
      await loadDevices();
    } else {
      allDevices.push(newDevice);
      renderAllSections();
    }
  } catch {
    allDevices.push(newDevice);
    renderAllSections();
  }

  closeAddDeviceModal();
}

// ===========================
// MODALS: ADD CAMERA
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

  const name = document.getElementById("camera-name").value;
  const location = document.getElementById("camera-location").value;
  const cameraUrl = document.getElementById("camera-url").value;
  const username = document.getElementById("camera-username").value;
  const password = document.getElementById("camera-password").value;
  const cameraType = document.getElementById("camera-type").value;

  const newCamera = {
    id: Date.now().toString(),
    name,
    type: "camera",
    location,
    camera_url: cameraUrl,
    camera_username: username,
    camera_password: password,
    camera_type: cameraType,
    status: { online: true, recording: false },
  };

  try {
    const resp = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCamera),
    });
    if (resp.ok) {
      await loadDevices();
    } else {
      allDevices.push(newCamera);
      renderAllSections();
    }
  } catch {
    allDevices.push(newCamera);
    renderAllSections();
  }

  closeCameraSetupModal();
}

function editCameraConfig(deviceId) {
  closeCameraViewModal();
  const device = allDevices.find((d) => d.id === deviceId);
  if (!device) return;

  document.getElementById("camera-name").value = device.name || "";
  document.getElementById("camera-location").value = device.location || "";
  document.getElementById("camera-url").value = device.camera_url || "";
  document.getElementById("camera-username").value = device.camera_username || "";
  document.getElementById("camera-password").value = device.camera_password || "";
  document.getElementById("camera-type").value = device.camera_type || "ip";

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
