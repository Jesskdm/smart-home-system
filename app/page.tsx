"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import DeviceGrid from "@/components/device-grid"
import Header from "@/components/header"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        )

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setSupabaseError("Variables de Supabase no configuradas")
          setIsLoading(false)
          return
        }

        setSupabase(client)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error inicializando Supabase:", error)
        setSupabaseError("Error al conectar con Supabase")
        setIsLoading(false)
      }
    }

    initSupabase()
    router.push("/dashboard") // Redirigir automáticamente al dashboard
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Cargando panel de control...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      {supabaseError ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
            {supabaseError}. Por favor, configura las variables de entorno de Supabase en la sección de Vars.
          </div>
        </div>
      ) : (
        <DeviceGrid supabase={supabase} />
      )}
    </main>
  )
}
