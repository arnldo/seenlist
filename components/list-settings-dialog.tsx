"use client"

import { useState } from "react"
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
import { Trash2, Save } from "lucide-react"
import toast from "react-hot-toast"
import { updateList, type List } from "@/lib/db-service"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type ListSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: List
  onListUpdated: (updatedList: List) => void
  onDeleteList: () => void
}

export function ListSettingsDialog({ open, onOpenChange, list, onListUpdated, onDeleteList }: ListSettingsDialogProps) {
  const [listName, setListName] = useState(list.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async () => {
    if (!listName.trim() || listName === list.name) return

    setIsSubmitting(true)
    try {
      const updatedList = { ...list, name: listName }
      await updateList(updatedList)
      onListUpdated(updatedList)
      toast.success("List name updated successfully")
    } catch (error) {
      console.error("Error updating list:", error)
      toast.error("Failed to update list name")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-800 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-purple-400">List Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your list settings or delete the list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label htmlFor="listName" className="text-sm font-medium text-gray-300">
                List Name
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white flex-1"
                />
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting || !listName.trim() || listName === list.name}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Once you delete a list, it cannot be recovered. Please be certain.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete List
              </Button>
            </div>

            <div className="flex justify-end mt-6">
              <DialogClose asChild>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete List"
        description="Are you sure you want to delete this list? This action cannot be undone and all items in the list will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDeleteList()
        }}
        variant="destructive"
      />
    </>
  )
}
