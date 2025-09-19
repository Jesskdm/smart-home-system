"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import DashboardLayoutComponent from "@/components/dashboard-layout"
import { useEffect } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Solo mostrar loading si realmente está cargando (máximo 2 segundos)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userForLayout = {
    id: user.uid,
    email: user.email!,
    full_name: userData?.displayName || user.displayName || user.email?.split("@")[0] || "Usuario",
    role: userData?.role || "user",
  }

  return <DashboardLayoutComponent user={userForLayout}>{children}</DashboardLayoutComponent>
}
