"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, db } from "@/lib/firebase/client"
import { doc, getDoc, setDoc } from "firebase/firestore"

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)

        // Datos básicos inmediatos
        const basicUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "Usuario",
          role: user.email === "admin@smarthome.com" ? "admin" : "user",
          createdAt: new Date(),
        }
        setUserData(basicUserData)
        setLoading(false)

        // Cargar datos completos en segundo plano
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            setUserData({ ...basicUserData, ...userDoc.data() })
          } else {
            await setDoc(userDocRef, basicUserData)
          }
        } catch (error) {
          console.error("Error loading user data:", error)
        }
      } else {
        setUser(null)
        setUserData(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, userData, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
