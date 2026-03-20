# Servidor WebRTC para Cámaras de Seguridad

## Instalación Rápida

```bash
cd server
npm install
npm start
```

El servidor se iniciará en `ws://localhost:8080`

## Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Navegador  │◄───►│ Servidor Señaliz.│◄───►│  Cámara IP  │
│  (WebRTC)   │     │   (WebSocket)    │     │   (RTSP)    │
└─────────────┘     └──────────────────┘     └─────────────┘
```

## Opciones de Configuración

### Opción 1: Cámara Local (Webcam)
No requiere servidor. Selecciona "Cámara Local" al agregar la cámara.

### Opción 2: Servidor de Señalización Simple
Para pruebas y desarrollo:

```bash
npm start
```

### Opción 3: Servidor Completo RTSP→WebRTC

Para convertir streams RTSP a WebRTC, necesitas una de estas soluciones:

#### A) Mediasoup (Recomendado para producción)
```bash
npm install mediasoup
```
[Documentación](https://mediasoup.org/)

#### B) Janus Gateway
Servidor de medios completo con soporte RTSP.
[Documentación](https://janus.conf.meetecho.com/)

#### C) go2rtc (Simple y eficiente)
```bash
# Descargar desde: https://github.com/AlexxIT/go2rtc
./go2rtc
```

Configuración `go2rtc.yaml`:
```yaml
streams:
  camera1: rtsp://admin:12345@192.168.1.64:554/stream1
  
webrtc:
  candidates:
    - 192.168.1.100:8555  # Tu IP local
```

## Configurar en la App

1. Abre la app de Smart Home
2. En la sección de Cámaras, haz clic en el icono de configuración (engranaje)
3. Ingresa la URL del servidor: `ws://localhost:8080`
4. Guarda la configuración

## Puertos Comunes RTSP por Marca

| Marca     | Puerto | URL Ejemplo |
|-----------|--------|-------------|
| H-VIEW    | 554    | rtsp://admin:12345@IP:554/stream1 |
| Hikvision | 554    | rtsp://admin:pass@IP:554/h264/ch1/main/av_stream |
| Dahua     | 554    | rtsp://admin:pass@IP:554/cam/realmonitor?channel=1&subtype=0 |
| Reolink   | 554    | rtsp://admin:pass@IP:554/h264Preview_01_main |
| Tapo      | 554    | rtsp://user:pass@IP:554/stream1 |

## Solución de Problemas

### La cámara no conecta
1. Verifica que la URL RTSP sea correcta
2. Prueba la URL en VLC: Archivo → Abrir ubicación de red
3. Verifica que el puerto 554 esté abierto

### Error de conexión WebSocket
1. Asegúrate de que el servidor esté corriendo
2. Verifica que no haya firewall bloqueando el puerto 8080

### Video con lag
1. Reduce la resolución de la cámara
2. Usa el sub-stream en lugar del main-stream
3. Verifica el ancho de banda de la red
