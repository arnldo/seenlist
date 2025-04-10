"use client"
import { useInvitationToasts } from "./invitation-toast"

export function InvitationToastProvider() {
  // This component doesn't render anything visible
  // It just initializes the invitation toast system
  useInvitationToasts()

  return null
}
