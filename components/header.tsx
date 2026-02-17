import { SettingsIcon } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart Home Control</h1>
            <p className="text-muted-foreground text-sm mt-1">Controla todos tus dispositivos desde un solo lugar</p>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <SettingsIcon className="w-6 h-6 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
