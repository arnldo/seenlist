"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Mail, Calendar, Users } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import toast from "react-hot-toast"
import { getUserPendingInvitations, respondToInvitation, getLists } from "@/lib/db-service"
import { getRelativeTime } from "@/lib/utils"

type Invitation = {
  listId: string
  listName: string
  invitedBy: string
  invitedByName: string
  invitedAt: string
  status: "pending" | "accepted" | "rejected"
  itemCount?: number
  description?: string
}

export function InvitationDialog() {
  const { user } = useUser()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentInvitationIndex, setCurrentInvitationIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

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

      // If there are invitations, show the dialog
      if (invitationsData.length > 0) {
        setInvitations(invitationsData)
        setOpen(true)
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitation = async (accept: boolean) => {
    if (!user?.email || invitations.length === 0) return

    const currentInvitation = invitations[currentInvitationIndex]
    setResponding(true)

    try {
      await respondToInvitation(currentInvitation.listId, user.email, accept)

      if (accept) {
        toast.success("You are now a collaborator on this list!")

        // Refresh the lists to include the newly accepted list
        await getLists(user.id)

        // If this was the last invitation, close the dialog and redirect
        if (currentInvitationIndex === invitations.length - 1) {
          setOpen(false)
          // Redirect to the newly accepted list
          router.push(`/list/${currentInvitation.listId}`)
        } else {
          // Move to the next invitation
          setCurrentInvitationIndex(currentInvitationIndex + 1)
        }
      } else {
        toast.success("Invitation declined")

        // If this was the last invitation, close the dialog
        if (currentInvitationIndex === invitations.length - 1) {
          setOpen(false)
        } else {
          // Move to the next invitation
          setCurrentInvitationIndex(currentInvitationIndex + 1)
        }
      }

      // Remove the processed invitation
      setInvitations(invitations.filter((_, index) => index !== currentInvitationIndex))
    } catch (error: any) {
      console.error("Error processing invitation:", error)
      toast.error("Failed to process invitation")
    } finally {
      setResponding(false)
    }
  }

  // If there are no invitations or the dialog is closed, don't render anything
  if (invitations.length === 0 || !open) {
    return null
  }

  const currentInvitation = invitations[currentInvitationIndex]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-purple-400 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            List Invitation
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You have been invited to collaborate on a list
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-750 rounded-lg p-4 mb-4">
            <h3 className="text-xl font-semibold text-white mb-2">{currentInvitation.listName}</h3>

            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Users className="h-4 w-4 mr-1" />
              <span>Invited by {currentInvitation.invitedByName}</span>
            </div>

            <div className="flex items-center text-sm text-gray-400 mb-3">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Invited {getRelativeTime(currentInvitation.invitedAt)}</span>
            </div>

            {currentInvitation.description && (
              <p className="text-gray-300 text-sm mb-3">{currentInvitation.description}</p>
            )}

            {currentInvitation.itemCount !== undefined && (
              <div className="text-sm text-gray-400">This list contains {currentInvitation.itemCount} items</div>
            )}
          </div>

          <div className="text-sm text-gray-400 mb-4">
            {invitations.length > 1 && (
              <p>
                Invitation {currentInvitationIndex + 1} of {invitations.length}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            className="bg-gray-700 hover:bg-gray-600 text-white"
            onClick={() => setOpen(false)}
          >
            Decide Later
          </Button>

          <div className="flex gap-2">
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleInvitation(false)}
              disabled={responding}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleInvitation(true)}
              disabled={responding}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept & Open
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
