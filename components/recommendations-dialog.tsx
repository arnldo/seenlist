"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Star, Calendar, Clock, Tv } from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"
import type { MediaItem, List } from "@/lib/db-service"

type RecommendationsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: List
  onAddItem: (item: MediaItem) => Promise<void>
}

export function RecommendationsDialog({ open, onOpenChange, list, onAddItem }: RecommendationsDialogProps) {
  const [activeTab, setActiveTab] = useState<"similar" | "trending">("similar")
  const [recommendations, setRecommendations] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [addingItem, setAddingItem] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchRecommendations()
    }
  }, [open, activeTab])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      // In a real app, you would fetch from your API
      // For now, we'll simulate recommendations based on the list

      // Get a random item from the list to base recommendations on
      const watchedItems = list.items.filter((item) => item.watched)
      const baseItem =
        watchedItems.length > 0
          ? watchedItems[Math.floor(Math.random() * watchedItems.length)]
          : list.items[Math.floor(Math.random() * list.items.length)]

      if (!baseItem) {
        setRecommendations([])
        return
      }

      // Fetch recommendations
      let endpoint = ""
      if (activeTab === "similar") {
        endpoint = `/api/tmdb/recommendations?id=${baseItem.tmdbId}&type=${baseItem.type}`
      } else {
        endpoint = `/api/tmdb/trending?type=${baseItem.type}`
      }

      const response = await fetch(endpoint)
      if (!response.ok) throw new Error("Failed to fetch recommendations")

      const data = await response.json()

      // Filter out items already in the list
      const filteredRecommendations = data.results.filter(
        (item: MediaItem) => !list.items.some((existingItem) => existingItem.id === item.id),
      )

      setRecommendations(filteredRecommendations.slice(0, 12))
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      toast.error("Failed to load recommendations")
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (item: MediaItem) => {
    setAddingItem(item.id)
    try {
      await onAddItem(item)
      toast.success(`Added "${item.title}" to your list`)

      // Remove the item from recommendations
      setRecommendations(recommendations.filter((rec) => rec.id !== item.id))
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error("Failed to add item to list")
    } finally {
      setAddingItem(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Recommendations for You</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "similar" | "trending")}>
          <TabsList className="bg-gray-700 mb-4">
            <TabsTrigger value="similar" className="data-[state=active]:bg-purple-600 text-white">
              Based on Your List
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-purple-600 text-white">
              Trending Now
            </TabsTrigger>
          </TabsList>

          <TabsContent value="similar" className="mt-0">
            {renderRecommendations()}
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            {renderRecommendations()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={() => fetchRecommendations()} className="mr-2 bg-gray-700 hover:bg-gray-600 text-white">
            Refresh
          </Button>
          <DialogClose asChild>
            <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )

  function renderRecommendations() {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      )
    }

    if (recommendations.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <p>No recommendations available.</p>
          <p className="mt-2 text-sm">Try adding more items to your list or switch to trending.</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendations.map((item) => (
          <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden">
            <div className="relative h-[150px]">
              <Image
                src={item.image || "/placeholder.svg?height=150&width=100"}
                alt={item.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-gray-900 text-white">{item.type === "movie" ? "Movie" : "Series"}</Badge>
              </div>
              {item.voteAverage && (
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs flex items-center">
                  <Star className="h-3 w-3 mr-1 text-yellow-400" />
                  {item.voteAverage.toFixed(1)}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-white mb-1">{item.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {item.year}
                </div>
                {item.type === "movie" && item.runtime && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {item.runtime} min
                  </div>
                )}
                {item.type === "series" && (item.seasons || item.number_of_seasons) && (
                  <div className="flex items-center">
                    <Tv className="h-3 w-3 mr-1" />
                    {item.seasons?.length || item.number_of_seasons || 0}{" "}
                    {(item.seasons?.length || item.number_of_seasons || 0) === 1 ? "Season" : "Seasons"}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleAddItem(item)}
                  disabled={addingItem === item.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-8 w-8 p-0"
                >
                  {addingItem === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span className="sr-only">Add</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
}
