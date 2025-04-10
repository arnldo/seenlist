"use client"
import Link from "next/link"
import { ArrowLeft, Settings, Share2, Shuffle, Sparkles, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { UserMenu } from "@/components/user-menu"
import { getRelativeTime } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import type { List } from "@/lib/db-service"

interface ListHeaderProps {
  list: List
  onShowRandomPicker: () => void
  onShowSettings: () => void
  onShowShare: () => void
  onShowAnalytics: () => void
  onShowRecommendations: () => void
}

export function ListHeader({
  list,
  onShowRandomPicker,
  onShowSettings,
  onShowShare,
  onShowAnalytics,
  onShowRecommendations,
}: ListHeaderProps) {
  const { user } = useUser()
  // Check if the current user is the owner of the list
  const isOwner = list.user_id === user?.id

  return (
    <>
      {/* Header with back button and user menu */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lists
        </Link>
        <UserMenu />
      </div>

      {/* Header with list name and actions */}
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-purple-400 pixel-font">{list.name}</h1>
          <div className="flex gap-2">
            <Button
              onClick={onShowRecommendations}
              size="icon"
              className="bg-gray-700 hover:bg-gray-600 text-white h-10 w-10"
              title="Get Recommendations"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
            <Button
              onClick={onShowAnalytics}
              size="icon"
              className="bg-gray-700 hover:bg-gray-600 text-white h-10 w-10"
              title="Analytics"
            >
              <BarChart2 className="h-5 w-5" />
            </Button>

            {/* Only show settings button to the owner */}
            {isOwner && (
              <Button
                onClick={onShowSettings}
                size="icon"
                className="bg-gray-700 hover:bg-gray-600 text-white h-10 w-10"
                title="List Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            {/* Only show share button to the owner */}
            {isOwner && (
              <Button
                onClick={onShowShare}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10"
                title="Share List"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            )}

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10"
              onClick={onShowRandomPicker}
              disabled={list.items.filter((item) => !item.watched).length === 0}
              size="icon"
              title="Random Pick"
            >
              <Shuffle className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-gray-400">
            {list.items.length} {list.items.length === 1 ? "item" : "items"} •{" "}
            {list.items.filter((item) => item.watched).length} watched
          </p>
          {list.created_at && <p className="text-sm text-gray-400">Created {getRelativeTime(list.created_at)}</p>}
          {!isOwner && <p className="text-sm text-purple-400">You are a collaborator on this list</p>}
        </div>
      </motion.header>
    </>
  )
}
