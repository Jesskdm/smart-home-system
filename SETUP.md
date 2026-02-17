# Sistema de Control de Dispositivos Inteligentes - Guía de Configuración

## 🚀 Inicio Rápido

### 1. Configurar Supabase

#### a. Crear un Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa los datos y espera a que se cree el proyecto

#### b. Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia estos valores:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

#### c. Ejecutar Script SQL
1. En Supabase, ve a **SQL Editor**
2. Haz clic en **"New Query"**
3. Abre el archivo `database-setup.sql` y copia TODO su contenido
4. Pega en el editor de SQL
5. Haz clic en **"Run"**

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### 3. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 4. Ejecutar el Proyecto

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Estructura de la Base de Datos

### Tabla: `devices`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único del dispositivo |
| name | TEXT | Nombre del dispositivo |
| type | TEXT | Tipo (light, lock, thermostat, motion_sensor, camera) |
| location | TEXT | Ubicación del dispositivo |
| status | BOOLEAN | Estado del dispositivo |
| brightness | INTEGER | Brillo de la luz (0-100) |
| temperature | NUMERIC | Temperatura actual |
| target_temperature | NUMERIC | Temperatura objetivo |
| is_locked | BOOLEAN | Si está bloqueado |
| is_recording | BOOLEAN | Si está grabando |
| motion_detected | BOOLEAN | Si detecta movimiento |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última actualización |

### Tabla: `activity_logs`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único del log |
| device_id | UUID | Referencia al dispositivo |
| action | TEXT | Acción realizada |
| details | JSONB | Detalles en formato JSON |
| created_at | TIMESTAMP | Fecha del evento |

## 🔧 API Endpoints

### Dispositivos

#### Obtener todos los dispositivos
\`\`\`
GET /api/devices
\`\`\`
**Respuesta:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Luz Sala",
      "type": "light",
      "status": true,
      "brightness": 75
    }
  ]
}
\`\`\`

#### Obtener un dispositivo
\`\`\`
GET /api/devices/:id
\`\`\`

#### Crear dispositivo
\`\`\`
POST /api/devices
Content-Type: application/json

{
  "name": "Nueva Luz",
  "type": "light",
  "location": "Sala",
  "status": false
}
\`\`\`

#### Actualizar dispositivo
\`\`\`
PATCH /api/devices/:id
Content-Type: application/json

{
  "status": true,
  "brightness": 100
}
\`\`\`

#### Eliminar dispositivo
\`\`\`
DELETE /api/devices/:id
\`\`\`

### Logs de Actividad

#### Obtener logs
\`\`\`
GET /api/activity-logs
\`\`\`

#### Crear log
\`\`\`
POST /api/activity-logs
Content-Type: application/json

{
  "device_id": "uuid",
  "action": "toggle",
  "details": "{\"previous_status\": false, \"new_status\": true}"
}
\`\`\`

## 🎨 Características

✅ Dashboard en tiempo real
✅ Control de 5 tipos de dispositivos
✅ Registro de actividad
✅ Interfaz moderna y responsiva
✅ Conexión segura con Supabase
✅ APIs RESTful integradas
✅ Row Level Security habilitado

## 🛠️ Troubleshooting

### "Variables de Supabase no configuradas"
- Verifica que `.env.local` existe en la raíz del proyecto
- Asegúrate de que las claves están correctas
- Reinicia el servidor: `npm run dev`

### "Error al conectar con Supabase"
- Verifica que el URL es correcto (debe comenzar con `https://`)
- Comprueba que la clave anon es válida
- Abre la consola del navegador (F12) para ver el error exacto

### "Tabla no existe"
- Ejecuta nuevamente el script SQL desde `database-setup.sql`
- Verifica que el script se ejecutó correctamente en Supabase

## 📝 Notas de Seguridad

- Las credenciales públicas (`NEXT_PUBLIC_*`) son seguras para compartir
- Nunca publiques `SUPABASE_SERVICE_ROLE_KEY` en repositorios públicos
- Usa `.env.local` y añádelo a `.gitignore`
- Row Level Security (RLS) está habilitado para proteger los datos

## 🚀 Deploy en Vercel

1. Sube tu código a GitHub
2. Conecta tu repositorio en [vercel.com](https://vercel.com)
3. Añade las variables de entorno en Vercel Settings
4. Deploy automático
