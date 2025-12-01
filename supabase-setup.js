/**
 * CONFIGURACIÓN DE SUPABASE
 *
 * Este archivo maneja la conexión con la base de datos Supabase.
 *
 * PASOS PARA CONFIGURAR SUPABASE:
 *
 * 1. CREAR PROYECTO EN SUPABASE
 *    - Ve a https://supabase.com
 *    - Crea una nueva cuenta o inicia sesión
 *    - Crea un nuevo proyecto
 *    - Obtén la URL y la clave anón en Settings > API
 *
 * 2. CREAR TABLAS EN LA BASE DE DATOS
 *    - Ve a SQL Editor en Supabase Dashboard
 *    - Copia y ejecuta el siguiente SQL:
 *
 * -------- INICIO DEL SQL --------
 *
 * -- Tabla de dispositivos
 * CREATE TABLE devices (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     name VARCHAR(255) NOT NULL,
 *     type VARCHAR(50) NOT NULL, -- 'light', 'lock', 'thermostat', 'motion_sensor', 'camera'
 *     status JSONB DEFAULT '{"online": true, "power": false}'::jsonb,
 *     location VARCHAR(255),
 *     created_at TIMESTAMP DEFAULT NOW(),
 *     updated_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * -- Tabla de registros de actividad
 * CREATE TABLE activity_logs (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
 *     action VARCHAR(255) NOT NULL,
 *     previous_state JSONB,
 *     new_state JSONB,
 *     timestamp TIMESTAMP DEFAULT NOW()
 * );
 *
 * -- Tabla de usuarios y permisos (opcional para futuros usos)
 * CREATE TABLE device_users (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id UUID NOT NULL,
 *     device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
 *     permission VARCHAR(50) DEFAULT 'control', -- 'view', 'control'
 *     created_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * -------- FIN DEL SQL --------
 *
 * 3. INSERTAR DISPOSITIVOS DE EJEMPLO (Opcional)
 *    Ejecuta este SQL en el SQL Editor:
 *
 * -------- INICIO DEL SQL --------
 *
 * -- Luces Inteligentes
 * INSERT INTO devices (name, type, status, location) VALUES
 * ('Luz Sala', 'light', '{"online": true, "power": false, "brightness": 100}'::jsonb, 'Sala'),
 * ('Luz Dormitorio', 'light', '{"online": true, "power": false, "brightness": 50}'::jsonb, 'Dormitorio'),
 * ('Luz Cocina', 'light', '{"online": true, "power": true, "brightness": 80}'::jsonb, 'Cocina');
 *
 * -- Cerraduras Inteligentes
 * INSERT INTO devices (name, type, status, location) VALUES
 * ('Puerta Principal', 'lock', '{"online": true, "locked": true}'::jsonb, 'Entrada'),
 * ('Puerta Garage', 'lock', '{"online": true, "locked": false}'::jsonb, 'Garage');
 *
 * -- Termostatos
 * INSERT INTO devices (name, type, status, location) VALUES
 * ('Termostato Principal', 'thermostat', '{"online": true, "temperature": 22, "target": 22}'::jsonb, 'Sala'),
 * ('Termostato Dormitorio', 'thermostat', '{"online": true, "temperature": 20, "target": 20}'::jsonb, 'Dormitorio');
 *
 * -- Sensores de Movimiento
 * INSERT INTO devices (name, type, status, location) VALUES
 * ('Sensor Entrada', 'motion_sensor', '{"online": true, "motion_detected": false}'::jsonb, 'Entrada'),
 * ('Sensor Sala', 'motion_sensor', '{"online": true, "motion_detected": true}'::jsonb, 'Sala');
 *
 * -- Cámaras de Seguridad
 * INSERT INTO devices (name, type, status, location) VALUES
 * ('Cámara Entrada', 'camera', '{"online": true, "recording": true}'::jsonb, 'Entrada'),
 * ('Cámara Garage', 'camera', '{"online": false, "recording": false}'::jsonb, 'Garage');
 *
 * -------- FIN DEL SQL --------
 *
 * 4. HABILITAR REALTIME (Opcional pero recomendado)
 *    - Ve a Realtime > Database
 *    - Habilita realtime para la tabla 'devices' y 'activity_logs'
 *
 * 5. CONFIGURAR SEGURIDAD (RLS - Row Level Security)
 *    Ejecuta en el SQL Editor:
 *
 * -------- INICIO DEL SQL --------
 *
 * -- Habilitar RLS
 * ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
 *
 * -- Crear política para permitir lectura pública (sin autenticación)
 * CREATE POLICY "Allow all SELECT on devices" ON devices
 *     FOR SELECT USING (true);
 *
 * CREATE POLICY "Allow all SELECT on activity_logs" ON activity_logs
 *     FOR SELECT USING (true);
 *
 * -- Crear política para permitir actualización pública
 * CREATE POLICY "Allow all UPDATE on devices" ON devices
 *     FOR UPDATE USING (true);
 *
 * CREATE POLICY "Allow all INSERT on activity_logs" ON activity_logs
 *     FOR INSERT WITH CHECK (true);
 *
 * -------- FIN DEL SQL --------
 *
 * SOLUCIÓN DE PROBLEMAS:
 *
 * Si no conecta:
 * 1. Verifica que la URL sea: https://[proyecto].supabase.co (sin / al final)
 * 2. Verifica que uses la clave "anon" (public), NO la clave de servicio
 * 3. En Supabase, ve a Settings > Database > Connection Pooling y copia la URL
 * 4. Asegúrate de haber ejecutado el SQL para crear las tablas
 * 5. Verifica en Supabase que las políticas RLS estén habilitadas correctamente
 * 6. Abre la consola del navegador (F12) y revisa los mensajes de error
 */

