"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import toast from "react-hot-toast"

type UserContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: { displayName?: string; password?: string }) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)

      // Listen for auth changes
      const {
        data: { subscription },
      } = await supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }

      toast.success("Signed in successfully!")
    } catch (error: any) {
      toast.error(error.message || "Error signing in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (error) {
        throw error
      }

      toast.success("Account created! Check your email for confirmation.")
    } catch (error: any) {
      toast.error(error.message || "Error creating account")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      toast.success("Signed out successfully")
    } catch (error: any) {
      toast.error(error.message || "Error signing out")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: { displayName?: string; password?: string }) => {
    try {
      setLoading(true)

      if (updates.displayName) {
        const { error } = await supabase.auth.updateUser({
          data: { display_name: updates.displayName },
        })

        if (error) throw error
      }

      if (updates.password) {
        const { error } = await supabase.auth.updateUser({
          password: updates.password,
        })

        if (error) throw error
      }

      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Error updating profile")
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
