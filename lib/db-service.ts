import { supabase } from "./supabase"

export type MediaItem = {
  id: string
  type: "movie" | "series"
  title: string
  overview?: string
  image?: string
  backdrop?: string
  year?: string
  voteAverage?: number
  genres?: string[]
  runtime?: number
  cast?: {
    id: string
    name: string
    character: string
    profile?: string
  }[]
  watched?: boolean
  watchedAt?: string
  addedAt?: string
  addedBy?: string
  seasons?: {
    id: number
    name: string
    overview?: string
    poster_path?: string
    air_date?: string
    episodes: {
      id: number
      name: string
      overview?: string
      episode_number: number
      air_date?: string
      still_path?: string
      watched: boolean
      watchedAt?: string
    }[]
  }[]
  number_of_seasons?: number
  watchProgress?: number
}

export type Collaborator = {
  email: string
  status: "pending" | "accepted" | "rejected"
  invitedAt: string
  respondedAt?: string
  invitedBy: string
  invitedByName?: string
}

export type List = {
  id: string
  name: string
  description?: string
  user_id: string
  created_at?: string
  updated_at?: string
  items: MediaItem[]
  collaborators: Collaborator[]
  is_public?: boolean
  isOwner?: boolean
}

// Get all lists for a user
export async function getLists(userId: string) {
  try {
    // Get lists created by the user
    const { data: ownedLists, error: ownedError } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (ownedError) throw ownedError

    // Mark owned lists
    const ownedListsWithFlag =
      ownedLists?.map((list) => ({
        ...list,
        isOwner: true,
      })) || []

    // Get user's email for collaborator lookup
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData?.user?.email
    console.log('user email:', userEmail)

    if (!userEmail) {
      return ownedListsWithFlag
    }

    // Get lists where the user is a collaborator with status "accepted"
    // This query needs to match the RLS policy structure
    const { data: collaboratingLists, error: collabError } = await supabase
      .from("lists")
      .select("*")
      .not("collaborators", "is", null)
      .neq("user_id", userId)

    if (collabError) throw collabError

    // Filter collaborating lists client-side to match those where user is an accepted collaborator
    const filteredCollabLists =
      collaboratingLists?.filter((list) => {
        return list.collaborators.some((c) => typeof c === "object" && c.email === userEmail && c.status === "accepted")
      }) || []

    // Mark collaborative lists
    const collabListsWithFlag =
      filteredCollabLists.map((list) => ({
        ...list,
        isOwner: false,
      })) || []

    // Combine and sort by created_at
    const allLists = [...ownedListsWithFlag, ...collabListsWithFlag].sort(
      (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime(),
    )

    return allLists
  } catch (error) {
    console.error("Error getting lists:", error)
    throw error
  }
}

// Get a single list by ID
export async function getList(listId: string) {
  try {
    const { data, error } = await supabase.from("lists").select("*").eq("id", listId).single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error getting list:", error)
    throw error
  }
}

// Create a new list
export async function createList(userId: string, name: string, description = "") {
  try {
    const { data, error } = await supabase
      .from("lists")
      .insert([
        {
          name,
          user_id: userId,
          items: [],
          collaborators: [],
        },
      ])
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error creating list:", error)
    throw error
  }
}

// Update a list
export async function updateList(list: List) {
  try {
    const { data, error } = await supabase.from("lists").update(list).eq("id", list.id).select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error updating list:", error)
    throw error
  }
}

// Delete a list
export async function deleteList(listId: string) {
  try {
    const { error } = await supabase.from("lists").delete().eq("id", listId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting list:", error)
    throw error
  }
}

// Add an item to a list
export async function addItemToList(listId: string, item: MediaItem, userId: string) {
  try {
    // Get the current list
    const { data: list, error: listError } = await supabase.from("lists").select("*").eq("id", listId).single()

    if (listError) throw listError

    // Add the item with the user who added it
    const itemWithUser = {
      ...item,
      addedBy: userId,
      addedAt: new Date().toISOString(),
    }

    // Add the item to the list
    const updatedItems = [...list.items, itemWithUser]

    // Update the list
    const { data, error } = await supabase.from("lists").update({ items: updatedItems }).eq("id", listId).select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error adding item to list:", error)
    throw error
  }
}

// Invite a user to collaborate on a list
export async function inviteUserToList(
  listId: string,
  inviterUserId: string,
  inviterName: string,
  inviteeEmail: string,
) {
  try {
    // Get the current list
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("collaborators")
      .eq("id", listId)
      .single()

    if (listError) throw listError

    // Check if user is already invited
    const collaborators = list.collaborators || []
    const existingCollaborator = collaborators.find((c) =>
      typeof c === "string" ? c === inviteeEmail : c.email === inviteeEmail,
    )

    if (existingCollaborator) {
      throw new Error("User is already a collaborator or has a pending invitation")
    }

    // Add new collaborator with pending status
    const newCollaborator = {
      email: inviteeEmail,
      status: "pending" as const,
      invitedAt: new Date().toISOString(),
      invitedBy: inviterUserId,
      invitedByName: inviterName,
    }

    const updatedCollaborators = [...collaborators, newCollaborator]

    // Update the list
    const { data, error } = await supabase
      .from("lists")
      .update({ collaborators: updatedCollaborators })
      .eq("id", listId)
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error inviting user to list:", error)
    throw error
  }
}

// Respond to a list invitation
export async function respondToInvitation(listId: string, userEmail: string, accept: boolean) {
  try {
    // Use the API endpoint to respond to an invitation
   /* const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listId,
        email: userEmail,
        accept,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to respond to invitation: ${response.statusText}`)
    }*/

    // Get the current list
    const { data: list, error: listError } = await supabase
        .from("lists")
        .select("collaborators, user_id")
        .eq("id", listId)
        .single()

    if (listError) {
      throw listError
    }

    // Find the invitation and update its status
    const collaborators = list.collaborators || []
    const updatedCollaborators = collaborators.map((c) => {
      if (typeof c === "string") {
        // Handle old format (string emails)
        return c === userEmail
            ? {
              email: c,
              status: accept ? "accepted" : "rejected",
              invitedAt: new Date().toISOString(),
              respondedAt: new Date().toISOString(),
              invitedBy: list.user_id || "unknown",
            }
            : c
      } else if (c.email === userEmail && c.status === "pending") {
        // Handle new format (object with status)
        return {
          ...c,
          status: accept ? "accepted" : "rejected",
          respondedAt: new Date().toISOString(),
        }
      }
      return c
    })

    // Update the list
    const { data, error } = await supabase
        .from("lists")
        .update({ collaborators: updatedCollaborators })
        .eq("id", listId)
        .select()

    if (error) {
      throw error
    }

    //const result = await response.json()
    return data
  } catch (error) {
    console.error("Error responding to invitation:", error)
    throw error
  }
}

// Remove a collaborator from a list
export async function removeCollaborator(listId: string, collaboratorEmail: string) {
  try {
    // Get the current list
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("collaborators")
      .eq("id", listId)
      .single()

    if (listError) throw listError

    // Remove the collaborator
    const collaborators = list.collaborators || []
    const updatedCollaborators = collaborators.filter((c) =>
      typeof c === "string" ? c !== collaboratorEmail : c.email !== collaboratorEmail,
    )

    // Update the list
    const { data, error } = await supabase
      .from("lists")
      .update({ collaborators: updatedCollaborators })
      .eq("id", listId)
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error removing collaborator:", error)
    throw error
  }
}

// Get pending invitations for a user
export async function getUserPendingInvitations(userEmail: string) {
  try {
          // Get all lists
          const { data: lists, error } = await supabase
          .from("lists")
          .select("id, name, user_id, collaborators, created_at, items")
  
        if (error) throw error
  
        // Filter for pending invitations client-side
        const pendingInvitations = lists
          .filter((list) => {
            return (
              list.collaborators &&
              list.collaborators.some((c) => typeof c === "object" && c.email === userEmail && c.status === "pending")
            )
          })
          .map((list) => {
            const invitation = list.collaborators.find(
              (c) => typeof c === "object" && c.email === userEmail && c.status === "pending",
            )
            return {
              listId: list.id,
              listName: list.name,
              invitedBy: invitation.invitedBy,
              invitedByName: invitation.invitedByName || "Unknown user",
              invitedAt: invitation.invitedAt,
              status: invitation.status,
              itemCount: list.items?.length || 0,
            }
          })
    // Use the new API endpoint to get pending invitations
    const response = await fetch(`/api/invitations?email=${encodeURIComponent(userEmail)}`)

    if (!response.ok) {
      //throw new Error(`Failed to fetch invitations: ${response.statusText}`)
    }

    //const invitations = await response.json()
    return pendingInvitations
  } catch (error) {
    console.error("Error getting user invitations:", error)
    throw error
  }
}
