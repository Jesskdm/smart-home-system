/**
 * Servidor de Señalización WebRTC
 * 
 * Este servidor coordina las conexiones WebRTC entre el navegador y las cámaras.
 * 
 * Para ejecutar:
 * 1. cd server
 * 2. npm install ws
 * 3. node signaling-server.js
 */

import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });

// Almacena conexiones activas
const clients = new Map(); // clientId -> WebSocket
const cameraStreams = new Map(); // cameraId -> { offer, candidates }

console.log(`[WebRTC Server] Servidor de señalización iniciado en ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  const clientId = generateId();
  clients.set(clientId, ws);
  
  console.log(`[WebRTC Server] Cliente conectado: ${clientId}`);
  
  // Enviar confirmación de conexión
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(clientId, ws, data);
    } catch (error) {
      console.error('[WebRTC Server] Error parseando mensaje:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[WebRTC Server] Cliente desconectado: ${clientId}`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`[WebRTC Server] Error en cliente ${clientId}:`, error);
  });
});

function handleMessage(clientId, ws, data) {
  const { type, cameraId } = data;
  
  console.log(`[WebRTC Server] Mensaje de ${clientId}: ${type} para cámara ${cameraId || 'N/A'}`);

  switch (type) {
    case 'request-stream':
      handleStreamRequest(clientId, ws, cameraId);
      break;
      
    case 'offer':
      // Guardar oferta y reenviar a la cámara/servidor de medios
      cameraStreams.set(cameraId, {
        ...cameraStreams.get(cameraId),
        offer: data.data
      });
      broadcastToOthers(clientId, data);
      break;
      
    case 'answer':
      // Reenviar respuesta al cliente que hizo la oferta
      broadcastToOthers(clientId, data);
      break;
      
    case 'ice-candidate':
      // Reenviar candidato ICE
      const stream = cameraStreams.get(cameraId) || { candidates: [] };
      stream.candidates = stream.candidates || [];
      stream.candidates.push(data.data);
      cameraStreams.set(cameraId, stream);
      broadcastToOthers(clientId, data);
      break;
      
    case 'register-camera':
      // Una cámara/servidor de medios se registra
      console.log(`[WebRTC Server] Cámara registrada: ${cameraId}`);
      cameraStreams.set(cameraId, { 
        clientId: clientId,
        ws: ws,
        ready: true 
      });
      break;
      
    default:
      console.log(`[WebRTC Server] Tipo de mensaje desconocido: ${type}`);
  }
}

function handleStreamRequest(clientId, ws, cameraId) {
  const cameraInfo = cameraStreams.get(cameraId);
  
  if (cameraInfo && cameraInfo.ready && cameraInfo.ws) {
    // Notificar a la cámara que un cliente quiere conectarse
    cameraInfo.ws.send(JSON.stringify({
      type: 'viewer-request',
      cameraId: cameraId,
      viewerId: clientId
    }));
    
    ws.send(JSON.stringify({
      type: 'camera-stream-ready',
      cameraId: cameraId
    }));
  } else {
    // Si no hay cámara registrada, enviar error
    ws.send(JSON.stringify({
      type: 'camera-unavailable',
      cameraId: cameraId,
      message: 'Cámara no disponible o no registrada'
    }));
  }
}

function broadcastToOthers(excludeClientId, data) {
  clients.forEach((ws, clientId) => {
    if (clientId !== excludeClientId && ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n[WebRTC Server] Cerrando servidor...');
  wss.close(() => {
    console.log('[WebRTC Server] Servidor cerrado');
    process.exit(0);
  });
});
