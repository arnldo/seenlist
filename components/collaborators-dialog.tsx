"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { addCollaborator, removeCollaborator, type List } from "@/lib/db-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, UserPlus, User } from "lucide-react"
import toast from "react-hot-toast"

type CollaboratorsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: List
  onListUpdated: (updatedList: List) => void
}

type CollaboratorUser = {
  id: string
  email: string
  display_name?: string
}

export function CollaboratorsDialog({ open, onOpenChange, list, onListUpdated }: CollaboratorsDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch collaborator details when dialog opens
  useEffect(() => {
    if (open && list.collaborators?.length) {
      fetchCollaborators()
    } else if (open) {
      setCollaborators([])
    }
  }, [open, list.collaborators])

  const fetchCollaborators = async () => {
    if (!list.collaborators?.length) {
      setCollaborators([])
      return
    }

    setLoading(true)
    try {
      // Since we don't have direct access to user profiles in this demo,
      // we'll create placeholder collaborator data
      const placeholderCollaborators: CollaboratorUser[] = list.collaborators.map((id, index) => ({
        id,
        email: `collaborator${index + 1}@example.com`,
        display_name: `Collaborator ${index + 1}`,
      }))

      setCollaborators(placeholderCollaborators)
    } catch (error) {
      console.error("Error fetching collaborators:", error)
      toast.error("Failed to load collaborators")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      const updatedList = await addCollaborator(list.id, email)
      onListUpdated(updatedList)
      setEmail("")
      toast.success("Collaborator added!")
      fetchCollaborators()
    } catch (error: any) {
      console.error("Error adding collaborator:", error)
      toast.error(error.message || "Failed to add collaborator")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoading(true)
    try {
      const updatedList = await removeCollaborator(list.id, collaboratorId)
      onListUpdated(updatedList)
      toast.success("Collaborator removed!")
      fetchCollaborators()
    } catch (error: any) {
      console.error("Error removing collaborator:", error)
      toast.error(error.message || "Failed to remove collaborator")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Manage Collaborators</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <form onSubmit={handleAddCollaborator} className="flex items-center gap-2 mb-6">
            <Input
              placeholder="Enter email address"
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
                  Add
                </>
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Current Collaborators</h3>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : collaborators.length > 0 ? (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium">{collaborator.display_name || "User"}</p>
                        <p className="text-xs text-gray-400">{collaborator.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
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

          <div className="flex justify-end mt-6">
            <DialogClose asChild>
              <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
