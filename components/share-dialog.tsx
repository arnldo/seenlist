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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, UserPlus, User, Copy } from "lucide-react"
import toast from "react-hot-toast"
import { addCollaborator, removeCollaborator, type List } from "@/lib/db-service"

type ShareDialogProps = {
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

export function ShareDialog({ open, onOpenChange, list, onListUpdated }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState("share")
  const [shareUrl, setShareUrl] = useState<string>("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate share URL when dialog opens
  useEffect(() => {
    if (open) {
      const url = `${window.location.origin}/shared-list/${list.id}`
      setShareUrl(url)

      // Also fetch collaborators if any
      if (list.collaborators?.length) {
        fetchCollaborators()
      } else {
        setCollaborators([])
      }
    }
  }, [open, list.id, list.collaborators])

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

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share link copied to clipboard")
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Share "{list.name}"</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your list with others or invite collaborators
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-gray-700 w-full">
            <TabsTrigger value="share" className="data-[state=active]:bg-purple-600 text-white">
              Share Link
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="data-[state=active]:bg-purple-600 text-white">
              Collaborators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="mt-4">
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
          </TabsContent>

          <TabsContent value="collaborators" className="mt-4">
            <div className="space-y-4">
              <form onSubmit={handleAddCollaborator} className="flex items-center gap-2">
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
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between bg-gray-700 p-2 rounded-md"
                      >
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
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
