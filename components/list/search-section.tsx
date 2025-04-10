"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Search, Loader2, X, Plus, Calendar, Clock, Tv, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import type { MediaItem } from "@/lib/db-service"

interface SearchSectionProps {
  onAddItems: (items: MediaItem[]) => Promise<void>
}

export function SearchSection({ onAddItems }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Multi-select for search results
  const [selectedSearchItems, setSelectedSearchItems] = useState<string[]>([])

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
      return data.results || []
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
    setSelectedSearchItems([])
  }

  const toggleSearchItemSelection = (itemId: string) => {
    if (selectedSearchItems.includes(itemId)) {
      setSelectedSearchItems(selectedSearchItems.filter((id) => id !== itemId))
    } else {
      setSelectedSearchItems([...selectedSearchItems, itemId])
    }
  }

  const handleAddSelectedItems = async () => {
    if (selectedSearchItems.length === 0) return

    const itemsToAdd = searchResults.filter((item) => selectedSearchItems.includes(item.id))
    await onAddItems(itemsToAdd)

    // Remove added items from search results
    setSearchResults(searchResults.filter((item) => !selectedSearchItems.includes(item.id)))
    setSelectedSearchItems([])
  }

  const handleAddSingleItem = async (item: MediaItem) => {
    await onAddItems([item])
    // Remove the added item from search results
    setSearchResults(searchResults.filter((result) => result.id !== item.id))
  }

  return (
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
            ref={searchInputRef}
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
            {isSearchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
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
                setSelectedSearchItems([])
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isSearchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {/* Multi-select controls */}
                {selectedSearchItems.length > 0 && (
                  <div className="flex justify-between items-center mb-4 bg-gray-750 p-2 rounded-lg">
                    <div className="text-sm text-gray-300">
                      {selectedSearchItems.length} item{selectedSearchItems.length !== 1 ? "s" : ""} selected
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddSelectedItems}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Selected
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchResults.map((item) => {
                    // Determine the number of seasons for display
                    const seasonCount = item.type === "series" ? item.number_of_seasons || 0 : 0

                    return (
                      <motion.div
                        key={item.id}
                        className={`bg-gray-700 rounded-lg overflow-hidden pixel-border cursor-pointer ${
                          selectedSearchItems.includes(item.id) ? "ring-2 ring-purple-500" : ""
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => toggleSearchItemSelection(item.id)}
                      >
                        <div className="relative h-[150px]">
                          <Image
                            src={item.image || "/placeholder.svg?height=150&width=100"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-gray-900 text-white">
                              {item.type === "movie" ? "Movie" : "Series"}
                            </Badge>
                          </div>
                          {item.voteAverage && (
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-xs">
                              ★ {item.voteAverage.toFixed(1)}
                            </div>
                          )}
                          {/* Selection indicator */}
                          <div className="absolute top-2 left-2 bg-black/70 p-1 rounded-md">
                            {selectedSearchItems.includes(item.id) ? (
                              <CheckSquare className="h-5 w-5 text-purple-400" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
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
                            {item.type === "series" && seasonCount > 0 && (
                              <div className="flex items-center">
                                <Tv className="h-3 w-3 mr-1" />
                                {seasonCount}
                                {seasonCount === 1 ? " Season" : " Seasons"}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddSingleItem(item)
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Add</span>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">No results found. Try a different search term.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
