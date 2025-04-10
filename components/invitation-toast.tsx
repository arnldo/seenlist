"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Mail } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import toast from "react-hot-toast"
import { getUserPendingInvitations, respondToInvitation } from "@/lib/db-service"

type Invitation = {
  listId: string
  listName: string
  invitedBy: string
  invitedByName: string
  invitedAt: string
  status: "pending" | "accepted" | "rejected"
}

export function useInvitationToasts() {
  const { user } = useUser()
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

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
      setPendingInvitations(invitationsData)

      // Show toast notifications for each invitation
      invitationsData.forEach((invitation) => {
        //showInvitationToast(invitation)
      })
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (listId: string, accept: boolean) => {
    if (!user?.email) return

    try {
      await respondToInvitation(listId, user.email, accept)

      // Update local state
      setPendingInvitations(pendingInvitations.filter((inv) => inv.listId !== listId))

      toast.success(accept ? "You are now a collaborator on this list!" : "Invitation declined")

      // Dismiss the toast
      toast.dismiss(`invitation-${listId}`)
    } catch (error: any) {
      console.error("Error processing invitation:", error)
      toast.error("Failed to process invitation")
    }
  }

  const showInvitationToast = (invitation: Invitation) => {
    // Create a custom toast with accept/decline buttons
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          id={`invitation-${invitation.listId}`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Mail className="h-10 w-10 text-purple-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">List Invitation</p>
                <p className="mt-1 text-sm text-gray-300">
                  <span className="font-semibold">{invitation.invitedByName}</span> has invited you to collaborate on{" "}
                  <span className="font-semibold">{invitation.listName}</span>
                </p>
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 border-gray-700"
                    onClick={() => handleInvitation(invitation.listId, false)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleInvitation(invitation.listId, true)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-700">
            <button
              onClick={() => toast.dismiss(`invitation-${invitation.listId}`)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { id: `invitation-${invitation.listId}`, duration: Number.POSITIVE_INFINITY },
    )
  }

  return {
    pendingCount: pendingInvitations.length,
    loading,
    refetchInvitations: fetchInvitations,
  }
}
