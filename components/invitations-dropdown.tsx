"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { getUserPendingInvitations, respondToInvitation } from "@/lib/db-service"

type Invitation = {
  listId: string
  listName: string
  invitedBy: string
  invitedByName: string
  invitedAt: string
  status: "pending" | "accepted" | "rejected"
}

export function InvitationsDropdown() {
  const { user } = useUser()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) {
      fetchInvitations()
    }
  }, [user])

  const fetchInvitations = async () => {
    if (!user?.email) return

    setLoading(true)
    try {
      const invitationsData = await getUserPendingInvitations(user.email)
      setInvitations(invitationsData)
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (listId: string, accept: boolean) => {
    if (!user?.email) return

    setProcessingId(listId)
    try {
      await respondToInvitation(listId, user.email, accept)

      // Update local state
      setInvitations(invitations.filter((inv) => inv.listId !== listId))

      toast.success(accept ? "You are now a collaborator on this list!" : "Invitation declined")
    } catch (error: any) {
      console.error("Error processing invitation:", error)
      toast.error("Failed to process invitation")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-4 px-2 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-purple-400" />
        <p className="text-sm text-gray-400 mt-2">Loading invitations...</p>
      </div>
    )
  }

  if (invitations.length === 0) {
    return <div className="py-4 px-2 text-center text-gray-400 text-sm">No pending invitations</div>
  }

  return (
    <div className="py-2 max-h-[300px] overflow-y-auto">
      {invitations.map((invitation) => (
        <div key={invitation.listId} className="px-2 py-3 border-b border-gray-700 last:border-0">
          <div className="flex items-start mb-2">
            <Mail className="h-4 w-4 text-purple-400 mt-1 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-white">{invitation.listName}</p>
              <p className="text-xs text-gray-400">Invited by {invitation.invitedByName}</p>
              <p className="text-xs text-gray-400">{format(new Date(invitation.invitedAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 border-gray-700"
              onClick={() => handleInvitation(invitation.listId, false)}
              disabled={processingId === invitation.listId}
            >
              {processingId === invitation.listId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              Decline
            </Button>
            <Button
              size="sm"
              className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleInvitation(invitation.listId, true)}
              disabled={processingId === invitation.listId}
            >
              {processingId === invitation.listId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
