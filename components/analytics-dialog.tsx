"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { List } from "@/lib/db-service"
import { Film, Tv, Eye, EyeOff } from "lucide-react"

type AnalyticsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: List
}

type GenreCount = {
  name: string
  count: number
  percentage: number
}

type YearCount = {
  year: string
  count: number
  percentage: number
}

export function AnalyticsDialog({ open, onOpenChange, list }: AnalyticsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [genreCounts, setGenreCounts] = useState<GenreCount[]>([])
  const [yearCounts, setYearCounts] = useState<YearCount[]>([])

  useEffect(() => {
    if (open && list) {
      calculateGenreCounts()
      calculateYearCounts()
    }
  }, [open, list])

  const calculateGenreCounts = () => {
    const genreMap = new Map<string, number>()

    // Count genres
    list.items.forEach((item) => {
      item.genres.forEach((genre) => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1)
      })
    })

    // Convert to array and sort by count
    const genreArray = Array.from(genreMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: (count / list.items.length) * 100,
    }))

    genreArray.sort((a, b) => b.count - a.count)
    setGenreCounts(genreArray)
  }

  const calculateYearCounts = () => {
    const yearMap = new Map<string, number>()

    // Count years
    list.items.forEach((item) => {
      const year = item.year
      yearMap.set(year, (yearMap.get(year) || 0) + 1)
    })

    // Convert to array and sort by year
    const yearArray = Array.from(yearMap.entries()).map(([year, count]) => ({
      year,
      count,
      percentage: (count / list.items.length) * 100,
    }))

    yearArray.sort((a, b) => Number.parseInt(b.year) - Number.parseInt(a.year))
    setYearCounts(yearArray)
  }

  // Calculate basic stats
  const totalItems = list.items.length
  const movieCount = list.items.filter((item) => item.type === "movie").length
  const seriesCount = list.items.filter((item) => item.type === "series").length
  const watchedCount = list.items.filter((item) => item.watched).length
  const unwatchedCount = totalItems - watchedCount

  // Calculate average rating
  const itemsWithRating = list.items.filter((item) => item.voteAverage)
  const averageRating =
    itemsWithRating.length > 0
      ? itemsWithRating.reduce((sum, item) => sum + (item.voteAverage || 0), 0) / itemsWithRating.length
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-400 text-2xl">Analytics for "{list.name}"</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-gray-700 w-full justify-start mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="genres" className="data-[state=active]:bg-purple-600 text-white">
              Genres
            </TabsTrigger>
            <TabsTrigger value="years" className="data-[state=active]:bg-purple-600 text-white">
              Years
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Content Type */}
              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-4">Content Type</h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Film className="h-5 w-5 mr-2 text-blue-400" />
                    <span>Movies</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-400 font-bold">{movieCount}</span>
                    <span className="text-gray-400 text-sm ml-1">
                      ({((movieCount / totalItems) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded-full mb-4">
                  <div
                    className="bg-blue-400 h-4 rounded-full"
                    style={{ width: `${(movieCount / totalItems) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Tv className="h-5 w-5 mr-2 text-green-400" />
                    <span>Series</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 font-bold">{seriesCount}</span>
                    <span className="text-gray-400 text-sm ml-1">
                      ({((seriesCount / totalItems) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded-full">
                  <div
                    className="bg-green-400 h-4 rounded-full"
                    style={{ width: `${(seriesCount / totalItems) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Watch Status */}
              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-400 mb-4">Watch Status</h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-purple-400" />
                    <span>Watched</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-400 font-bold">{watchedCount}</span>
                    <span className="text-gray-400 text-sm ml-1">
                      ({((watchedCount / totalItems) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded-full mb-4">
                  <div
                    className="bg-purple-400 h-4 rounded-full"
                    style={{ width: `${(watchedCount / totalItems) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <EyeOff className="h-5 w-5 mr-2 text-yellow-400" />
                    <span>Unwatched</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400 font-bold">{unwatchedCount}</span>
                    <span className="text-gray-400 text-sm ml-1">
                      ({((unwatchedCount / totalItems) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded-full">
                  <div
                    className="bg-yellow-400 h-4 rounded-full"
                    style={{ width: `${(unwatchedCount / totalItems) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* General Stats */}
              <div className="bg-gray-750 rounded-lg p-4 md:col-span-2">
                <h3 className="text-lg font-bold text-purple-400 mb-4">General Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Total Items</div>
                    <div className="text-2xl font-bold">{totalItems}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Average Rating</div>
                    <div className="text-2xl font-bold flex items-center">
                      <span>★</span>
                      <span className="ml-1">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Oldest Item</div>
                    <div className="text-2xl font-bold">
                      {list.items.length > 0
                        ? list.items.reduce(
                            (oldest, item) =>
                              Number.parseInt(item.year) < Number.parseInt(oldest.year) ? item : oldest,
                            list.items[0],
                          ).year
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Newest Item</div>
                    <div className="text-2xl font-bold">
                      {list.items.length > 0
                        ? list.items.reduce(
                            (newest, item) =>
                              Number.parseInt(item.year) > Number.parseInt(newest.year) ? item : newest,
                            list.items[0],
                          ).year
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="genres" className="mt-0">
            <div className="bg-gray-750 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-400 mb-4">Genre Distribution</h3>
              {genreCounts.length > 0 ? (
                <div className="space-y-4">
                  {genreCounts.map((genre, index) => (
                    <div key={genre.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span>{genre.name}</span>
                        <div className="flex items-center">
                          <span className="font-bold">{genre.count}</span>
                          <span className="text-gray-400 text-sm ml-1">({genre.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 h-3 rounded-full">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-400`}
                          style={{ width: `${genre.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No genre data available</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="years" className="mt-0">
            <div className="bg-gray-750 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-400 mb-4">Release Years</h3>
              {yearCounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {yearCounts.slice(0, Math.ceil(yearCounts.length / 2)).map((year) => (
                      <div key={year.year}>
                        <div className="flex items-center justify-between mb-1">
                          <span>{year.year}</span>
                          <div className="flex items-center">
                            <span className="font-bold">{year.count}</span>
                            <span className="text-gray-400 text-sm ml-1">({year.percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 h-3 rounded-full">
                          <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${year.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {yearCounts.slice(Math.ceil(yearCounts.length / 2)).map((year) => (
                      <div key={year.year}>
                        <div className="flex items-center justify-between mb-1">
                          <span>{year.year}</span>
                          <div className="flex items-center">
                            <span className="font-bold">{year.count}</span>
                            <span className="text-gray-400 text-sm ml-1">({year.percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 h-3 rounded-full">
                          <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${year.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No year data available</div>
              )}
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
