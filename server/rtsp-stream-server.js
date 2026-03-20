/**
 * Servidor de Streaming RTSP a WebSocket
 * 
 * Convierte streams RTSP de cámaras IP a MJPEG sobre WebSocket
 * para visualización en navegadores web.
 * 
 * REQUISITOS:
 * - Node.js 18+
 * - FFmpeg instalado en el sistema
 * 
 * INSTALACIÓN FFmpeg:
 * - Windows: https://www.gyan.dev/ffmpeg/builds/ (descargar y agregar a PATH)
 * - Mac: brew install ffmpeg
 * - Linux: sudo apt install ffmpeg
 */

import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

// ===========================
// CONFIGURACIÓN
// ===========================
const CONFIG = {
  port: process.env.PORT || 8080,
  
  // Configuración de cámaras RTSP
  cameras: [
    {
      id: 'camera-1',
      name: 'Entrada Principal',
      rtspUrl: 'rtsp://admin:12345@192.168.1.64:554/stream1',
      // Ajusta según tu cámara:
      // Hikvision: rtsp://admin:password@IP:554/Streaming/Channels/101
      // Dahua: rtsp://admin:password@IP:554/cam/realmonitor?channel=1&subtype=0
      // H-VIEW: rtsp://admin:password@IP:554/stream1
      width: 1280,
      height: 720,
      fps: 15
    },
    // Agrega más cámaras aquí...
  ],
  
  // Configuración de FFmpeg
  ffmpeg: {
    // Opciones de entrada RTSP
    inputOptions: [
      '-rtsp_transport', 'tcp',      // Usar TCP para RTSP (más estable)
      '-rtsp_flags', 'prefer_tcp',
      '-stimeout', '5000000',        // Timeout de 5 segundos
      '-analyzeduration', '1000000', // Analizar 1 segundo
      '-probesize', '1000000'
    ],
    // Opciones de salida MJPEG
    outputOptions: [
      '-f', 'mjpeg',           // Formato MJPEG
      '-q:v', '5',             // Calidad (2-31, menor = mejor)
      '-update', '1'           // Actualizar cada frame
    ]
  }
};

// ===========================
// SERVIDOR
// ===========================
class RTSPStreamServer {
  constructor() {
    this.httpServer = null;
    this.wss = null;
    this.streams = new Map();      // Procesos FFmpeg activos
    this.viewers = new Map();       // Visores conectados por cámara
    this.frameBuffers = new Map();  // Buffers de frames por cámara
  }

