import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getDeviceTypeIcon(type: string | null) {
  switch (type) {
    case "camera":
      return "camera"
    case "lock":
      return "lock"
    case "door_sensor":
      return "door-open"
    case "motion_sensor":
      return "activity"
    case "thermostat":
      return "thermometer"
    case "light":
      return "lightbulb"
    case "alarm":
      return "bell-ring"
    default:
      return "device-mobile"
  }
}

export function getAlertSeverityColor(severity: string) {
  switch (severity) {
    case "high":
      return "destructive"
    case "medium":
      return "default"
    case "low":
      return "secondary"
    default:
      return "default"
  }
}
