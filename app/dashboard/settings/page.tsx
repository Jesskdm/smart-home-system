"use client"

import SettingsPanel from "@/components/settings-panel"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user, userData, loading } = useAuth()

  if (loading || !user || !userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <SettingsPanel user={user} userData={userData} />
}
