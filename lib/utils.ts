import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().replace(/^['\"]|['\"]$/g, '').toLowerCase()
}
