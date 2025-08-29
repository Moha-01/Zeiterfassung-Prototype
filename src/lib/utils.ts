import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, differenceInMinutes, getWeek } from "date-fns"
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(isoString: string) {
  if (!isoString) return ''
  const date = parseISO(isoString)
  return format(date, "dd.MM.yyyy, HH:mm", { locale: de })
}

export function formatDate(isoString: string) {
  if (!isoString) return ''
  const date = parseISO(isoString)
  return format(date, "EEEE, dd. MMMM yyyy", { locale: de })
}

export function formatTime(isoString: string) {
  if (!isoString) return ''
  const date = parseISO(isoString)
  return format(date, "HH:mm", { locale: de })
}

export function calculateDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "0h 0m"
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  const minutes = differenceInMinutes(end, start)
  if (minutes < 0) return "0h 0m"
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function calculateDurationInHours(startTime: string, endTime: string) {
  if (!startTime || !endTime) return 0
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  const minutes = differenceInMinutes(end, start)
  return minutes > 0 ? minutes / 60 : 0
}

export function getWeekNumber(dateString: string) {
    return getWeek(parseISO(dateString), { locale: de });
}
