"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Eye, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { format } from "date-fns"

type Episode = {
  id: number
  name: string
  episode_number: number
  watched: boolean
  watchedAt?: string
}

type Season = {
  id: number
  name: string
  season_number: number
  episode_count: number
  episodes: Episode[]
}

type MediaItem = {
  id: string
  tmdbId: number
  title: string
  type: "movie" | "series"
  year: string
  genres: string[]
  image: string
  overview?: string
  voteAverage?: number
  watched?: boolean
  watchedAt?: string
  seasons?: Season[]
  watchProgress?: number
}

type List = {
  id: string
  name: string
  items: MediaItem[]
}

export default function SharedListPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load list from localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem("pixelflix-lists")
    if (savedLists) {
      const lists = JSON.parse(savedLists)
      const currentList = lists.find((l: List) => l.id === params.id)
      if (currentList) {
        setList(currentList)
      } else {
        // In a real app, we would fetch the shared list from an API
        // For demo purposes, we'll just redirect to home if not found
        router.push("/")
      }
    } else {
      router.push("/")
    }
    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">List Not Found</h1>
          <p className="text-gray-400 mb-6">The list you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>

        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-lg mb-2">Shared List</div>
          <h1 className="text-3xl font-bold mb-2 text-purple-400 pixel-font">{list.name}</h1>
          <p className="text-gray-400">
            {list.items.length} {list.items.length === 1 ? "item" : "items"} •{" "}
            {list.items.filter((item) => item.watched).length} watched
          </p>
        </motion.header>

        {/* List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {list.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {list.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                    item.watched ? "border-l-4 border-l-purple-500" : ""
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
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
                    {item.watched && (
                      <div className="absolute top-2 left-2 bg-purple-600/90 px-2 py-1 rounded-md text-xs flex items-center">
                        <Eye className="h-3 w-3 mr-1" /> Watched
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

                    <div>
                      <p className="text-sm text-gray-300">{item.year}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.genres.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-12 bg-gray-800 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-400">This list is empty.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
