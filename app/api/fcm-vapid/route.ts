import { NextResponse } from "next/server"

export async function GET() {
  const vapidKey = process.env.FCM_VAPID_KEY
  if (!vapidKey) {
    return NextResponse.json({ error: "VAPID key not configured on the server." }, { status: 500 })
  }
  return NextResponse.json({ vapidKey })
}
