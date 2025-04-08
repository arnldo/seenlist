"use client"

import { useEffect } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function AuthPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="pixel-loader"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <AuthForm />
      </motion.div>
    </main>
  )
}
