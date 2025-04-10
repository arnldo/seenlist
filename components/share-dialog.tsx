"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, UserPlus, User, Copy, LinkIcon, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import { type List, inviteUserToList, removeCollaborator } from "@/lib/db-service"
import { useUser } from "@/contexts/user-context"

type ShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: List
  onListUpdated: (updatedList: List) => void
}

export function ShareDialog({ open, onOpenChange, list, onListUpdated }: ShareDialogProps) {
  const { user } = useUser()
  const [activeSection, setActiveSection] = useState<"share" | "collaborators">("share")
  const [shareUrl, setShareUrl] = useState<string>("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if the current user is the owner of the list
  const isOwner = list.isOwner === true

  // Generate share URL when dialog opens
  useEffect(() => {
    if (open) {
      const url = `${window.location.origin}/shared-list/${list.id}`
      setShareUrl(url)
    }
  }, [open, list.id])

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !user || !isOwner) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Get the display name of the current user
      const displayName = user.user_metadata?.display_name || user.email || "Unknown user"

      // Invite the user
      const updatedList = await inviteUserToList(list.id, user.id, displayName, email)

      onListUpdated(updatedList)
      setEmail("")
      toast.success("Invitation sent!")
    } catch (error: any) {
      console.error("Error adding collaborator:", error)
      setError(error.message || "Failed to add collaborator")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    if (!isOwner) return

    try {
      const updatedList = await removeCollaborator(list.id, collaboratorEmail)

      onListUpdated(updatedList)
      toast.success("Collaborator removed!")
    } catch (error: any) {
      console.error("Error removing collaborator:", error)
      toast.error(error.message || "Failed to remove collaborator")
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share link copied to clipboard")
    })
  }

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center text-yellow-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </div>
        )
      case "accepted":
        return (
          <div className="flex items-center text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
          </div>
        )
      case "rejected":
        return (
          <div className="flex items-center text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Share "{list.name}"</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your list with others{isOwner ? " or invite collaborators" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Navigation - only show collaborators tab to the owner */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`flex items-center px-4 py-3 ${
              activeSection === "share"
                ? "text-purple-400 border-b-2 border-purple-400 font-medium"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveSection("share")}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Share Link
          </button>

          {isOwner && (
            <button
              className={`flex items-center px-4 py-3 ${
                activeSection === "collaborators"
                  ? "text-purple-400 border-b-2 border-purple-400 font-medium"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveSection("collaborators")}
            >
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </button>
          )}
        </div>

        {activeSection === "share" && (
          <div className="space-y-4">
            <p className="text-gray-300">Share this link with friends to show them your collection:</p>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="bg-gray-700 border-gray-600 text-white" />
              <Button onClick={copyShareLink} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="pt-4 text-sm text-gray-400">
              <p>Anyone with this link can view your list, but only collaborators can edit it.</p>
            </div>
          </div>
        )}

        {activeSection === "collaborators" && isOwner && (
          <div className="space-y-4">
            <form onSubmit={handleAddCollaborator} className="flex items-center gap-2">
              <Input
                placeholder="Enter email address to invite"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white flex-1"
              />
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded-md text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Collaborators & Invitations</h3>

              {list.collaborators && list.collaborators.length > 0 ? (
                <div className="space-y-2">
                  {list.collaborators.map((collaborator) => (
                    <div
                      key={typeof collaborator === "string" ? collaborator : collaborator.email}
                      className="flex items-center justify-between bg-gray-700 p-2 rounded-md"
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium">
                            {typeof collaborator === "string" ? collaborator : collaborator.email}
                          </p>
                          {typeof collaborator !== "string" && getStatusBadge(collaborator.status)}
                          {typeof collaborator !== "string" &&
                            collaborator.status === "pending" &&
                            collaborator.invitedAt && (
                              <p className="text-xs text-gray-400">
                                Invited {new Date(collaborator.invitedAt).toLocaleDateString()}
                              </p>
                            )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveCollaborator(typeof collaborator === "string" ? collaborator : collaborator.email)
                        }
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-2">No collaborators yet</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
