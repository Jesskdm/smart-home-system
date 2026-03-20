# Servidor de Streaming RTSP para Smart Home

Este servidor convierte streams RTSP de cámaras IP a MJPEG sobre WebSocket, permitiendo visualizarlas directamente en el navegador.

## Requisitos

- **Node.js 18+**
- **FFmpeg** instalado en el sistema

### Instalar FFmpeg

**Windows:**
1. Descarga desde https://www.gyan.dev/ffmpeg/builds/
2. Extrae y agrega la carpeta `bin` al PATH del sistema

**Mac:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

## Instalación

```bash
cd server
npm install
```

## Configuración de Cámaras

Edita el archivo `rtsp-stream-server.js` y modifica el array `cameras`:

```javascript
cameras: [
  {
    id: 'camera-1',
    name: 'Entrada Principal',
    rtspUrl: 'rtsp://admin:12345@192.168.1.64:554/stream1',
    width: 1280,
    height: 720,
    fps: 15
  },
  {
    id: 'camera-2',
    name: 'Sala de Estar',
    rtspUrl: 'rtsp://admin:password@192.168.1.65:554/stream1',
    width: 1280,
    height: 720,
    fps: 15
  }
]
```

## Ejecutar el Servidor

```bash
npm start
```

El servidor se iniciará en:
- **Estado:** http://localhost:8080
- **WebSocket:** ws://localhost:8080

## Configurar en la App

1. Abre la aplicación Smart Home
2. Ve a la sección **Cámaras**
3. Haz clic en el icono de engranaje junto a "Servidor Desconectado"
4. Ingresa: `ws://localhost:8080`
5. Haz clic en **Guardar**
6. El estado debería cambiar a "Servidor Activo"

## URLs RTSP por Marca

| Marca     | URL Ejemplo |
|-----------|-------------|
| **H-VIEW**    | `rtsp://admin:12345@IP:554/stream1` |
| **Hikvision** | `rtsp://admin:pass@IP:554/h264/ch1/main/av_stream` |
| **Dahua**     | `rtsp://admin:pass@IP:554/cam/realmonitor?channel=1&subtype=0` |
| **Reolink**   | `rtsp://admin:pass@IP:554/h264Preview_01_main` |
| **Tapo**      | `rtsp://user:pass@IP:554/stream1` |
| **Generic**   | `rtsp://user:pass@IP:554/live/ch00_0` |

## Probar URL RTSP

Antes de configurar, verifica que la URL funcione:

```bash
# Con FFmpeg
ffplay "rtsp://admin:12345@192.168.1.64:554/stream1"

# Con VLC
# Archivo → Abrir ubicación de red → pegar URL
```

## Arquitectura

```
┌─────────────────┐
│   Cámara IP     │
│    (RTSP)       │
└────────┬────────┘
         │ RTSP Stream
         ▼
┌─────────────────┐
│  FFmpeg         │
│  (Transcoder)   │
└────────┬────────┘
         │ MJPEG Frames
         ▼
┌─────────────────┐
│  Node.js Server │
│  (WebSocket)    │
└────────┬────────┘
         │ Base64 JPEG
         ▼
┌─────────────────┐
│   Navegador     │
│  (Smart Home)   │
└─────────────────┘
```

## Solución de Problemas

### "Servidor Desconectado"
1. Verifica que el servidor esté corriendo (`npm start`)
2. Asegúrate de que el puerto 8080 no esté bloqueado
3. Verifica la URL del servidor en la configuración

### "FFmpeg no encontrado"
1. Instala FFmpeg siguiendo las instrucciones arriba
2. Reinicia la terminal/consola después de instalar
3. Verifica con: `ffmpeg -version`

### La cámara no muestra video
1. Prueba la URL RTSP con VLC o ffplay primero
2. Verifica usuario/contraseña de la cámara
3. Asegúrate de que la cámara esté en la misma red

### Video con mucho lag
1. Reduce el FPS en la configuración (ej: de 15 a 10)
2. Reduce la resolución (ej: 640x480)
3. Usa el sub-stream de la cámara si está disponible

## Opciones Alternativas

### Para cámaras locales (Webcam)
No necesitas este servidor. Selecciona **"Cámara Local"** al agregar la cámara en la app.

### go2rtc (más eficiente)
Si necesitas mejor rendimiento:

1. Descarga desde: https://github.com/AlexxIT/go2rtc/releases
2. Crea `go2rtc.yaml`:
```yaml
streams:
  camera-1: rtsp://admin:12345@192.168.1.64:554/stream1
```
3. Ejecuta: `./go2rtc`
4. Configura la app para usar: `ws://localhost:8555/ws`
