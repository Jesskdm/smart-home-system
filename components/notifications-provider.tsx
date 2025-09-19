"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "./auth-provider"
import { onMessageListener, requestNotificationPermission } from "@/lib/firebase/messaging"
import { useToast } from "./ui/use-toast"

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      requestNotificationPermission(user.uid)
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload: any) => {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
        })
      })
      .catch((err) => console.log("failed: ", err))

    return () => {
      // This is a bit of a hack as the promise doesn't have a classic unsubscribe method
      // In a real app, you might manage this subscription state more carefully
    }
  }, [toast])

  return <>{children}</>
}
