"use client"

import AdminUserManagement from "@/components/admin/user-management"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminUsersPage() {
  const { userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userData?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [userData, loading, router])

  if (loading || userData?.role !== "admin") {
    return <div className="flex items-center justify-center h-full">Cargando o no autorizado...</div>
  }

  return <AdminUserManagement />
}
