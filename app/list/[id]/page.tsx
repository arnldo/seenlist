"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RandomPicker } from "@/components/random-picker"
import { MovieDetailsModal } from "@/components/movie-details-modal"
import { SeriesDetailsDialog } from "@/components/series-details-dialog"
import { ShareDialog } from "@/components/share-dialog"
import { ListSettingsDialog } from "@/components/list-settings-dialog"
import { AppLayout } from "@/components/app-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@/contexts/user-context"
import { AnalyticsDialog } from "@/components/analytics-dialog"
import { RecommendationsDialog } from "@/components/recommendations-dialog"
import { ListHeader } from "@/components/list/list-header"
import { SearchSection } from "@/components/list/search-section"
import { ListControls, type SortOption } from "@/components/list/list-controls"
import { MediaListSection } from "@/components/list/media-list-section"
import { EmptyState } from "@/components/list/empty-state"

import { type MediaItem, type List, getList, updateList, addItemToList, deleteList } from "@/lib/db-service"

// Items per page for pagination
const ITEMS_PER_PAGE = 10

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showRandomPicker, setShowRandomPicker] = useState(false)
  const [showSeriesDetails, setShowSeriesDetails] = useState<string | null>(null)
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedItemDetails, setSelectedItemDetails] = useState<{ id: string; type: "movie" | "series" } | null>(null)
  const [sortOption, setSortOption] = useState<string>("unwatched-added")
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false)

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Add a ref for the search input
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Reset multi-select when changing tabs
  useEffect(() => {
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false)
      setSelectedItems([])
    }
  }, [activeTab])

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

      console.log(data)

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

  const addItemsToList = async (items: MediaItem[]) => {
    if (!list || !user || items.length === 0) return

    try {
      let updatedList = { ...list }

      for (const item of items) {
        // Check if item already exists in the list
        if (list.items.some((existing) => existing.id === item.id)) {
          toast.error(`"${item.title}" is already in this list.`)
          continue
        }

        // Fetch full details to ensure we have all the data
        const detailsResponse = await fetch(`/api/tmdb/details?id=${item.id}&type=${item.type}`)
        if (!detailsResponse.ok) {
          throw new Error("Failed to fetch item details")
        }

        const detailedItem = await detailsResponse.json()

        // Add current timestamp as addedAt
        const itemWithTimestamp = {
          ...detailedItem,
          addedAt: new Date().toISOString(),
        }

        // Use the addItemToList function that includes addedBy
        updatedList = await addItemToList(list.id, itemWithTimestamp, user.id)
      }

      setList(updatedList)
      toast.success(`${items.length} item${items.length === 1 ? "" : "s"} added to your list.`)
    } catch (error) {
      console.error("Error adding items to list:", error)
      toast.error("Failed to add items to list")
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

  // Toggle multiple items watched status
  const toggleMultipleWatched = (watched: boolean) => {
    if (!list || selectedItems.length === 0) return

    const now = new Date().toISOString()

    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        selectedItems.includes(item.id)
          ? {
              ...item,
              watched: watched,
              watchedAt: watched ? now : undefined,
            }
          : item,
      ),
    }

    saveList(updatedList)
    toast.success(
      `${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"} ${
        watched ? "marked as watched" : "marked as unwatched"
      }`,
    )

    // Clear selection after action
    setSelectedItems([])
    setIsMultiSelectMode(false)
  }

  // Toggle item selection for multi-select
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    if (isMultiSelectMode) {
      setSelectedItems([])
    }
  }

  // Select all visible items
  const selectAllVisible = () => {
    const visibleItems = filteredItems().map((item) => item.id)
    setSelectedItems(visibleItems)
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

  const handleStartSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
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
        <ListHeader
          list={list}
          onShowRandomPicker={() => setShowRandomPicker(true)}
          onShowSettings={() => setShowSettingsDialog(true)}
          onShowShare={() => setShowShareDialog(true)}
          onShowAnalytics={() => setShowAnalyticsDialog(true)}
          onShowRecommendations={() => setShowRecommendationsDialog(true)}
        />

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
          onFetchSeriesDetails={fetchSeriesDetails}
        />

        {/* Analytics Dialog */}
        <AnalyticsDialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog} list={list} />

        {/* Search Section */}
        <SearchSection onAddItems={addItemsToList} />

        {/* List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ListControls
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sortOption={sortOption}
            setSortOption={setSortOption}
            sortOptions={sortOptions}
            isMultiSelectMode={isMultiSelectMode}
            toggleMultiSelectMode={toggleMultiSelectMode}
            selectedItems={selectedItems}
            onMarkWatched={toggleMultipleWatched}
            onSelectAll={selectAllVisible}
            onClearSelection={() => setSelectedItems([])}
          />

          {filteredItems().length > 0 ? (
            <div className="space-y-8">
              {/* Movies Section */}
              <MediaListSection
                title="Movies"
                items={getMovies()}
                isMultiSelectMode={isMultiSelectMode}
                selectedItems={selectedItems}
                onToggleSelect={toggleItemSelection}
                onToggleWatched={toggleWatched}
                onDelete={confirmDeleteItem}
                onViewDetails={viewItemDetails}
                itemsPerPage={ITEMS_PER_PAGE}
              />

              {/* Series Section */}
              <MediaListSection
                title="Series"
                items={getSeries()}
                isMultiSelectMode={isMultiSelectMode}
                selectedItems={selectedItems}
                onToggleSelect={toggleItemSelection}
                onToggleWatched={toggleWatched}
                onDelete={confirmDeleteItem}
                onViewDetails={viewItemDetails}
                onShowSeriesDetails={setShowSeriesDetails}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          ) : (
            <EmptyState activeTab={activeTab} onStartSearch={handleStartSearch} />
          )}
        </motion.div>

        <RecommendationsDialog
          open={showRecommendationsDialog}
          onOpenChange={setShowRecommendationsDialog}
          list={list}
          onAddItem={(item) => addItemsToList([item])}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
