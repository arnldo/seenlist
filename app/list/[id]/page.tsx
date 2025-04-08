"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Shuffle,
  X,
  ChevronDown,
  Share2,
  Calendar,
  Film,
  Tv,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RandomPicker } from "@/components/random-picker"
import { MovieDetailsModal } from "@/components/movie-details-modal"
import { SeriesDetailsDialog } from "@/components/series-details-dialog"
import { AppLayout } from "@/components/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import toast from "react-hot-toast"
import { type MediaItem, type List, getList, updateList } from "@/lib/db-service"

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showRandomPicker, setShowRandomPicker] = useState(false)
  const [showSeriesDetails, setShowSeriesDetails] = useState<string | null>(null)
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [selectedItemDetails, setSelectedItemDetails] = useState<{ id: string; type: "movie" | "series" } | null>(null)
  const router = useRouter()
  const { user } = useUser()

  // Load list from Supabase
  useEffect(() => {
    if (user) {
      fetchList()
    }
  }, [params.id, user])

  const fetchList = async () => {
    try {
      setIsLoading(true)
      const data = await getList(params.id)

      if (!data) {
        toast.error("List not found")
        router.push("/")
        return
      }

      // Check if the list belongs to the current user
      if (data.user_id !== user?.id) {
        toast.error("You don't have access to this list")
        router.push("/")
        return
      }

      setList(data)
    } catch (error) {
      console.error("Error fetching list:", error)
      toast.error("Failed to load list")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  // Save list to Supabase
  const saveList = async (updatedList: List) => {
    try {
      await updateList(updatedList)
      setList(updatedList)
    } catch (error) {
      console.error("Error saving list:", error)
      toast.error("Failed to save changes")
    }
  }

  // Search TMDB API
  const searchMedia = async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Search failed")
      }
      const data = await response.json()

      // Filter out items that are already in the list
      const filteredResults = data.results.filter((item: MediaItem) => {
        return !list?.items.some((existingItem) => existingItem.id === item.id)
      })

      return filteredResults || []
    } catch (error) {
      console.error("Error searching:", error)
      toast.error("Search failed. Please try again.")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return

    setIsSearching(true)
    const results = await searchMedia(searchQuery)
    setSearchResults(results)
  }

  const addToList = (item: MediaItem) => {
    if (!list) return

    // Check if item already exists in the list
    if (list.items.some((existing) => existing.id === item.id)) {
      toast.error(`"${item.title}" is already in this list.`)
      return
    }

    // Add watched property (default to false)
    const itemWithWatched = {
      ...item,
      watched: false,
    }

    const updatedList = {
      ...list,
      items: [...list.items, itemWithWatched],
    }

    saveList(updatedList)
    toast.success(`"${item.title}" has been added to "${list.name}".`)

    // Reset search after adding
    setSearchResults([])
    setSearchQuery("")
    setIsSearching(false)
  }

  const confirmDeleteItem = (itemId: string) => {
    setItemToDelete(itemId)
  }

  const removeFromList = () => {
    if (!list || !itemToDelete) return

    const itemToRemove = list.items.find((item) => item.id === itemToDelete)

    const updatedList = {
      ...list,
      items: list.items.filter((item) => item.id !== itemToDelete),
    }

    saveList(updatedList)
    toast.success(`"${itemToRemove?.title}" has been removed.`)
    setItemToDelete(null)
  }

  const toggleWatched = (itemId: string) => {
    if (!list) return

    const now = new Date().toISOString()

    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              watched: !item.watched,
              watchedAt: !item.watched ? now : undefined,
            }
          : item,
      ),
    }

    const item = list.items.find((item) => item.id === itemId)
    const newStatus = !item?.watched

    saveList(updatedList)
    toast.success(`"${item?.title}" has been ${newStatus ? "marked as watched" : "marked as unwatched"}.`)
  }

  // Fetch series details
  const fetchSeriesDetails = async (seriesId: string) => {
    setLoadingSeriesDetails(true)
    try {
      // Extract the numeric ID if it's in the format "tv-123"
      const numericId = seriesId.includes("-") ? seriesId.split("-")[1] : seriesId

      const response = await fetch(`/api/tmdb/series-details?id=${numericId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch series details")
      }

      const data = await response.json()

      // Update the list item with seasons data
      if (list) {
        const updatedItems = list.items.map((item) => {
          if (item.id === seriesId) {
            // Calculate watch progress if there are any watched episodes
            let watchedEpisodes = 0
            let totalEpisodes = 0

            const seasons = data.seasons.map((season: any) => {
              const episodes = season.episodes.map((episode: any) => {
                totalEpisodes++
                // Check if this episode was previously marked as watched
                const existingItem = list.items.find((i) => i.id === seriesId)
                const existingSeason = existingItem?.seasons?.find((s) => s.id === season.id)
                const existingEpisode = existingSeason?.episodes?.find((e) => e.id === episode.id)

                const watched = existingEpisode ? existingEpisode.watched : false
                const watchedAt = existingEpisode ? existingEpisode.watchedAt : undefined
                if (watched) watchedEpisodes++

                return {
                  ...episode,
                  watched,
                  watchedAt,
                }
              })

              return {
                ...season,
                episodes,
              }
            })

            const watchProgress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0

            return {
              ...item,
              seasons,
              watchProgress,
            }
          }
          return item
        })

        const updatedList = {
          ...list,
          items: updatedItems,
        }

        saveList(updatedList)
      }
    } catch (error) {
      console.error("Error fetching series details:", error)
      toast.error("Failed to load series details")
    } finally {
      setLoadingSeriesDetails(false)
    }
  }

  // Toggle episode watched status
  const toggleEpisodeWatched = (seriesId: string, seasonId: number, episodeId: number) => {
    if (!list) return

    const now = new Date().toISOString()

    const updatedItems = list.items.map((item) => {
      if (item.id === seriesId && item.seasons) {
        // Find the season and episode
        const updatedSeasons = item.seasons.map((season) => {
          if (season.id === seasonId) {
            const updatedEpisodes = season.episodes.map((episode) => {
              if (episode.id === episodeId) {
                const newWatchedStatus = !episode.watched
                return {
                  ...episode,
                  watched: newWatchedStatus,
                  watchedAt: newWatchedStatus ? now : undefined,
                }
              }
              return episode
            })

            return { ...season, episodes: updatedEpisodes }
          }
          return season
        })

        // Calculate new watch progress
        let watchedEpisodes = 0
        let totalEpisodes = 0

        updatedSeasons.forEach((season) => {
          season.episodes.forEach((episode) => {
            totalEpisodes++
            if (episode.watched) watchedEpisodes++
          })
        })

        const watchProgress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0
        const allWatched = watchProgress === 100

        return {
          ...item,
          seasons: updatedSeasons,
          watchProgress,
          // If all episodes are watched, mark the series as watched
          watched: allWatched,
          watchedAt: allWatched && !item.watched ? now : item.watchedAt,
        }
      }
      return item
    })

    const updatedList = {
      ...list,
      items: updatedItems,
    }

    saveList(updatedList)
  }

  // Toggle all episodes in a season
  const toggleSeasonWatched = (seriesId: string, seasonId: number, watched: boolean) => {
    if (!list) return

    const now = new Date().toISOString()

    const updatedItems = list.items.map((item) => {
      if (item.id === seriesId && item.seasons) {
        // Update all episodes in the season
        const updatedSeasons = item.seasons.map((season) => {
          if (season.id === seasonId) {
            const updatedEpisodes = season.episodes.map((episode) => {
              return {
                ...episode,
                watched,
                watchedAt: watched ? episode.watchedAt || now : undefined,
              }
            })

            return { ...season, episodes: updatedEpisodes }
          }
          return season
        })

        // Calculate new watch progress
        let watchedEpisodes = 0
        let totalEpisodes = 0

        updatedSeasons.forEach((season) => {
          season.episodes.forEach((episode) => {
            totalEpisodes++
            if (episode.watched) watchedEpisodes++
          })
        })

        const watchProgress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0
        const allWatched = watchProgress === 100

        return {
          ...item,
          seasons: updatedSeasons,
          watchProgress,
          // If all episodes are watched, mark the series as watched
          watched: allWatched,
          watchedAt: allWatched && !item.watched ? now : item.watchedAt,
        }
      }
      return item
    })

    const updatedList = {
      ...list,
      items: updatedItems,
    }

    saveList(updatedList)
    toast.success(`All episodes in the season have been ${watched ? "marked as watched" : "marked as unwatched"}.`)
  }

  // Share list function
  const shareList = () => {
    if (!list) return

    // In a real app, this would create a server-side record
    // For this demo, we'll just create a URL with the list ID
    const url = `${window.location.origin}/shared-list/${list.id}`
    setShareUrl(url)

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link has been copied to clipboard")
    })
  }

  // View item details
  const viewItemDetails = (id: string, type: "movie" | "series") => {
    setSelectedItemDetails({ id, type })
  }

  // Filter functions
  const filteredItems = () => {
    if (!list) return []

    // Apply watched/unwatched filter
    let items = list.items
    switch (activeTab) {
      case "watched":
        items = items.filter((item) => item.watched)
        break
      case "unwatched":
        items = items.filter((item) => !item.watched)
        break
    }

    return items
  }

  // Get movies and series separately
  const getMovies = () => {
    return filteredItems().filter((item) => item.type === "movie")
  }

  const getSeries = () => {
    return filteredItems().filter((item) => item.type === "series")
  }

  if (isLoading || !list) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Link>
        </motion.div>

        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-purple-400 pixel-font">{list.name}</h1>
            <Button
              onClick={shareList}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share List
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {list.items.length} {list.items.length === 1 ? "item" : "items"} •{" "}
              {list.items.filter((item) => item.watched).length} watched
            </p>

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowRandomPicker(true)}
              disabled={list.items.filter((item) => !item.watched).length === 0}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Random Pick
            </Button>
          </div>
        </motion.header>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          title="Remove Item"
          description="Are you sure you want to remove this item from your list? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={removeFromList}
          variant="destructive"
        />

        {/* Share URL Dialog */}
        <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
          <DialogContent className="bg-gray-800 border-purple-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-purple-400">Share Your List</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4 text-gray-300">Share this link with friends to show them your collection:</p>
              <div className="flex items-center gap-2 mb-4">
                <Input value={shareUrl || ""} readOnly className="bg-gray-700 border-gray-600 text-white" />
                <Button
                  onClick={() => {
                    if (shareUrl) {
                      navigator.clipboard.writeText(shareUrl)
                      toast.success("Link copied to clipboard")
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Copy
                </Button>
              </div>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button className="bg-gray-700 hover:bg-gray-600 text-white">Close</Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Random Picker */}
        <RandomPicker
          open={showRandomPicker}
          onOpenChange={setShowRandomPicker}
          items={list.items}
          onMarkWatched={toggleWatched}
          onViewDetails={viewItemDetails}
        />

        {/* Movie Details Modal */}
        <MovieDetailsModal
          open={!!selectedItemDetails}
          onOpenChange={(open) => !open && setSelectedItemDetails(null)}
          itemId={selectedItemDetails?.id || null}
          type={selectedItemDetails?.type || null}
          onMarkWatched={toggleWatched}
          isWatched={
            (!!selectedItemDetails && list.items.find((item) => item.id === selectedItemDetails.id)?.watched) || false
          }
        />

        {/* Series Details Dialog */}
        <SeriesDetailsDialog
          open={!!showSeriesDetails}
          onOpenChange={(open) => !open && setShowSeriesDetails(null)}
          seriesId={showSeriesDetails}
          list={list}
          loading={loadingSeriesDetails}
          onToggleEpisode={toggleEpisodeWatched}
          onToggleSeason={toggleSeasonWatched}
        />

        {/* Search Section */}
        <motion.div
          className="mb-8 bg-gray-800 p-4 rounded-lg pixel-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold mb-4 text-purple-400">Add Movies & Series</h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search for movies or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
              {isSearching && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsSearching(false)
                    setSearchResults([])
                    setSearchQuery("")
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isSearching && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <motion.div
                      key={item.id}
                      className="bg-gray-700 rounded-lg overflow-hidden pixel-border"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
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
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs">
                            ★ {item.voteAverage.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-white mb-1">{item.title}</h3>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-300">{item.year}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.genres.map((genre) => (
                                <Badge key={genre} variant="outline" className="text-xs text-white">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToList(item)}
                            className="bg-purple-600 hover:bg-purple-700 text-white h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Searching...
                      </div>
                    ) : (
                      "No results found. Try a different search term."
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-400">Your Collection</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-gray-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-white">
                  All
                </TabsTrigger>
                <TabsTrigger value="watched" className="data-[state=active]:bg-purple-600 text-white">
                  Watched
                </TabsTrigger>
                <TabsTrigger value="unwatched" className="data-[state=active]:bg-purple-600 text-white">
                  Unwatched
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredItems().length > 0 ? (
            <div className="space-y-8">
              {/* Movies Section */}
              {getMovies().length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <Film className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400">Movies</h3>
                    <Badge className="ml-2 bg-gray-700 text-gray-300">{getMovies().length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {getMovies().map((item) => (
                        <motion.div
                          key={item.id}
                          className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                            item.watched ? "border-l-4 border-l-purple-500" : ""
                          }`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          layout
                          whileHover={{ y: -5 }}
                          onClick={() => viewItemDetails(item.id, item.type)}
                        >
                          <div className="relative h-[150px] cursor-pointer">
                            <Image
                              src={item.image || "/placeholder.svg?height=150&width=100"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gray-900 text-white">Movie</Badge>
                            </div>
                            {item.voteAverage && (
                              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs">
                                ★ {item.voteAverage.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-white mb-1">{item.title}</h3>

                            {/* Watched date */}
                            {item.watched && item.watchedAt && (
                              <div className="flex items-center text-xs text-gray-400 mb-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                Watched on {format(new Date(item.watchedAt), "MMM d, yyyy")}
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-300">{item.year}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.genres.slice(0, 2).map((genre) => (
                                    <Badge key={genre} variant="outline" className="text-xs text-white">
                                      {genre}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleWatched(item.id)
                                  }}
                                  className={`h-8 w-8 p-0 ${
                                    item.watched
                                      ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
                                  }`}
                                >
                                  {item.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  <span className="sr-only">
                                    {item.watched ? "Mark as unwatched" : "Mark as watched"}
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteItem(item.id)
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Series Section */}
              {getSeries().length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <Tv className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400">Series</h3>
                    <Badge className="ml-2 bg-gray-700 text-gray-300">{getSeries().length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {getSeries().map((item) => (
                        <motion.div
                          key={item.id}
                          className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                            item.watched ? "border-l-4 border-l-purple-500" : ""
                          }`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          layout
                          whileHover={{ y: -5 }}
                          onClick={() => viewItemDetails(item.id, item.type)}
                        >
                          <div className="relative h-[150px] cursor-pointer">
                            <Image
                              src={item.image || "/placeholder.svg?height=150&width=100"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gray-900 text-white">Series</Badge>
                            </div>
                            {item.voteAverage && (
                              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs">
                                ★ {item.voteAverage.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-white mb-1">{item.title}</h3>

                            {/* Series progress bar */}
                            {item.type === "series" && typeof item.watchProgress === "number" && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(item.watchProgress)}%</span>
                                </div>
                                <Progress value={item.watchProgress} className="h-1" />
                              </div>
                            )}

                            {/* Watched date */}
                            {item.watched && item.watchedAt && (
                              <div className="flex items-center text-xs text-gray-400 mb-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                Watched on {format(new Date(item.watchedAt), "MMM d, yyyy")}
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-300">{item.year}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.genres.slice(0, 2).map((genre) => (
                                    <Badge key={genre} variant="outline" className="text-xs text-white">
                                      {genre}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowSeriesDetails(item.id)
                                    if (!item.seasons) {
                                      fetchSeriesDetails(item.id)
                                    }
                                  }}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">Show episodes</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleWatched(item.id)
                                  }}
                                  className={`h-8 w-8 p-0 ${
                                    item.watched
                                      ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
                                  }`}
                                >
                                  {item.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  <span className="sr-only">
                                    {item.watched ? "Mark as unwatched" : "Mark as watched"}
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteItem(item.id)
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Empty state for specific type */}
              {getMovies().length === 0 && getSeries().length === 0 && (
                <motion.div
                  className="text-center py-12 bg-gray-800 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-gray-400 mb-4">
                    {activeTab === "all"
                      ? "No items in this list yet."
                      : activeTab === "watched"
                        ? "No watched items in this list yet."
                        : "All items in this list are marked as watched."}
                  </p>
                  {activeTab === "all" && (
                    <Button
                      onClick={() => setIsSearching(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Find Movies & Series
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              className="text-center py-12 bg-gray-800 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-400 mb-4">
                {activeTab === "all"
                  ? "This list is empty. Search for movies or series to add them."
                  : activeTab === "watched"
                    ? "No watched items in this list yet."
                    : "All items in this list are marked as watched."}
              </p>
              {activeTab === "all" && (
                <Button onClick={() => setIsSearching(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Search className="mr-2 h-4 w-4" />
                  Find Movies & Series
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AppLayout>
    </ProtectedRoute>
  )
}
