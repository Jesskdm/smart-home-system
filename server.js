// Backend - Servidor Express con conexión a Supabase
import express from "express"
import cors from "cors"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

app.use(express.static("public"))

// ============= RUTAS DE API =============

// Obtener todos los dispositivos
app.get("/api/devices", async (req, res) => {
  try {
    const { data, error } = await supabase.from("devices").select("*").order("id", { ascending: true })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al obtener dispositivos:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtener un dispositivo específico
app.get("/api/devices/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("devices").select("*").eq("id", req.params.id).single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al obtener dispositivo:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Actualizar estado de un dispositivo
app.patch("/api/devices/:id", async (req, res) => {
  try {
    const { status, brightness, temperature, is_locked, is_recording, last_motion } = req.body

    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (brightness !== undefined) updateData.brightness = brightness
    if (temperature !== undefined) updateData.temperature = temperature
    if (is_locked !== undefined) updateData.is_locked = is_locked
    if (is_recording !== undefined) updateData.is_recording = is_recording
    if (last_motion !== undefined) updateData.last_motion = last_motion

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("devices").update(updateData).eq("id", req.params.id).select().single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al actualizar dispositivo:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Crear un nuevo dispositivo
app.post("/api/devices", async (req, res) => {
  try {
    const { name, type, location, status } = req.body

    const { data, error } = await supabase
      .from("devices")
      .insert([
        {
          name,
          type,
          location,
          status: status || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al crear dispositivo:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Eliminar un dispositivo
app.delete("/api/devices/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("devices").delete().eq("id", req.params.id)

    if (error) throw error
    res.json({ success: true, message: "Dispositivo eliminado" })
  } catch (error) {
    console.error("Error al eliminar dispositivo:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Obtener logs de actividad
app.get("/api/activity-logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al obtener logs:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Crear un log de actividad
app.post("/api/activity-logs", async (req, res) => {
  try {
    const { device_id, action, details } = req.body

    const { data, error } = await supabase
      .from("activity_logs")
      .insert([
        {
          device_id,
          action,
          details,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error("Error al crear log:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Verificar salud del servidor
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Servidor funcionando correctamente" })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
})
