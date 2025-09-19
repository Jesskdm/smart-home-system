import { NextResponse } from "next/server"
import admin from "@/lib/firebase/admin"
import { firestore } from "firebase-admin"

// Listar todos los usuarios
export async function GET() {
  try {
    const userRecords = await admin.auth().listUsers()
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
    }))
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

// Crear un nuevo usuario
export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    })

    // Crear documento en Firestore para el nuevo usuario
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: "user",
      createdAt: firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

// Eliminar un usuario
export async function DELETE(request: Request) {
  try {
    const { uid } = await request.json()
    await admin.auth().deleteUser(uid)
    await admin.firestore().collection("users").doc(uid).delete()
    return NextResponse.json({ message: "Usuario eliminado correctamente" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
