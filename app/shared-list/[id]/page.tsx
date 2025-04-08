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
import { supabase } from "@/lib/supabase"

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
  addedBy?: string
}

type List = {
  id: string
  name: string
  items: MediaItem[]
  user_id: string
}

export default function SharedListPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({})
  const router = useRouter()

  // Load list from Supabase
  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data, error } = await supabase.from("lists").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          setList(data)
          fetchUserDisplayNames(data)
        } else {
          setError("List not found")
        }
      } catch (err) {
        console.error("Error fetching shared list:", err)
        setError("Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [params.id])

  // Fetch user display names for items
  const fetchUserDisplayNames = async (listData: List) => {
    // Collect all user IDs that need display names
    const userIds = new Set<string>()

    // Add list owner
    userIds.add(listData.user_id)

    // Add users who added items
    listData.items.forEach((item) => {
      if (item.addedBy) userIds.add(item.addedBy)
    })

    if (userIds.size === 0) return

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, display_name")
        .in("id", Array.from(userIds))

      if (error) throw error

      const displayNames: Record<string, string> = {}
      data?.forEach((user) => {
        displayNames[user.id] = user.display_name || user.email || "Unknown user"
      })

      setUserDisplayNames(displayNames)
    } catch (error) {
      console.error("Error fetching user display names:", error)
    }
  }

  // Get display name for a user
  const getDisplayName = (userId: string) => {
    return userDisplayNames[userId] || "Unknown user"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  if (error || !list) {
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

  // Sort items to show unwatched first
  const sortedItems = [...list.items].sort((a, b) => {
    if (a.watched === b.watched) return 0
    return a.watched ? 1 : -1
  })

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
          {list.user_id && userDisplayNames[list.user_id] && (
            <p className="text-gray-400">Created by: {userDisplayNames[list.user_id]}</p>
          )}
        </motion.header>

        {/* List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {list.items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors pixel-border ${
                    item.watched ? "border-l-4 border-l-purple-500 opacity-70" : ""
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: item.watched ? 0.7 : 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ y: -5, opacity: 1 }}
                >
                  <div className="relative h-[120px]">
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

                    {/* Added by information */}
                    {item.addedBy && (
                      <div className="text-xs text-gray-400 mb-2">Added by: {getDisplayName(item.addedBy)}</div>
                    )}

                    <div>
                      <Badge variant="outline" className="text-xs text-white bg-gray-700">
                        {item.year}
                      </Badge>
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
