import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { app, db } from "./client"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"

// Define Firebase config here to construct the SW URL
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Helper to construct the service worker URL with config params
const constructServiceWorkerUrl = () => {
  const params = new URLSearchParams()
  for (const key in firebaseConfig) {
    const value = firebaseConfig[key as keyof typeof firebaseConfig]
    if (value) {
      params.append(key, value)
    }
  }
  return `/firebase-messaging-sw.js?${params.toString()}`
}

export const initializeFirebaseMessaging = () => {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messaging = getMessaging(app)
      return messaging
    }
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error)
  }
  return null
}

// Function to fetch the VAPID key from our API route
const getVapidKey = async () => {
  try {
    const response = await fetch("/api/fcm-vapid")
    if (!response.ok) {
      throw new Error("Failed to fetch VAPID key")
    }
    const data = await response.json()
    return data.vapidKey
  } catch (error) {
    console.error(error)
    return null
  }
}

export const requestNotificationPermission = async (userId: string) => {
  const messaging = initializeFirebaseMessaging()
  if (!messaging) return

  try {
    // Explicitly register the service worker
    const swUrl = constructServiceWorkerUrl()
    const registration = await navigator.serviceWorker.register(swUrl)
    console.log("Service worker registered successfully:", registration)

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      console.log("Notification permission granted.")

      // Fetch the VAPID key from the server
      const vapidKey = await getVapidKey()
      if (!vapidKey) {
        console.error("Could not get VAPID key from server.")
        return
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      })

      if (currentToken) {
        console.log("FCM Token:", currentToken)
        // Save the token to the user's document in Firestore
        const userDocRef = doc(db, "users", userId)
        await updateDoc(userDocRef, {
          fcmTokens: arrayUnion(currentToken),
        })
      } else {
        console.log("No registration token available. Request permission to generate one.")
      }
    } else {
      console.log("Unable to get permission to notify.")
    }
  } catch (error) {
    console.error("An error occurred while retrieving token or registering SW. ", error)
  }
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = initializeFirebaseMessaging()
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload)
      })
    }
  })
