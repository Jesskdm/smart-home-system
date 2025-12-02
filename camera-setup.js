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

PASO 2: ACTUALIZAR LA BASE DE DATOS
------------------------------------
En Supabase, ejecuta este SQL para agregar/actualizar una cámara:

UPDATE devices 
SET 
  camera_url = 'http://192.168.1.100:80/ISAPI/Streaming/channels/101/preview',
  camera_username = 'admin',
  camera_password = 'admin12345',
  camera_type = 'ip'
WHERE name = 'Cámara Entrada' AND type = 'camera';

PASO 3: CONFIGURAR EL BACKEND (Node.js/Express)
-----------------------------------------------
El backend debe tener un endpoint que haga proxy del stream:

app.get('/api/camera-proxy', async (req, res) => {
  const deviceId = req.query.device;
  
  // Obtener datos de la cámara desde Supabase
  const { data } = await supabase
    .from('devices')
    .select('camera_url, camera_username, camera_password')
    .eq('id', deviceId)
    .single();

  if (!data.camera_url) {
    return res.status(404).send('Cámara no configurada');
  }

  // Retransmitir el stream
  const auth = Buffer.from(\`\${data.camera_username}:\${data.camera_password}\`).toString('base64');
  
  try {
    const response = await fetch(data.camera_url, {
      headers: {
        'Authorization': \`Basic \${auth}\`
      }
    });
    
    res.setHeader('Content-Type', 'image/jpeg');
    response.body.pipe(res);
  } catch (error) {
    res.status(500).send('Error al conectar con la cámara');
  }
});

PASO 4: CONFIGURAR FRONTEND
---------------------------
El frontend automáticamente mostrará el stream si:
- camera_url está configurada en BD
- camera_type = 'ip'
- Las credenciales son correctas

PASO 5: VERIFICAR CONEXIÓN
--------------------------
1. Abre http://tu-servidor/
2. Navega a la sección "Cámaras de Seguridad"
3. Deberías ver el stream en vivo

=================================================================
TROUBLESHOOTING - PROBLEMAS COMUNES
=================================================================

PROBLEMA: "Error al conectar con la cámara"
SOLUCIONES:
- Verifica que la IP de la cámara sea correcta
- Comprueba que usuario/contraseña sean correctos
- Confirma que la cámara está encendida
- Verifica el protocolo (HTTP vs RTSP)
- Comprueba firewall entre servidor y cámara

PROBLEMA: Imagen negra o no carga
SOLUCIONES:
- La ruta del stream (/ISAPI/Streaming...) podría ser incorrecta
- Prueba accediendo directamente en el navegador: 
  http://admin:pass@192.168.1.100/ruta/stream
- Consulta la documentación de tu marca

PROBLEMA: Autenticación rechazada
SOLUCIONES:
- Verifica mayúsculas en usuario/contraseña
- Comprueba que la autenticación sea HTTP Basic
- Algunos modelos usan digest auth (requiere más configuración)

=================================================================
LINKS ÚTILES POR MARCA
=================================================================

Hikvision:    https://www.hikvision.com/en/
Dahua:        https://www.dahuasecurity.com/
TP-Link Tapo: https://www.tapo.com/
Reolink:      https://reolink.com/
Axis:         https://www.axis.com/

=================================================================
CÓMO ENCONTRAR LA IP DE TU CÁMARA
=================================================================

1. Conecta la cámara a tu red
2. Accede al router y busca dispositivos conectados
3. O usa herramientas como: Advanced IP Scanner, nmap, ZenMap
4. Busca en los logs del router o app del fabricante

=================================================================
SEGURIDAD IMPORTANTE
=================================================================

1. NUNCA uses credenciales débiles (admin/admin)
2. Cambia las credenciales por defecto INMEDIATAMENTE
3. Asegúrate de que la cámara está en una red segura
4. Usa VPN o tunelización si accedes desde internet
5. Actualiza el firmware de la cámara regularmente
6. En producción, encripta las credenciales en BD

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
