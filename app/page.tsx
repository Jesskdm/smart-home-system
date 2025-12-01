"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import DeviceGrid from "@/components/device-grid"
import Header from "@/components/header"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)

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
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
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
