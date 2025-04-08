"use client"

import { useEffect } from "react"
import { ListsOverview } from "@/components/lists-overview"
import { AppLayout } from "@/components/app-layout"
import { motion } from "framer-motion"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-purple-400 pixel-font animate-pulse-slow">SeenList</h1>
        <p className="text-gray-400">Create and manage your movie & series collections</p>
      </motion.div>

      <div className="grid gap-6">
        <ListsOverview />
      </div>
    </AppLayout>
  )
}
