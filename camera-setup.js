/**
 * GUÍA PARA CONECTAR CÁMARAS IP REALES
 *
 * Este archivo contiene instrucciones para configurar cámaras IP
 * que se integren con el sistema de control remoto.
 */

/**
 * MARCAS DE CÁMARAS Y SUS CONFIGURACIONES
 */

const CAMERA_CONFIGS = {
  // Hikvision - Muy popular, amplia compatibilidad
  HIKVISION: {
    name: "Hikvision",
    protocol: "http",
    port: 80,
    streamPath: "/ISAPI/Streaming/channels/101/preview",
    auth: "basic", // Requiere autenticación básica
    example: {
      url: "http://192.168.1.100",
      username: "admin",
      password: "admin12345",
      fullUrl: "http://admin:admin12345@192.168.1.100:80/ISAPI/Streaming/channels/101/preview",
    },
  },

  // Dahua - Compatible con RTSP
  DAHUA: {
    name: "Dahua",
    protocol: "rtsp",
    port: 554,
    streamPath: "/stream1",
    auth: "rtsp", // Autenticación en URL
    example: {
      url: "rtsp://192.168.1.101",
      username: "admin",
      password: "admin12345",
      fullUrl: "rtsp://admin:admin12345@192.168.1.101:554/stream1",
    },
  },

  // TP-Link Tapo - Cámaras modernas
  TPLINK_TAPO: {
    name: "TP-Link Tapo",
    protocol: "http",
    port: 8080,
    streamPath: "/stream",
    auth: "basic",
    example: {
      url: "http://192.168.1.102",
      username: "admin",
      password: "admin",
      fullUrl: "http://admin:admin@192.168.1.102:8080/stream",
    },
  },

  // Reolink - IP cameras profesionales
  REOLINK: {
    name: "Reolink",
    protocol: "rtsp",
    port: 554,
    streamPath: "/h264Preview_01_main",
    auth: "rtsp",
    example: {
      url: "rtsp://192.168.1.103",
      username: "admin",
      password: "admin123",
      fullUrl: "rtsp://admin:admin123@192.168.1.103:554/h264Preview_01_main",
    },
  },

  // Axis - Cámaras profesionales
  AXIS: {
    name: "Axis",
    protocol: "http",
    port: 80,
    streamPath: "/axis-cgi/mjpg/video.cgi",
    auth: "basic",
    example: {
      url: "http://192.168.1.104",
      username: "root",
      password: "pass",
      fullUrl: "http://root:pass@192.168.1.104:80/axis-cgi/mjpg/video.cgi",
    },
  },

  // H-VIEW - Cámaras IP profesionales
  HVIEW: {
    name: "H-VIEW",
    protocol: "rtsp",
    port: 554,
    streamPath: "/stream1", // o /h264/ch1/main
    auth: "rtsp", // Autenticación en URL RTSP
    example: {
      url: "rtsp://192.168.1.100",
      username: "admin",
      password: "admin123",
      fullUrl: "rtsp://admin:admin123@192.168.1.100:554/stream1",
    },
    alternativeStreams: [
      "rtsp://admin:admin123@192.168.1.100:554/stream1",
      "rtsp://admin:admin123@192.168.1.100:554/h264/ch1/main",
      "rtsp://admin:admin123@192.168.1.100:554/h264/ch1/sub",
    ],
  },
}

/**
 * PASOS PARA CONECTAR UNA CÁMARA IP
 */

