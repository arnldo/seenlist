"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Trash2, Settings, Share2, Film, Tv } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useUser } from "@/contexts/user-context"
import { getLists, createList, deleteList, updateList, type List } from "@/lib/db-service"
import toast from "react-hot-toast"

export function ListsOverview() {
  const [lists, setLists] = useState<List[]>([])
  const [newListName, setNewListName] = useState("")
  const [editingList, setEditingList] = useState<List | null>(null)
  const [editName, setEditName] = useState("")
  const [listToDelete, setListToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()

  // Load lists from Supabase
  useEffect(() => {
    if (user) {
      fetchLists()
    }
  }, [user])

  const fetchLists = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getLists(user.id)
      setLists(data)
    } catch (error) {
      console.error("Error fetching lists:", error)
      toast.error("Failed to load your lists")
    } finally {
      setLoading(false)
    }
  }

  const createNewList = async () => {
    if (newListName.trim() === "" || !user) return

    try {
      const newList = await createList(user.id, newListName)
      setLists([...lists, newList])
      setNewListName("")
      toast.success(`"${newListName}" has been created.`)
    } catch (error) {
      console.error("Error creating list:", error)
      toast.error("Failed to create list")
    }
  }

  const confirmDeleteList = (id: string) => {
    setListToDelete(id)
  }

  const handleDeleteList = async () => {
    if (!listToDelete) return

    const listToDeleteObj = lists.find((list) => list.id === listToDelete)

    try {
      await deleteList(listToDelete)
      setLists(lists.filter((list) => list.id !== listToDelete))
      toast.success(`"${listToDeleteObj?.name}" has been removed.`)
    } catch (error) {
      console.error("Error deleting list:", error)
      toast.error("Failed to delete list")
    } finally {
      setListToDelete(null)
    }
  }

  const startEditingList = (list: List) => {
    setEditingList(list)
    setEditName(list.name)
  }

  const saveListEdit = async () => {
    if (!editingList || editName.trim() === "") return

    try {
      const updatedList = { ...editingList, name: editName }
      await updateList(updatedList)

      setLists(lists.map((list) => (list.id === editingList.id ? updatedList : list)))
      toast.success(`List has been renamed to "${editName}".`)
    } catch (error) {
      console.error("Error updating list:", error)
      toast.error("Failed to rename list")
    } finally {
      setEditingList(null)
      setEditName("")
    }
  }

  const shareList = (list: List) => {
    // Create a shareable URL
    const shareUrl = `${window.location.origin}/shared-list/${list.id}`

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share link has been copied to clipboard")
    })
  }

  // Calculate unwatched counts for each list
  const getUnwatchedCount = (list: List) => {
    return list.items.filter((item) => !item.watched).length
  }

  // Get movie and series counts
  const getMovieCount = (list: List) => {
    return list.items.filter((item) => item.type === "movie").length
  }

  const getSeriesCount = (list: List) => {
    return list.items.filter((item) => item.type === "series").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-purple-400">Your Lists</h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white pixel-border btn-hover-effect">
              <PlusCircle className="mr-2 h-4 w-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-purple-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-purple-400">Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white btn-hover-effect"
                    onClick={createNewList}
                  >
                    Create
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Edit List Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent className="bg-gray-800 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-purple-400">Rename List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter new name..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setEditingList(null)}>
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={saveListEdit}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!listToDelete}
        onOpenChange={(open) => !open && setListToDelete(null)}
        title="Delete List"
        description="Are you sure you want to delete this list? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteList}
        variant="destructive"
      />

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {lists.length > 0 ? (
            lists.map((list, index) => (
              <motion.div
                key={list.id}
                className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700 hover:border-purple-500 transition-colors pixel-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-purple-400">{list.name}</h3>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
                      onClick={() => startEditingList(list)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                      onClick={() => shareList(list)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => confirmDeleteList(list.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                {/* List stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-750 rounded p-2 flex items-center">
                    <div className="bg-purple-900/50 rounded-full p-1.5 mr-2">
                      <Film className="h-4 w-4 text-purple-300" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">{getMovieCount(list)} Movies</div>
                      <div className="text-xs text-gray-500">
                        {list.items.filter((item) => item.type === "movie" && !item.watched).length} unwatched
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-750 rounded p-2 flex items-center">
                    <div className="bg-purple-900/50 rounded-full p-1.5 mr-2">
                      <Tv className="h-4 w-4 text-purple-300" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">{getSeriesCount(list)} Series</div>
                      <div className="text-xs text-gray-500">
                        {list.items.filter((item) => item.type === "series" && !item.watched).length} unwatched
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item previews */}
                {list.items.length > 0 ? (
                  <div className="mb-4">
                    <div className="flex space-x-1 overflow-hidden">
                      {list.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative w-16 h-24 rounded overflow-hidden">
                          <Image
                            src={item.image || "/placeholder.svg?height=96&width=64"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                          {item.watched && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="bg-purple-600 rounded-full p-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {list.items.length > 4 && (
                        <div className="relative w-16 h-24 bg-gray-750 rounded flex items-center justify-center text-gray-400">
                          +{list.items.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-gray-750 rounded mb-4 flex items-center justify-center text-gray-500">
                    No items yet
                  </div>
                )}

                <Link
                  href={`/list/${list.id}`}
                  className="block w-full text-center py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors btn-hover-effect"
                >
                  View List
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full text-center py-12 bg-gray-800 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-400 mb-4">You don't have any lists yet.</p>
              <Button
                onClick={() => document.querySelector<HTMLButtonElement>('[data-dialog-trigger="true"]')?.click()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First List
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
