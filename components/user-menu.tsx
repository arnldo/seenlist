"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, UserIcon } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import toast from "react-hot-toast"
import { getGravatarUrl } from "@/lib/utils"
import { useInvitationToasts } from "./invitation-toast"

export function UserMenu() {
  const { user, signOut } = useUser()
  const router = useRouter()
  const { pendingCount } = useInvitationToasts()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Get display name or username from email
  const getDisplayName = () => {
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name
    if (user?.email) {
      // Extract username from email
      const username = user.email.split("@")[0]
      return username.charAt(0).toUpperCase() + username.slice(1)
    }
    return "User"
  }

  if (!user) {
    return (
      <Button onClick={() => router.push("/login")} className="bg-purple-600 hover:bg-purple-700 text-white">
        Sign In
      </Button>
    )
  }

  // Get Gravatar URL
  const avatarUrl = user.email ? getGravatarUrl(user.email) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={avatarUrl || ""} alt={getDisplayName()} />
            <AvatarFallback className="bg-purple-600 text-white">{getInitials(getDisplayName())}</AvatarFallback>
          </Avatar>
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {pendingCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700 text-white">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-gray-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-white hover:bg-gray-700 cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <UserIcon className="mr-2 h-4 w-4 text-purple-400" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4 text-purple-400" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