const SETUP_STEPS = `
=================================================================
GUÍA PASO A PASO: CONECTAR CÁMARA IP AL SISTEMA
=================================================================

PASO 1: IDENTIFICAR TU CÁMARA
-----------------------------
1. Determina la marca y modelo de tu cámara
2. Accede a la interfaz web de la cámara (generalmente en http://IP_DE_CAMARA)
3. Anota la IP, usuario y contraseña

=================================================================
CONFIGURACIÓN ESPECÍFICA PARA H-VIEW
=================================================================

H-VIEW es una marca de cámaras IP que utiliza protocolo RTSP.
Son muy populares y fáciles de integrar.

PASO 1: ENCONTRAR LA IP DE LA CÁMARA H-VIEW
-------------------------------------------
1. Conecta la cámara H-VIEW a tu red
2. Usa la app móvil de H-VIEW o accede a: http://[IP_DE_CAMARA]:8080
3. Usuario y contraseña por defecto:
   - Usuario: admin
   - Contraseña: admin (o admin12345)
4. IMPORTANTE: Cambia la contraseña después de conectar

PASO 2: OBTENER DATOS DE CONEXIÓN
---------------------------------
En la interfaz web de H-VIEW:
1. Ve a: Configuración → Red → RTSP
2. Anota el puerto RTSP (por defecto 554)
3. Anota la ruta del stream (usualmente /stream1 o /h264/ch1/main)

PASO 3: FORMATOS DE URL H-VIEW
------------------------------
H-VIEW soporta estos formatos de URL RTSP:

Formato 1 (Más común):
  rtsp://admin:contraseña@192.168.1.100:554/stream1

Formato 2 (H264 main):
  rtsp://admin:contraseña@192.168.1.100:554/h264/ch1/main

Formato 3 (H264 sub - menor calidad, menos recursos):
  rtsp://admin:contraseña@192.168.1.100:554/h264/ch1/sub

Ejemplo real:
  rtsp://admin:admin123@192.168.1.100:554/stream1

PASO 4: ACTUALIZAR LA BASE DE DATOS
-----------------------------------
En Supabase, ejecuta este SQL:

UPDATE devices 
SET 
  camera_url = 'rtsp://admin:admin123@192.168.1.100:554/stream1',
  camera_username = 'admin',
  camera_password = 'admin123',
  camera_type = 'ip'
WHERE name = 'Cámara Entrada' AND type = 'camera';

O si no existe la cámara, inserta:

INSERT INTO devices (name, type, location, camera_url, camera_username, camera_password, camera_type, status)
VALUES (
  'Cámara H-VIEW Entrada',
  'camera',
  'Entrada',
  'rtsp://admin:admin123@192.168.1.100:554/stream1',
  'admin',
  'admin123',
  'ip',
  '{
    "online": true,
    "recording": true
  }'
);

PASO 5: PROBAR CONEXIÓN ANTES
-----------------------------
Antes de agregar en la app, prueba la URL en tu navegador:
1. Abre: rtsp://admin:admin123@192.168.1.100:554/stream1
   (Algunos navegadores no abren RTSP directamente)
2. O usa VLC: Media → Abrir ubicación de red → pega la URL RTSP

Si funciona en VLC, funcionará en la app.

PASO 6: CONFIGURAR BACKEND (Node.js)
-----------------------------------
El backend debe convertir RTSP a MJPEG porque los navegadores
no soportan RTSP directamente. Usa esta configuración:

1. Instala FFmpeg en tu servidor:
   
   Windows:
     Descarga de: https://ffmpeg.org/download.html
   
   Linux (Ubuntu/Debian):
     sudo apt-get install ffmpeg
   
   macOS:
     brew install ffmpeg

2. En tu backend Node.js, crea el endpoint:

app.get('/api/camera-proxy', async (req, res) => {
  const deviceId = req.query.device;
  
  const { data } = await supabase
    .from('devices')
    .select('camera_url, camera_username, camera_password')
    .eq('id', deviceId)
    .single();

  if (!data.camera_url) {
    return res.status(404).send('Cámara no configurada');
  }

  // Usar ffmpeg para convertir RTSP a MJPEG
  const ffmpeg = require('fluent-ffmpeg');
  
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME');
  res.setHeader('Cache-Control', 'no-cache');

  const proc = ffmpeg(data.camera_url)
    .inputOptions(['-rtsp_transport tcp', '-fflags nobuffer'])
    .outputOptions([
      '-f', 'mjpeg',
      '-q:v', '5',
      '-vf', 'fps=fps=10'
    ])
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      res.end();
    })
    .pipe(res);

  res.on('close', () => proc.kill());
});

O instala: npm install fluent-ffmpeg

PASO 7: VERIFICAR EN LA APP
--------------------------
1. Reinicia la app
2. Ve a sección "Cámaras de Seguridad"
3. Deberías ver el stream en vivo

=================================================================
TROUBLESHOOTING H-VIEW
=================================================================

PROBLEMA: "Error de conexión"
SOLUCIÓN 1: Verifica la IP
  - Abre http://192.168.1.100:8080 en el navegador
  - Si no abre, la IP es incorrecta

SOLUCIÓN 2: Verifica credenciales
  - Por defecto son: admin / admin
  - Si no funcionan, resetea la cámara a factory defaults

SOLUCIÓN 3: Verifica el puerto RTSP
  - Accede a la interfaz web
  - Ve a Configuración → Red → RTSP
  - Verifica que esté habilitado (por defecto puerto 554)

PROBLEMA: "Imagen negra o no carga"
SOLUCIÓN 1: Prueba diferentes rutas:
  rtsp://admin:pass@ip:554/stream1
  rtsp://admin:pass@ip:554/h264/ch1/main
  rtsp://admin:pass@ip:554/h264/ch1/sub

SOLUCIÓN 2: Verifica firewall
  - La cámara y servidor deben estar en misma red
  - O abre puerto 554 en el firewall

PROBLEMA: "Autenticación rechazada"
SOLUCIÓN: Asegúrate de usar credenciales correctas
  - Usuario: admin
  - Contraseña: la que configuraste (por defecto admin)
  - Si olvidaste, resetea la cámara

PROBLEMA: "FFmpeg no funciona"
SOLUCIÓN: Verifica que esté instalado
  ffmpeg -version
  Si no funciona, instálalo e intenta de nuevo

=================================================================
PUERTOS COMUNES H-VIEW
=================================================================

HTTP Web UI:     8080
RTSP Stream:     554
ONVIF:          8000
HTTPS:          8443

Ejemplo acceso web: http://192.168.1.100:8080
Usuario: admin
Contraseña: admin

=================================================================
ENLACES ÚTILES H-VIEW
=================================================================

Sitio oficial:        https://www.hview.net/
Documentación RTSP:   https://www.hview.net/support
Configuración ONVIF:  https://www.onvif.org/

=================================================================
`

console.log(SETUP_STEPS)

/**
 * Función auxiliar para verificar conexión a cámara
 */
async function testCameraConnection(cameraUrl, username, password) {
  console.log("[CAMERA] Probando conexión a:", cameraUrl)

  const auth = Buffer.from(`${username}:${password}`).toString("base64")

  try {
    const response = await fetch(cameraUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Connection: "close",
      },
      timeout: 5000,
    })

    if (response.ok) {
      console.log("[CAMERA] ✓ Conexión exitosa")
      return true
    } else {
      console.error("[CAMERA] ✗ Error HTTP:", response.status)
      return false
    }
  } catch (error) {
    console.error("[CAMERA] ✗ Error de conexión:", error.message)
    return false
  }
}

module.exports = {
  CAMERA_CONFIGS,
  SETUP_STEPS,
  testCameraConnection,
}
