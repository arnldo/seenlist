import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import md5 from "crypto-js/md5"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: string) {
  return format(new Date(date), "MMM d, yyyy")
}

// Get relative time (e.g., "2 days ago")
export function getRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Get Gravatar URL for an email
export function getGravatarUrl(email: string, size = 80) {
  const hash = md5(email.trim().toLowerCase()).toString()
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}