"use client"

import { useState, useEffect, useCallback } from "react"

type ToastType = "default" | "success" | "destructive"

type Toast = {
  id: string
  title: string
  description?: string
  variant?: ToastType
}

type ToastOptions = {
  title: string
  description?: string
  variant?: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default", duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant }

    setToasts((prevToasts) => [...prevToasts, newToast])

    // Auto dismiss
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  // Create a container for toasts if it doesn't exist
  useEffect(() => {
    let container = document.getElementById("toast-container")

    if (!container) {
      container = document.createElement("div")
      container.id = "toast-container"
      container.className = "toast-container"
      document.body.appendChild(container)
    }

    // Render toasts
    const renderToasts = () => {
      if (!container) return

      container.innerHTML = ""

      toasts.forEach((toast) => {
        const toastElement = document.createElement("div")
        toastElement.className = `toast ${toast.variant === "destructive" ? "toast-error" : "toast-success"}`

        const iconElement = document.createElement("div")
        iconElement.className = "toast-icon"
        iconElement.innerHTML =
          toast.variant === "destructive"
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'

        const contentElement = document.createElement("div")
        contentElement.className = "toast-content"

        const titleElement = document.createElement("div")
        titleElement.className = "toast-title"
        titleElement.textContent = toast.title

        contentElement.appendChild(titleElement)

        if (toast.description) {
          const descriptionElement = document.createElement("div")
          descriptionElement.className = "toast-message"
          descriptionElement.textContent = toast.description
          contentElement.appendChild(descriptionElement)
        }

        toastElement.appendChild(iconElement)
        toastElement.appendChild(contentElement)

        // Add click handler to dismiss
        toastElement.addEventListener("click", () => {
          dismiss(toast.id)
        })

        container.appendChild(toastElement)
      })
    }

    renderToasts()

    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, [toasts, dismiss])

  return { toast, dismiss }
}
