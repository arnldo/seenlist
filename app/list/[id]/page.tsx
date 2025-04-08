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
  Settings,
  SortDesc,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RandomPicker } from "@/components/random-picker"
import { MovieDetailsModal } from "@/components/movie-details-modal"
import { SeriesDetailsDialog } from "@/components/series-details-dialog"
import { ShareDialog } from "@/components/share-dialog"
import { ListSettingsDialog } from "@/components/list-settings-dialog"
import { AppLayout } from "@/components/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { UserMenu } from "@/components/user-menu"
import toast from "react-hot-toast"
import { type MediaItem, type List, getList, updateList, addItemToList, deleteList } from "@/lib/db-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Define sort options
type SortOption = {
  label: string
  value: string
  sortFn: (a: MediaItem, b: MediaItem) => number
}

// Items per page for pagination
const ITEMS_PER_PAGE = 10

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showRandomPicker, setShowRandomPicker] = useState(false)
  const [showSeriesDetails, setShowSeriesDetails] = useState<string | null>(null)
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedItemDetails, setSelectedItemDetails] = useState<{ id: string; type: "movie" | "series" } | null>(null)
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({})
  const [sortOption, setSortOption] = useState<string>("unwatched-added")
  const [moviesPage, setMoviesPage] = useState(1)
  const [seriesPage, setSeriesPage] = useState(1)
  const router = useRouter()
  const { user } = useUser()

  // Define sort options with more complex sorting
  const sortOptions: SortOption[] = [
    {
      label: "Unwatched first, newest added",
      value: "unwatched-added",
      sortFn: (a, b) => {
        // First sort by watched status
        if (a.watched !== b.watched) {
          return a.watched ? 1 : -1
        }
        // Then sort by added date (assuming addedAt exists)
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0
        return dateB - dateA // Newest first
      },
    },
    {
      label: "Unwatched first, alphabetical",
      value: "unwatched-alpha",
      sortFn: (a, b) => {
        // First sort by watched status
        if (a.watched !== b.watched) {
          return a.watched ? 1 : -1
        }
        // Then sort alphabetically
        return a.title.localeCompare(b.title)
      },
    },
    {
      label: "Unwatched first, newest release",
      value: "unwatched-year",
      sortFn: (a, b) => {
        // First sort by watched status
        if (a.watched !== b.watched) {
          return a.watched ? 1 : -1
        }
        // Then sort by release year
        const yearA = Number.parseInt(a.year || "0")
        const yearB = Number.parseInt(b.year || "0")
        return yearB - yearA // Newest first
      },
    },
    {
      label: "Unwatched first, highest rated",
      value: "unwatched-rating",
      sortFn: (a, b) => {
        // First sort by watched status
        if (a.watched !== b.watched) {
          return a.watched ? 1 : -1
        }
        // Then sort by rating
        return (b.voteAverage || 0) - (a.voteAverage || 0)
      },
    },
    {
      label: "Alphabetical (A-Z)",
      value: "alpha-asc",
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      label: "Alphabetical (Z-A)",
      value: "alpha-desc",
      sortFn: (a, b) => b.title.localeCompare(a.title),
    },
    {
      label: "Release Year (Newest)",
      value: "year-desc",
      sortFn: (a, b) => Number.parseInt(b.year || "0") - Number.parseInt(a.year || "0"),
    },
    {
      label: "Release Year (Oldest)",
      value: "year-asc",
      sortFn: (a, b) => Number.parseInt(a.year || "0") - Number.parseInt(b.year || "0"),
    },
    {
      label: "Rating (Highest)",
      value: "rating-desc",
      sortFn: (a, b) => (b.voteAverage || 0) - (a.voteAverage || 0),
    },
    {
      label: "Recently Added",
      value: "added-desc",
      sortFn: (a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0
        return dateB - dateA // Newest first
      },
    },
  ]

  // Reset pagination when tab or sort changes
  useEffect(() => {
    setMoviesPage(1)
    setSeriesPage(1)
  }, [activeTab, sortOption])

  // Load list from Supabase
  useEffect(() => {
    if (user) {
      fetchList()
    }
  }, [params.id, user])

  // Fetch user display names for collaborators and items
  useEffect(() => {
    if (list) {
      fetchUserDisplayNames()
    }
  }, [list])

  const fetchUserDisplayNames = async () => {
    // Since we don't have direct access to user profiles in this demo,
    // we'll use a simplified approach to display user information
    if (!list) return

    const displayNames: Record<string, string> = {}

    // Set the owner's display name
    if (list.user_id) {
      // If the current user is the owner, use their display name
      if (user && user.id === list.user_id) {
        displayNames[list.user_id] = user.user_metadata?.display_name || user.email || "You"
      } else {
        displayNames[list.user_id] = "List Owner"
      }
    }

    // Set collaborator display names
    if (list.collaborators) {
      list.collaborators.forEach((id, index) => {
        // If the current user is a collaborator, use their display name
        if (user && user.id === id) {
          displayNames[id] = user.user_metadata?.display_name || user.email || "You"
        } else {
          displayNames[id] = `Collaborator ${index + 1}`
        }
      })
    }

    // Set display names for users who added items
    list.items.forEach((item) => {
      if (item.addedBy && !displayNames[item.addedBy]) {
        // If the current user added the item, use their display name
        if (user && user.id === item.addedBy) {
          displayNames[item.addedBy] = user.user_metadata?.display_name || user.email || "You"
        } else if (item.addedBy === list.user_id) {
          displayNames[item.addedBy] = "List Owner"
        } else {
          displayNames[item.addedBy] = "Collaborator"
        }
      }
    })

    setUserDisplayNames(displayNames)
  }

  const fetchList = async () => {
    try {
      setIsLoading(true)
      const data = await getList(params.id)

      if (!data) {
        toast.error("List not found")
        router.push("/")
        return
      }

      // Check if the list belongs to the current user or if user is a collaborator
      const isOwner = data.user_id === user?.id
      const isCollaborator = data.collaborators?.includes(user?.id || "")

      if (!isOwner && !isCollaborator) {
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

  // Delete list
  const handleDeleteList = async () => {
    try {
      await deleteList(list?.id || "")
      toast.success("List deleted successfully")
      router.push("/")
    } catch (error) {
      console.error("Error deleting list:", error)
      toast.error("Failed to delete list")
    }
  }

  // Search TMDB API
  const searchMedia = async (query: string) => {
    if (!query.trim()) return []

    setIsSearchLoading(true)
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

      // Sort by year (newest first) and then by relevance
      const sortedResults = filteredResults.sort((a: MediaItem, b: MediaItem) => {
        // First sort by year (newest first)
        const yearA = Number.parseInt(a.year || "0")
        const yearB = Number.parseInt(b.year || "0")

        if (yearB !== yearA) {
          return yearB - yearA
        }

        // If years are the same, sort by vote average (relevance)
        return (b.voteAverage || 0) - (a.voteAverage || 0)
      })

      return sortedResults || []
    } catch (error) {
      console.error("Error searching:", error)
      toast.error("Search failed. Please try again.")
      return []
    } finally {
      setIsSearchLoading(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return

    setSearchResults([])
    setIsSearching(true)
    const results = await searchMedia(searchQuery)
    setSearchResults(results)
  }

  const addToList = async (item: MediaItem) => {
    if (!list || !user) return

    // Check if item already exists in the list
    if (list.items.some((existing) => existing.id === item.id)) {
      toast.error(`"${item.title}" is already in this list.`)
      return
    }

    try {
      // Add current timestamp as addedAt
      const itemWithTimestamp = {
        ...item,
        addedAt: new Date().toISOString(),
      }

      // Use the addItemToList function that includes addedBy
      const updatedList = await addItemToList(list.id, itemWithTimestamp, user.id)
      setList(updatedList)
      toast.success(`"${item.title}" has been added to "${list.name}".`)

      // Remove the added item from search results but keep the search open
      setSearchResults(searchResults.filter((result) => result.id !== item.id))

      // Don't reset search query or close search
    } catch (error) {
      console.error("Error adding item to list:", error)
      toast.error("Failed to add item to list")
    }
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

  // View item details
  const viewItemDetails = (id: string, type: "movie" | "series") => {
    setSelectedItemDetails({ id, type })
  }

  // Filter functions
  const filteredItems = () => {
    if (!list) return []

    // Apply watched/unwatched filter
    let items = [...list.items] // Create a copy to avoid mutating the original

    switch (activeTab) {
      case "watched":
        items = items.filter((item) => item.watched)
        break
      case "unwatched":
        items = items.filter((item) => !item.watched)
        break
    }

    // Apply sorting
    const currentSortOption = sortOptions.find((option) => option.value === sortOption)
    if (currentSortOption) {
      items.sort(currentSortOption.sortFn)
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

  // Pagination for movies
  const paginatedMovies = () => {
    const movies = getMovies()
    const startIndex = (moviesPage - 1) * ITEMS_PER_PAGE
    return movies.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }

  // Pagination for series
  const paginatedSeries = () => {
    const series = getSeries()
    const startIndex = (seriesPage - 1) * ITEMS_PER_PAGE
    return series.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }

  // Calculate total pages
  const totalMoviesPages = Math.ceil(getMovies().length / ITEMS_PER_PAGE)
  const totalSeriesPages = Math.ceil(getSeries().length / ITEMS_PER_PAGE)

  // Get display name for a user
  const getDisplayName = (userId: string) => {
    return userDisplayNames[userId] || "User"
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
      <AppLayout showBackButton={true}>
        {/* Header with back button and user menu */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Link>
          <UserMenu />
        </div>

        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-purple-400 pixel-font">{list.name}</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSettingsDialog(true)}
                size="icon"
                className="bg-gray-700 hover:bg-gray-600 text-white h-10 w-10"
                title="List Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => setShowShareDialog(true)}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10"
                title="Share List"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10"
                onClick={() => setShowRandomPicker(true)}
                disabled={list.items.filter((item) => !item.watched).length === 0}
                size="icon"
                title="Random Pick"
              >
                <Shuffle className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-gray-400">
            {list.items.length} {list.items.length === 1 ? "item" : "items"} •{" "}
            {list.items.filter((item) => item.watched).length} watched
          </p>
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

        {/* Share Dialog */}
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          list={list}
          onListUpdated={(updatedList) => setList(updatedList)}
        />

        {/* List Settings Dialog */}
        <ListSettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          list={list}
          onListUpdated={(updatedList) => setList(updatedList)}
          onDeleteList={handleDeleteList}
        />

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
                disabled={isSearchLoading || !searchQuery.trim()}
              >
                {isSearchLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
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
                className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isSearchLoading ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  </div>
                ) : searchResults.length > 0 ? (
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
                            <Badge variant="outline" className="text-xs text-white bg-gray-700">
                              {item.year}
                            </Badge>
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
                    No results found. Try a different search term.
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
            <div className="flex items-center gap-2">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-700 border-gray-600 text-white">
                    <SortDesc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white max-h-[300px] overflow-y-auto">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={`${
                        sortOption === option.value ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      } cursor-pointer`}
                      onClick={() => setSortOption(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence>
                      {paginatedMovies().map((item) => (
                        <motion.div
                          key={item.id}
                          className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                            item.watched ? "border-l-4 border-l-purple-500 opacity-60" : ""
                          }`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: item.watched ? 0.7 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          layout
                          whileHover={{ y: -5, opacity: 1 }}
                        >
                          <div
                            className="relative h-[120px] cursor-pointer"
                            onClick={() => viewItemDetails(item.id, item.type)}
                          >
                            <Image
                              src={item.image || "/placeholder.svg?height=150&width=100"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
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

                            {/* Added by information */}
                            {item.addedBy && (
                              <div className="text-xs text-gray-400 mb-2">Added by: {getDisplayName(item.addedBy)}</div>
                            )}

                            <div className="flex justify-between items-center">
                              <div>
                                <Badge variant="outline" className="text-xs text-white bg-gray-700">
                                  {item.year}
                                </Badge>
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

                  {/* Pagination for Movies */}
                  {totalMoviesPages > 1 && (
                    <div className="flex justify-center items-center mt-6 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMoviesPage(Math.max(1, moviesPage - 1))}
                        disabled={moviesPage === 1}
                        className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-400">
                        Page {moviesPage} of {totalMoviesPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMoviesPage(Math.min(totalMoviesPages, moviesPage + 1))}
                        disabled={moviesPage === totalMoviesPages}
                        className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence>
                      {paginatedSeries().map((item) => (
                        <motion.div
                          key={item.id}
                          className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                            item.watched ? "border-l-4 border-l-purple-500 opacity-60" : ""
                          }`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: item.watched ? 0.7 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          layout
                          whileHover={{ y: -5, opacity: 1 }}
                        >
                          <div
                            className="relative h-[120px] cursor-pointer"
                            onClick={() => viewItemDetails(item.id, item.type)}
                          >
                            <Image
                              src={item.image || "/placeholder.svg?height=150&width=100"}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
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

                            {/* Added by information */}
                            {item.addedBy && (
                              <div className="text-xs text-gray-400 mb-2">Added by: {getDisplayName(item.addedBy)}</div>
                            )}

                            <div className="flex justify-between items-center">
                              <div>
                                <Badge variant="outline" className="text-xs text-white bg-gray-700">
                                  {item.year}
                                </Badge>
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

                  {/* Pagination for Series */}
                  {totalSeriesPages > 1 && (
                    <div className="flex justify-center items-center mt-6 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSeriesPage(Math.max(1, seriesPage - 1))}
                        disabled={seriesPage === 1}
                        className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-400">
                        Page {seriesPage} of {totalSeriesPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSeriesPage(Math.min(totalSeriesPages, seriesPage + 1))}
                        disabled={seriesPage === totalSeriesPages}
                        className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
