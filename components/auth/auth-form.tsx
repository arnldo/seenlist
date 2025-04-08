"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const { signIn, signUp, loading } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (activeTab === "login") {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (error) {
      // Error is handled in the user context
      console.error(error)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-purple-400 pixel-font">SeenList</h1>
        <p className="text-gray-400">Your personal movie & series tracker</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-lg pixel-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6 bg-gray-700">
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600 text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-purple-600 text-white">
              Register
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
              {loading
                ? activeTab === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : activeTab === "login"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  )
}
