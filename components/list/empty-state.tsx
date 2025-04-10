"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface EmptyStateProps {
  activeTab: string
  onStartSearch: () => void
}

export function EmptyState({ activeTab, onStartSearch }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-12 bg-gray-800 rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-gray-400 mb-4">
        {activeTab === "all"
          ? "This list is empty. Search for movies or series to add them."
          : activeTab === "watched"
            ? "No watched items in this list yet."
            : "All items in this list are marked as watched."}
      </p>
      {activeTab === "all" && (
        <Button onClick={onStartSearch} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Search className="mr-2 h-4 w-4" />
          Find Movies & Series
        </Button>
      )}
    </motion.div>
  )
}
