"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"

type SeriesDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  seriesId: string | null
  list: any
  loading: boolean
  onToggleEpisode: (seriesId: string, seasonId: number, episodeId: number) => void
  onToggleSeason: (seriesId: string, seasonId: number, watched: boolean) => void
}

export function SeriesDetailsDialog({
  open,
  onOpenChange,
  seriesId,
  list,
  loading,
  onToggleEpisode,
  onToggleSeason,
}: SeriesDetailsDialogProps) {
  if (!seriesId) return null

  const series = list.items.find((item: any) => item.id === seriesId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-purple-500 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-400">{series?.title} - Episodes</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {series?.seasons ? (
              <Accordion type="single" collapsible className="w-full">
                {series.seasons.map((season: any) => (
                  <AccordionItem key={season.id} value={`season-${season.id}`} className="border-gray-700">
                    <AccordionTrigger className="hover:text-purple-400">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>{season.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            {season.episodes.filter((ep: any) => ep.watched).length}/{season.episodes.length} watched
                          </span>
                          <Button
                            size="sm"
                            className="h-7 ml-2 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Check if all episodes are watched
                              const allWatched = season.episodes.every((ep: any) => ep.watched)
                              onToggleSeason(seriesId, season.id, !allWatched)
                            }}
                          >
                            {season.episodes.every((ep: any) => ep.watched) ? "Mark Unwatched" : "Mark Watched"}
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {season.episodes.map((episode: any) => (
                          <motion.div
                            key={episode.id}
                            className="flex items-center justify-between py-1 border-b border-gray-700"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ x: 5 }}
                          >
                            <div className="flex items-center">
                              <Checkbox
                                id={`episode-${episode.id}`}
                                checked={episode.watched}
                                onCheckedChange={() => onToggleEpisode(seriesId, season.id, episode.id)}
                                className="mr-2 data-[state=checked]:bg-purple-600"
                              />
                              <label
                                htmlFor={`episode-${episode.id}`}
                                className={`text-sm ${episode.watched ? "line-through text-gray-400" : "text-white"}`}
                              >
                                {episode.episode_number}. {episode.name}
                              </label>
                            </div>
                            {episode.watched && episode.watchedAt && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(episode.watchedAt), "MMM d, yyyy")}
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-gray-400">No season information available.</div>
            )}

            <div className="flex justify-end">
              <DialogClose asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Close</Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
