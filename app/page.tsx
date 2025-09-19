"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Home,
  Lock,
  Shield,
  Smartphone,
  Wifi,
  Bell,
  Camera,
  Thermometer,
  Lightbulb,
  Activity,
  Users,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Eye,
  Settings,
} from "lucide-react"
import { useEffect } from "react"

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // Mostrar página inmediatamente, sin loading
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className="text-xl font-bold">Smart Home System</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Crear Cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  🚀 Tecnología de Vanguardia
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Control Total de tu Hogar Inteligente
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Gestiona todos tus dispositivos inteligentes desde una sola plataforma. Seguridad avanzada,
                  automatización inteligente y control remoto para tu hogar.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="gap-1.5">
                  <Link href="/register">
                    Comenzar Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Configuración en 5 minutos
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
                <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur p-6 shadow-2xl">
                  <div className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 flex items-center justify-center">
                    <Home className="h-12 w-12 text-primary" />
                  </div>
                </div>
                {/* Dispositivos flotantes */}
                <div className="absolute left-[10%] top-[15%] flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-lg animate-pulse">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute right-[10%] top-[15%] flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-lg animate-pulse delay-100">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute bottom-[15%] left-[10%] flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-lg animate-pulse delay-200">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute bottom-[15%] right-[10%] flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-lg animate-pulse delay-300">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute left-[50%] top-[5%] flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg animate-bounce">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Todo lo que Necesitas para tu Hogar Inteligente
            </h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-3xl mx-auto">
              Una plataforma completa con todas las herramientas necesarias para controlar, monitorear y automatizar tu
              hogar de manera inteligente.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Control Remoto</CardTitle>
                <CardDescription>
                  Controla todos tus dispositivos desde cualquier lugar del mundo con nuestra app web responsive.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Alertas Inteligentes</CardTitle>
                <CardDescription>
                  Recibe notificaciones instantáneas sobre eventos importantes en tu hogar con sistema de prioridades.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Seguridad Avanzada</CardTitle>
                <CardDescription>
                  Monitoreo 24/7 con cámaras, sensores de movimiento y sistema de alertas de seguridad integrado.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Monitoreo en Tiempo Real</CardTitle>
                <CardDescription>
                  Visualiza el estado de todos tus dispositivos en tiempo real con gráficos y métricas detalladas.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fácil Configuración</CardTitle>
                <CardDescription>
                  Configura nuevos dispositivos en segundos con códigos QR automáticos y guías paso a paso.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multi-Usuario</CardTitle>
                <CardDescription>
                  Comparte el acceso con tu familia con diferentes niveles de permisos y control administrativo.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Devices Section */}
      <section className="py-12 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Compatible con Todos tus Dispositivos</h2>
            <p className="mt-4 text-muted-foreground md:text-xl max-w-3xl mx-auto">
              Conecta y controla una amplia variedad de dispositivos inteligentes desde una sola plataforma.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Iluminación</h3>
              <p className="text-sm text-muted-foreground">
                Luces inteligentes, reguladores de intensidad y sistemas de iluminación automatizada.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Seguridad</h3>
              <p className="text-sm text-muted-foreground">
                Cerraduras inteligentes, cámaras de seguridad y sensores de movimiento.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Thermometer className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Climatización</h3>
              <p className="text-sm text-muted-foreground">
                Termostatos inteligentes y sistemas de control de temperatura automatizados.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Monitoreo</h3>
              <p className="text-sm text-muted-foreground">
                Cámaras IP, sensores ambientales y sistemas de monitoreo continuo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">¿Por qué Elegir Nuestro Sistema?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Instalación Rápida</h3>
                    <p className="text-muted-foreground">
                      Configura tu sistema completo en menos de 10 minutos con nuestros códigos QR automáticos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Interfaz Intuitiva</h3>
                    <p className="text-muted-foreground">
                      Dashboard moderno y fácil de usar, diseñado para que cualquier persona pueda controlarlo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Disponible 24/7</h3>
                    <p className="text-muted-foreground">
                      Accede a tu hogar desde cualquier lugar, en cualquier momento, con total seguridad.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-12">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Testimonios</h3>
                </div>
                <blockquote className="text-center">
                  <p className="text-muted-foreground mb-4">
                    "El mejor sistema de hogar inteligente que he usado. La configuración fue súper fácil y ahora puedo
                    controlar todo desde mi teléfono. Las alertas de seguridad me dan mucha tranquilidad."
                  </p>
                  <footer className="font-semibold">— María González, Usuario Satisfecho</footer>
                </blockquote>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">¿Listo para Transformar tu Hogar?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya disfrutan de un hogar más inteligente, seguro y eficiente. Comienza tu
            prueba gratuita hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/register">
                Comenzar Prueba Gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link href="/login">Ya Tengo Cuenta</Link>
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-4">Sin compromisos • Cancela cuando quieras • Soporte 24/7</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-8 md:py-12 px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="h-6 w-6" />
                <span className="text-xl font-bold">Smart Home System</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La plataforma más completa para el control y monitoreo de hogares inteligentes.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Dispositivos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Seguridad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Precios
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Documentación
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Guías
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 Smart Home System. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Badge variant="secondary">v2.0</Badge>
              <span className="text-sm text-muted-foreground">Hecho con ❤️ para hogares inteligentes</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