class SupabaseClient {
  constructor() {
    this.client = null
    this.session = null
  }

  /**
   * Inicializa la conexión con Supabase */
    @param {string} url - https://vufsssdphryumshvvlcv.supabase.co
    @param {string} anonKey - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZnNzc2RwaHJ5dW1zaHZ2bGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTk4MzksImV4cCI6MjA4MDEzNTgzOX0.6SC5FULLxaOX_hei23VeVMp6zjJYU8I2LUakJ71H9mM
   
  async initialize(url, anonKey) {
    try {
      if (!url || !anonKey || typeof url !== "string" || typeof anonKey !== "string") {
        console.error("[Supabase] URL o clave inválidas")
        return false
      }

      if (!window.supabase || !window.supabase.createClient) {
        console.error("[Supabase] Biblioteca de Supabase no cargada correctamente")
        return false
      }

      this.client = window.supabase.createClient(url, anonKey)
      console.log("[Supabase] Conectado exitosamente")

      const { data, error } = await this.client.from("devices").select("count", { count: "exact" })

      if (error) {
        console.error("[Supabase] Error en prueba de conexión:", error)
        this.client = null
        return false
      }

      console.log("[Supabase] Prueba de conexión exitosa")
      return true
    } catch (error) {
      console.error("[Supabase] Error al conectar:", error.message)
      this.client = null
      return false
    }
  }

  /**
   * Obtiene todos los dispositivos de la base de datos
   */
  async getDevices() {
    if (!this.client) {
      console.error("[Supabase] Cliente no inicializado")
      return []
    }

    try {
      const { data, error } = await this.client.from("devices").select("*")

      if (error) throw error

      console.log("[Supabase] Dispositivos obtenidos:", data)
      return data || []
    } catch (error) {
      console.error("[Supabase] Error al obtener dispositivos:", error)
      return []
    }
  }

  /**
   * Obtiene dispositivos por tipo
   * @param {string} type - Tipo de dispositivo
   */
  async getDevicesByType(type) {
    if (!this.client) return []

    try {
      const { data, error } = await this.client.from("devices").select("*").eq("type", type)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`[Supabase] Error al obtener ${type}:`, error)
      return []
    }
  }

  /**
   * Actualiza el estado de un dispositivo
   * @param {string} deviceId - ID del dispositivo
   * @param {object} newStatus - Nuevo estado del dispositivo
   */
  async updateDeviceStatus(deviceId, newStatus) {
    if (!this.client) return false

    try {
      const { error } = await this.client
        .from("devices")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId)

      if (error) throw error

      console.log("[Supabase] Estado actualizado:", deviceId)
      return true
    } catch (error) {
      console.error("[Supabase] Error al actualizar:", error)
      return false
    }
  }

  /**
   * Registra una actividad en el log
   * @param {string} deviceId - ID del dispositivo
   * @param {string} action - Acción realizada
   * @param {object} previousState - Estado anterior
   * @param {object} newState - Nuevo estado
   */
  async logActivity(deviceId, action, previousState, newState) {
    if (!this.client) return false

    try {
      const { error } = await this.client.from("activity_logs").insert([
        {
          device_id: deviceId,
          action,
          previous_state: previousState,
          new_state: newState,
        },
      ])

      if (error) throw error
      console.log("[Supabase] Actividad registrada:", action)
      return true
    } catch (error) {
      console.error("[Supabase] Error al registrar actividad:", error)
      return false
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   * @param {function} callback - Función que se ejecuta cuando hay cambios
   */
  subscribeToChanges(callback) {
    if (!this.client) return null

    try {
      const subscription = this.client
        .channel("devices")
        .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, (payload) => {
          console.log("[Supabase] Cambio detectado:", payload)
          callback(payload)
        })
        .subscribe()

      return subscription
    } catch (error) {
      console.error("[Supabase] Error en suscripción:", error)
      return null
    }
  }

  isConnected() {
    return this.client !== null
  }
}

const supabase = new SupabaseClient()
