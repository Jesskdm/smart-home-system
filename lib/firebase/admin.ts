import admin from "firebase-admin"

// Evitar la reinicialización en entornos de desarrollo con hot-reload
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountKey) {
    console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.")
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    } catch (error: any) {
      console.error(
        "Firebase admin initialization error: Failed to parse service account key. Make sure it's a valid JSON.",
        error.stack,
      )
    }
  }
}

export default admin
