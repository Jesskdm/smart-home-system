/**
 * Puente RTSP a WebRTC
 * 
 * Este script convierte streams RTSP de cámaras IP a WebRTC.
 * Requiere FFmpeg instalado en el sistema.
 * 
 * Para ejecutar:
 * 1. Instalar FFmpeg: https://ffmpeg.org/download.html
 * 2. cd server
 * 3. npm install
 * 4. node rtsp-to-webrtc.js
 * 
 * Configuración de cámaras en el archivo cameras-config.json
 */

import { WebSocket } from 'ws';
import { spawn } from 'child_process';

// Configuración
const SIGNALING_SERVER = process.env.SIGNALING_SERVER || 'ws://localhost:8080';

// Configuración de cámaras RTSP
const CAMERAS = [
  {
    id: 'camera-1',
    name: 'Entrada Principal',
    rtspUrl: 'rtsp://admin:12345@192.168.1.64:554/stream1',
    // Alternativas comunes:
    // rtspUrl: 'rtsp://admin:admin@192.168.1.64:554/h264/ch1/main/av_stream', // Hikvision
    // rtspUrl: 'rtsp://admin:admin@192.168.1.64:554/cam/realmonitor?channel=1&subtype=0', // Dahua
  },
  // Añade más cámaras aquí
];

class RTSPtoWebRTC {
  constructor(camera) {
    this.camera = camera;
    this.ws = null;
    this.ffmpegProcess = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(SIGNALING_SERVER);

      this.ws.on('open', () => {
        console.log(`[${this.camera.name}] Conectado al servidor de señalización`);
        this.reconnectAttempts = 0;
        
        // Registrar esta cámara
        this.ws.send(JSON.stringify({
          type: 'register-camera',
          cameraId: this.camera.id
        }));
        
        resolve();
      });

      this.ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        console.log(`[${this.camera.name}] Desconectado del servidor`);
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error(`[${this.camera.name}] Error:`, error.message);
        reject(error);
      });
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case 'viewer-request':
        console.log(`[${this.camera.name}] Visor solicitando stream`);
        this.startStreaming(data.viewerId);
        break;
        
      case 'answer':
        // Manejar respuesta SDP del visor
        console.log(`[${this.camera.name}] Respuesta SDP recibida`);
        break;
        
      case 'ice-candidate':
        // Manejar candidato ICE del visor
        break;
    }
  }

  startStreaming(viewerId) {
    // En un entorno real, aquí se usaría una librería como 
    // node-webrtc o mediasoup para crear el stream WebRTC.
    // 
    // Por ahora, mostramos cómo se configuraría FFmpeg para 
    // transcodificar el stream RTSP:
    
    console.log(`[${this.camera.name}] Iniciando stream para visor ${viewerId}`);
    console.log(`[${this.camera.name}] RTSP URL: ${this.camera.rtspUrl}`);
    
    // Ejemplo de comando FFmpeg para capturar RTSP:
    // ffmpeg -rtsp_transport tcp -i "rtsp://..." -c:v libvpx -c:a libopus -f webm -
    
    // Para una implementación completa, considera usar:
    // - mediasoup: https://mediasoup.org/
    // - Janus Gateway: https://janus.conf.meetecho.com/
    // - Kurento: https://www.kurento.org/
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[${this.camera.name}] Reconectando en ${delay/1000}s...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  stop() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill();
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Iniciar puentes para todas las cámaras
async function main() {
  console.log('='.repeat(50));
  console.log('Puente RTSP a WebRTC');
  console.log('='.repeat(50));
  console.log(`Servidor de señalización: ${SIGNALING_SERVER}`);
  console.log(`Cámaras configuradas: ${CAMERAS.length}`);
  console.log('='.repeat(50));

  for (const camera of CAMERAS) {
    const bridge = new RTSPtoWebRTC(camera);
    try {
      await bridge.connect();
    } catch (error) {
      console.error(`Error conectando ${camera.name}:`, error.message);
    }
  }
}

main().catch(console.error);
