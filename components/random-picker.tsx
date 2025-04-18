"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Film, Tv, Shuffle, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import toast from "react-hot-toast"

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
  seasons?: any[]
  watchProgress?: number
}

type RandomPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: MediaItem[]
  onMarkWatched: (id: string) => void
  onViewDetails: (id: string, type: "movie" | "series") => void
}

export function RandomPicker({ open, onOpenChange, items, onMarkWatched, onViewDetails }: RandomPickerProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [searchType, setSearchType] = useState<"all" | "movie" | "series">("all")
  const [soundsLoaded, setSoundsLoaded] = useState(false)

  // Audio refs for sound effects
  const spinSoundRef = useRef<HTMLAudioElement | null>(null)
  const winSoundRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create audio elements
      spinSoundRef.current = new Audio("/sounds/spin.mp3")
      winSoundRef.current = new Audio("/sounds/win.mp3")

      // Check if sounds are loaded
      const checkSounds = () => {
        const spinLoaded = spinSoundRef.current?.readyState === 4
        const winLoaded = winSoundRef.current?.readyState === 4

        if (spinLoaded && winLoaded) {
          setSoundsLoaded(true)
        } else {
          // If sounds aren't loaded yet, we'll use a fallback approach
          // and not block the functionality
          console.log("Sound files not fully loaded, using fallback")
        }
      }

      // Set event listeners to check when sounds are loaded
      if (spinSoundRef.current) {
        spinSoundRef.current.addEventListener("canplaythrough", checkSounds)
      }
      if (winSoundRef.current) {
        winSoundRef.current.addEventListener("canplaythrough", checkSounds)
      }

      // Initial check
      checkSounds()
    }

    return () => {
      // Cleanup
      if (spinSoundRef.current) {
        spinSoundRef.current.pause()
        spinSoundRef.current = null
      }
      if (winSoundRef.current) {
        winSoundRef.current.pause()
        winSoundRef.current = null
      }
    }
  }, [])

  // Filter unwatched items
  const getUnwatchedItems = () => {
    let unwatchedItems = items.filter((item) => !item.watched)

    // Apply type filter
    if (searchType !== "all") {
      unwatchedItems = unwatchedItems.filter((item) => item.type === searchType)
    }

    return unwatchedItems
  }

  const startPicking = () => {
    const unwatchedItems = getUnwatchedItems()

    if (unwatchedItems.length === 0) {
      toast.error("No unwatched items available to pick from")
      return
    }

    setIsSpinning(true)
    setSelectedItem(null)

    // Play spin sound if loaded
    if (spinSoundRef.current && soundsLoaded) {
      spinSoundRef.current.currentTime = 0
      spinSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
    }

    // Create a visual spinning effect with multiple items
    const spinDuration = 2000 // 2 seconds
    const spinInterval = 100 // Switch items every 100ms
    let spinTimer = 0
    let currentIndex = 0

    const spinAnimation = setInterval(() => {
      currentIndex = (currentIndex + 1) % unwatchedItems.length
      setSelectedItem(unwatchedItems[currentIndex])
      spinTimer += spinInterval

      if (spinTimer >= spinDuration) {
        clearInterval(spinAnimation)

        // Final selection
        const randomIndex = Math.floor(Math.random() * unwatchedItems.length)
        const finalItem = unwatchedItems[randomIndex]
        setSelectedItem(finalItem)
        setIsSpinning(false)

        // Stop spin sound and play win sound if loaded
        if (spinSoundRef.current) {
          spinSoundRef.current.pause()
        }
        if (winSoundRef.current && soundsLoaded) {
          winSoundRef.current.currentTime = 0
          winSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
        }

        // Trigger confetti effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        toast.success(`Selected: ${finalItem.title}`)
      }
    }, spinInterval)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Random Picker</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Redesigned filter component */}
          <div className="bg-gray-750 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-400 mb-2">Filter by type:</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className={`rounded-full ${
                  searchType === "all"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
                onClick={() => setSearchType("all")}
              >
                All Types
              </Button>
              <Button
                size="sm"
                className={`rounded-full ${
                  searchType === "movie"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
                onClick={() => setSearchType("movie")}
              >
                <Film className="mr-1 h-3.5 w-3.5" />
                Movies
              </Button>
              <Button
                size="sm"
                className={`rounded-full ${
                  searchType === "series"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
                onClick={() => setSearchType("series")}
              >
                <Tv className="mr-1 h-3.5 w-3.5" />
                Series
              </Button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {getUnwatchedItems().length} unwatched{" "}
              {searchType === "movie" ? "movies" : searchType === "series" ? "series" : "items"} available
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button
              onClick={startPicking}
              disabled={isSpinning || getUnwatchedItems().length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              {isSpinning ? "Picking..." : "Pick Random!"}
            </Button>
          </div>

          {/* Picker Display */}
          <div className="relative bg-gray-700 rounded-lg p-4 h-[300px] pixel-border overflow-hidden">
            {getUnwatchedItems().length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {isSpinning ? (
                  <div className="picker-container">
                    <AnimatePresence mode="wait">
                      {selectedItem && (
                        <motion.div
                          key={`spinning-${selectedItem.id}`}
                          className="flex flex-col items-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.2, opacity: 0 }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="relative w-32 h-48 mb-2">
                            <Image
                              src={selectedItem.image || "/placeholder.svg?height=180&width=120"}
                              alt={selectedItem.title}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-white text-center">{selectedItem.title}</h3>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : selectedItem ? (
                  <motion.div
                    className="flex flex-col items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-2xl font-bold text-purple-400 mb-4">Your Selection</div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-36 flex-shrink-0">
                        <Image
                          src={selectedItem.image || "/placeholder.svg?height=180&width=120"}
                          alt={selectedItem.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <Badge className="bg-purple-600 text-white mb-2">
                          {selectedItem.type === "movie" ? "Movie" : "Series"}
                        </Badge>
                        <h3 className="text-xl font-bold text-white mb-1">{selectedItem.title}</h3>
                        <p className="text-gray-300 mb-2">{selectedItem.year}</p>
                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            onClick={startPicking}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Shuffle className="mr-2 h-3 w-3" />
                            Pick Again
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onMarkWatched(selectedItem.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            Mark as Watched
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onViewDetails(selectedItem.id, selectedItem.type)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Info className="mr-2 h-3 w-3" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Shuffle className="h-12 w-12 mb-4 text-purple-400" />
                    <p className="text-lg">
                      Click "Pick Random!" to select a random{" "}
                      {searchType === "movie" ? "movie" : searchType === "series" ? "series" : "movie or series"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No unwatched {searchType === "movie" ? "movies" : searchType === "series" ? "series" : "items"}{" "}
                available.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