  start() {
    // Crear servidor HTTP para servir página de estado
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/') {
        this.serveStatusPage(res);
      } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', cameras: CONFIG.cameras.length }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Crear servidor WebSocket
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws, req) => {
      console.log(`[WS] Nueva conexión desde ${req.socket.remoteAddress}`);
      this.handleConnection(ws);
    });

    this.httpServer.listen(CONFIG.port, () => {
      console.log('');
      console.log('═'.repeat(60));
      console.log('  SERVIDOR DE STREAMING RTSP');
      console.log('═'.repeat(60));
      console.log(`  Estado:     http://localhost:${CONFIG.port}`);
      console.log(`  WebSocket:  ws://localhost:${CONFIG.port}`);
      console.log('─'.repeat(60));
      console.log('  Cámaras configuradas:');
      CONFIG.cameras.forEach(cam => {
        console.log(`    - ${cam.id}: ${cam.name}`);
        console.log(`      URL: ${cam.rtspUrl.replace(/:[^:@]+@/, ':****@')}`);
      });
      console.log('═'.repeat(60));
      console.log('');
    });
  }

  handleConnection(ws) {
    ws.isAlive = true;
    ws.subscribedCameras = new Set();

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('[WS] Error parseando mensaje:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WS] Conexión cerrada');
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('[WS] Error:', error.message);
    });

    // Enviar lista de cámaras disponibles
    ws.send(JSON.stringify({
      type: 'cameras-list',
      cameras: CONFIG.cameras.map(c => ({
        id: c.id,
        name: c.name,
        width: c.width,
        height: c.height
      }))
    }));
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        this.subscribeToCamera(ws, data.cameraId);
        break;
      case 'unsubscribe':
        this.unsubscribeFromCamera(ws, data.cameraId);
        break;
      case 'get-cameras':
        ws.send(JSON.stringify({
          type: 'cameras-list',
          cameras: CONFIG.cameras.map(c => ({ id: c.id, name: c.name }))
        }));
        break;
    }
  }

  subscribeToCamera(ws, cameraId) {
    const camera = CONFIG.cameras.find(c => c.id === cameraId);
    if (!camera) {
      ws.send(JSON.stringify({ type: 'error', message: `Cámara ${cameraId} no encontrada` }));
      return;
    }

    console.log(`[${cameraId}] Nuevo visor suscrito`);
    
    // Agregar a la lista de visores
    if (!this.viewers.has(cameraId)) {
      this.viewers.set(cameraId, new Set());
    }
    this.viewers.get(cameraId).add(ws);
    ws.subscribedCameras.add(cameraId);

    // Iniciar stream si no está activo
    if (!this.streams.has(cameraId)) {
      this.startStream(camera);
    }

    ws.send(JSON.stringify({ type: 'subscribed', cameraId }));
  }

  unsubscribeFromCamera(ws, cameraId) {
    if (this.viewers.has(cameraId)) {
      this.viewers.get(cameraId).delete(ws);
      ws.subscribedCameras.delete(cameraId);

      // Detener stream si no hay visores
      if (this.viewers.get(cameraId).size === 0) {
        this.stopStream(cameraId);
      }
    }
  }

  handleDisconnect(ws) {
    // Desuscribir de todas las cámaras
    ws.subscribedCameras.forEach(cameraId => {
      this.unsubscribeFromCamera(ws, cameraId);
    });
  }

  startStream(camera) {
    console.log(`[${camera.id}] Iniciando stream desde ${camera.rtspUrl.replace(/:[^:@]+@/, ':****@')}`);

    const ffmpegArgs = [
      ...CONFIG.ffmpeg.inputOptions,
      '-i', camera.rtspUrl,
      '-vf', `scale=${camera.width}:${camera.height},fps=${camera.fps}`,
      ...CONFIG.ffmpeg.outputOptions,
      'pipe:1'
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    this.streams.set(camera.id, ffmpeg);

    let frameBuffer = Buffer.alloc(0);
    const JPEG_START = Buffer.from([0xff, 0xd8]);
    const JPEG_END = Buffer.from([0xff, 0xd9]);

    ffmpeg.stdout.on('data', (data) => {
      frameBuffer = Buffer.concat([frameBuffer, data]);

      // Buscar frames JPEG completos
      let startIdx = 0;
      while (true) {
        const frameStart = frameBuffer.indexOf(JPEG_START, startIdx);
        if (frameStart === -1) break;

        const frameEnd = frameBuffer.indexOf(JPEG_END, frameStart);
        if (frameEnd === -1) break;

        // Extraer frame completo
        const frame = frameBuffer.subarray(frameStart, frameEnd + 2);
        
        // Enviar a todos los visores
        this.broadcastFrame(camera.id, frame);

        startIdx = frameEnd + 2;
      }

      // Mantener solo los datos no procesados
      if (startIdx > 0) {
        frameBuffer = frameBuffer.subarray(startIdx);
      }

      // Limitar tamaño del buffer
      if (frameBuffer.length > 1024 * 1024) {
        frameBuffer = Buffer.alloc(0);
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('error') || msg.includes('Error')) {
        console.error(`[${camera.id}] FFmpeg:`, msg.trim());
      }
    });

    ffmpeg.on('close', (code) => {
      console.log(`[${camera.id}] FFmpeg cerrado con código ${code}`);
      this.streams.delete(camera.id);

      // Notificar a visores
      this.broadcastMessage(camera.id, { type: 'stream-ended', cameraId: camera.id });

      // Reintentar si hay visores
      if (this.viewers.has(camera.id) && this.viewers.get(camera.id).size > 0) {
        console.log(`[${camera.id}] Reintentando en 5 segundos...`);
        setTimeout(() => {
          if (this.viewers.get(camera.id)?.size > 0) {
            this.startStream(camera);
          }
        }, 5000);
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(`[${camera.id}] Error de FFmpeg:`, error.message);
      this.broadcastMessage(camera.id, { 
        type: 'error', 
        cameraId: camera.id, 
        message: 'Error de conexión con la cámara' 
      });
    });
  }

  stopStream(cameraId) {
    const ffmpeg = this.streams.get(cameraId);
    if (ffmpeg) {
      console.log(`[${cameraId}] Deteniendo stream`);
      ffmpeg.kill('SIGTERM');
      this.streams.delete(cameraId);
    }
  }

  broadcastFrame(cameraId, frame) {
    const viewers = this.viewers.get(cameraId);
    if (!viewers) return;

    const base64Frame = frame.toString('base64');
    const message = JSON.stringify({
      type: 'frame',
      cameraId,
      data: base64Frame
    });

    viewers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  broadcastMessage(cameraId, message) {
    const viewers = this.viewers.get(cameraId);
    if (!viewers) return;

    const msgStr = JSON.stringify(message);
    viewers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msgStr);
      }
    });
  }

  serveStatusPage(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>RTSP Stream Server</title>
  <style>
    body { font-family: system-ui; background: #1a1a2e; color: #eee; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #00d9ff; }
    .card { background: #16213e; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .camera { border-left: 3px solid #00d9ff; padding-left: 15px; margin: 10px 0; }
    .status { color: #4ade80; }
    code { background: #0f0f23; padding: 2px 6px; border-radius: 4px; }
    .url { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>RTSP Stream Server</h1>
    <div class="card">
      <h3>Estado: <span class="status">Activo</span></h3>
      <p>WebSocket: <code>ws://localhost:${CONFIG.port}</code></p>
    </div>
    <div class="card">
      <h3>Cámaras Configuradas</h3>
      ${CONFIG.cameras.map(cam => `
        <div class="camera">
          <strong>${cam.name}</strong> (${cam.id})<br>
          <span class="url">${cam.width}x${cam.height} @ ${cam.fps}fps</span>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <h3>Uso</h3>
      <p>Conectar vía WebSocket y enviar:</p>
      <code>{"type": "subscribe", "cameraId": "camera-1"}</code>
    </div>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
}

// Iniciar servidor
const server = new RTSPStreamServer();
server.start();

// Manejo de cierre limpio
process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.streams.forEach((ffmpeg, id) => {
    console.log(`Deteniendo stream ${id}`);
    ffmpeg.kill('SIGTERM');
  });
  process.exit(0);
});
