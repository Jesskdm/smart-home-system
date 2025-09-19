"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Bell, BellRing } from "lucide-react"
import { Badge } from "./ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationsBell() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const alertsQuery = query(collection(db, "alerts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setAlerts(alertsData)
      const unread = alertsData.filter((alert) => !alert.isRead).length
      setUnreadCount(unread)
    })

    return () => unsubscribe()
  }, [user])

  const handleMarkAsRead = async (alertId: string) => {
    const alertRef = doc(db, "alerts", alertId)
    await updateDoc(alertRef, { isRead: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-semibold">Notificaciones</div>
        <DropdownMenuSeparator />
        {alerts.length > 0 ? (
          alerts.slice(0, 5).map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              onSelect={() => handleMarkAsRead(alert.id)}
              className="flex items-start gap-2"
            >
              <BellRing className={`mt-1 h-4 w-4 ${alert.isRead ? "text-muted-foreground" : "text-primary"}`} />
              <div className="flex-1">
                <p className={`text-sm ${!alert.isRead && "font-bold"}`}>{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true, locale: es })}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
