"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>Ha ocurrido un error inesperado. Por favor, intenta recargar la página.</CardDescription>
        </CardHeader>
        <CardContent>
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer mb-2">Detalles del error</summary>
            <pre className="whitespace-pre-wrap break-words bg-muted p-2 rounded text-xs">{error.message}</pre>
          </details>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar de nuevo
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
            Ir al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
