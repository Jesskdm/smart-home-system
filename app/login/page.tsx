import Link from "next/link"
import { Home } from "lucide-react"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className="text-xl font-bold">Smart Home System</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center bg-muted/40">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h1>
            <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
          </div>
          <LoginForm />
          <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
