import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function getSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handle errors gracefully
          }
        },
      },
    },
  )
}

// GET - Obtener un dispositivo específico
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getSupabase()
    const { id } = await params

    const { data, error } = await supabase.from("devices").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Error al obtener dispositivo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

// PATCH - Actualizar un dispositivo
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getSupabase()
    const { id } = await params
    const updateData = await request.json()

    // Agregar timestamp de actualización
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("devices").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Error al actualizar dispositivo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

// DELETE - Eliminar un dispositivo
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getSupabase()
    const { id } = await params

    const { error } = await supabase.from("devices").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Dispositivo eliminado" })
  } catch (error) {
    console.error("[API] Error al eliminar dispositivo:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
