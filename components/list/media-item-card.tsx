"use client"
import Image from "next/image"
import { Eye, EyeOff, Trash2, ChevronDown, Calendar, Clock, Tv, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { format } from "date-fns"
import type { MediaItem } from "@/lib/db-service"

interface MediaItemCardProps {
  item: MediaItem
  isSelected?: boolean
  isMultiSelectMode?: boolean
  onToggleSelect?: (id: string) => void
  onToggleWatched?: (id: string) => void
  onDelete?: (id: string) => void
  onViewDetails?: (id: string, type: "movie" | "series") => void
  onShowSeriesDetails?: (id: string) => void
}

export function MediaItemCard({
  item,
  isSelected = false,
  isMultiSelectMode = false,
  onToggleSelect,
  onToggleWatched,
  onDelete,
  onViewDetails,
  onShowSeriesDetails,
}: MediaItemCardProps) {
  // Determine the number of seasons for display
  const seasonCount = item.type === "series" ? item.seasons?.length || item.number_of_seasons || 0 : 0

  return (
    <motion.div
      className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
        item.watched ? "border-l-4 border-l-purple-500 opacity-60" : ""
      } ${isSelected ? "ring-2 ring-purple-500" : ""}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: item.watched ? 0.7 : 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      layout
      whileHover={{ y: -5, opacity: 1 }}
      onClick={() => (isMultiSelectMode ? onToggleSelect?.(item.id) : onViewDetails?.(item.id, item.type))}
    >
      <div className="relative h-[120px]">
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
        {/* Show checkbox in multi-select mode */}
        {isMultiSelectMode && (
          <div className="absolute top-2 left-2 bg-black/70 p-1 rounded-md">
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-purple-400" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
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

        {/* Year and runtime/seasons in a single row */}
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

        {!isMultiSelectMode && (
          <div className="flex justify-end items-center">
            <div className="flex space-x-1">
              {item.type === "series" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowSeriesDetails?.(item.id)
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Show episodes</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleWatched?.(item.id)
                }}
                className={`h-8 w-8 p-0 ${
                  item.watched
                    ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
                }`}
              >
                {item.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="sr-only">{item.watched ? "Mark as unwatched" : "Mark as watched"}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(item.id)
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
