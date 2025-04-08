"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Star, Clock, Film } from "lucide-react"
import toast from "react-hot-toast"

type Cast = {
  id: number
  name: string
  character: string
  profile_path: string | null
}

type Video = {
  id: string
  key: string
  name: string
  site: string
  type: string
}

type MovieDetailsProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string | null
  type: "movie" | "series" | null
  onMarkWatched: (id: string) => void
  isWatched: boolean
}

export function MovieDetailsModal({ open, onOpenChange, itemId, type, onMarkWatched, isWatched }: MovieDetailsProps) {
  const [details, setDetails] = useState<any>(null)
  const [cast, setCast] = useState<Cast[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (open && itemId && type) {
      fetchDetails()
    }
  }, [open, itemId, type])

  const fetchDetails = async () => {
    if (!itemId || !type) return

    setLoading(true)
    try {
      // Extract the numeric ID if it's in the format "movie-123" or "tv-123"
      const numericId = itemId.includes("-") ? itemId.split("-")[1] : itemId

      // Fetch details
      const detailsResponse = await fetch(`/api/tmdb/details?id=${numericId}&type=${type}`)
      const detailsData = await detailsResponse.json()
      setDetails(detailsData)

      // Fetch cast
      const castResponse = await fetch(`/api/tmdb/credits?id=${numericId}&type=${type}`)
      const castData = await castResponse.json()
      setCast(castData.cast || [])

      // Fetch videos
      const videosResponse = await fetch(`/api/tmdb/videos?id=${numericId}&type=${type}`)
      const videosData = await videosResponse.json()
      setVideos(videosData.results || [])
    } catch (error) {
      console.error("Error fetching details:", error)
      toast.error("Failed to load details")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkWatched = () => {
    if (itemId) {
      onMarkWatched(itemId)
    }
  }

  // Get trailer
  const getTrailer = () => {
    return videos.find((video) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"))
  }

  const trailer = getTrailer()

  if (!details) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="pixel-loader"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-400 text-2xl">
            {details.title}
            <span className="text-gray-400 ml-2 text-lg">({details.year})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[300px] mt-4 rounded-lg overflow-hidden">
          <Image
            src={details.backdrop || "/placeholder.svg?height=300&width=800"}
            alt={details.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>

          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            {details.voteAverage && (
              <Badge className="bg-yellow-600 text-white">
                <Star className="h-3 w-3 mr-1" />
                {details.voteAverage.toFixed(1)}
              </Badge>
            )}
            <Badge className="bg-purple-600 text-white">
              {type === "movie" ? <Film className="h-3 w-3 mr-1" /> : null}
              {type === "movie" ? "Movie" : "Series"}
            </Badge>
            {details.runtime && (
              <Badge className="bg-blue-600 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {details.runtime} min
              </Badge>
            )}
            {details.seasons && (
              <Badge className="bg-green-600 text-white">
                {details.seasons} {details.seasons === 1 ? "Season" : "Seasons"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex mt-4 gap-4">
          <div className="w-1/3 md:w-1/4">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
              <Image
                src={details.image || "/placeholder.svg?height=300&width=200"}
                alt={details.title}
                fill
                className="object-cover"
              />
            </div>
            <Button
              onClick={handleMarkWatched}
              className={`w-full mt-4 ${
                isWatched ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isWatched ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Mark as Unwatched
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Watched
                </>
              )}
            </Button>
          </div>

          <div className="w-2/3 md:w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-700 w-full justify-start mb-4">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cast" className="data-[state=active]:bg-purple-600 text-white">
                  Cast
                </TabsTrigger>
                {trailer && (
                  <TabsTrigger value="trailer" className="data-[state=active]:bg-purple-600 text-white">
                    Trailer
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  <p className="text-gray-300">{details.overview}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {details.genres.map((genre: string) => (
                      <Badge key={genre} variant="outline" className="text-white">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cast" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {cast.slice(0, 8).map((person) => (
                    <div key={person.id} className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="relative w-full h-40">
                        <Image
                          src={
                            person.profile_path
                              ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
                              : "/placeholder.svg?height=160&width=120"
                          }
                          alt={person.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="font-bold text-sm">{person.name}</p>
                        <p className="text-xs text-gray-400">{person.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {cast.length > 8 && (
                  <p className="text-center mt-4 text-gray-400">+ {cast.length - 8} more cast members</p>
                )}
              </TabsContent>

              {trailer && (
                <TabsContent value="trailer" className="mt-0">
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title={trailer.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    ></iframe>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
