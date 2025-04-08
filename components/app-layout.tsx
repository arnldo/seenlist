"use client"

import type { ReactNode } from "react"
import { UserMenu } from "@/components/user-menu"

type AppLayoutProps = {
  children: ReactNode
  showBackButton?: boolean
}

export function AppLayout({ children, showBackButton = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Only render the top container if we're not showing a back button */}
      {!showBackButton && (
        <div className="container mx-auto px-4 py-3 flex justify-end items-center">
          <UserMenu />
        </div>
      )}
      <main className="container mx-auto px-4 py-4">{children}</main>
    </div>
  )
}
