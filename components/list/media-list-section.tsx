"use client"

import { useState } from "react"
import { Film, Tv, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatePresence } from "framer-motion"
import { MediaItemCard } from "./media-item-card"
import type { MediaItem } from "@/lib/db-service"

interface MediaListSectionProps {
  title: "Movies" | "Series"
  items: MediaItem[]
  isMultiSelectMode: boolean
  selectedItems: string[]
  onToggleSelect: (id: string) => void
  onToggleWatched: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (id: string, type: "movie" | "series") => void
  onShowSeriesDetails?: (id: string) => void
  itemsPerPage?: number
}

export function MediaListSection({
  title,
  items,
  isMultiSelectMode,
  selectedItems,
  onToggleSelect,
  onToggleWatched,
  onDelete,
  onViewDetails,
  onShowSeriesDetails,
  itemsPerPage = 10,
}: MediaListSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage)

  const icon =
    title === "Movies" ? (
      <Film className="h-5 w-5 mr-2 text-purple-400" />
    ) : (
      <Tv className="h-5 w-5 mr-2 text-purple-400" />
    )

  if (items.length === 0) return null

  return (
    <div>
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-bold text-purple-400">{title}</h3>
        <Badge className="ml-2 bg-gray-700 text-gray-300">{items.length}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnimatePresence>
          {paginatedItems.map((item) => (
            <MediaItemCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              isMultiSelectMode={isMultiSelectMode}
              onToggleSelect={onToggleSelect}
              onToggleWatched={onToggleWatched}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onShowSeriesDetails={title === "Series" ? onShowSeriesDetails : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-700 border-gray-600 text-white h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
