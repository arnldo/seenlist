"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "default" | "destructive"
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white">
        <DialogHeader>
          <DialogTitle className={variant === "destructive" ? "text-red-400" : "text-purple-400"}>{title}</DialogTitle>
          <DialogDescription className="text-gray-300">{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
