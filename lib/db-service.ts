import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"

// Update the List type to include collaborators
export type List = {
  id: string
  name: string
  user_id: string
  items: MediaItem[]
  collaborators?: string[]
  created_at?: string
}

// Update the MediaItem type to include addedBy
export type MediaItem = {
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
  addedBy?: string
}

// Lists
export async function getLists(userId: string) {
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching lists:", error)
    throw error
  }

  return data || []
}

export async function getList(id: string) {
  const { data, error } = await supabase.from("lists").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching list:", error)
    throw error
  }

  return data
}

export async function createList(userId: string, name: string) {
  const newList = {
    id: uuidv4(),
    name,
    user_id: userId,
    items: [],
  }

  const { data, error } = await supabase.from("lists").insert(newList).select()

  if (error) {
    console.error("Error creating list:", error)
    throw error
  }

  return data?.[0] || newList
}

export async function updateList(list: List) {
  const { data, error } = await supabase.from("lists").update(list).eq("id", list.id).select()

  if (error) {
    console.error("Error updating list:", error)
    throw error
  }

  return data?.[0]
}

export async function deleteList(id: string) {
  const { error } = await supabase.from("lists").delete().eq("id", id)

  if (error) {
    console.error("Error deleting list:", error)
    throw error
  }

  return true
}

// Add function to invite collaborator
export async function addCollaborator(listId: string, email: string) {
  try {
    // First get the current list
    const { data: list, error: fetchError } = await supabase.from("lists").select("*").eq("id", listId).single()

    if (fetchError) throw fetchError

    // Get user by email from auth.users instead of public.users
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .single()

    if (userError) {
      // If the user doesn't exist in auth.users, try to get from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single()

      if (profileError) {
        throw new Error("User not found")
      }

      // Use the profile ID if found
      const collaboratorId = profileData.id

      // Check if already a collaborator
      const collaborators = list.collaborators || []
      if (collaborators.includes(collaboratorId)) {
        throw new Error("User is already a collaborator")
      }

      // Add collaborator
      const updatedCollaborators = [...collaborators, collaboratorId]

      // Update the list
      const { data, error } = await supabase
        .from("lists")
        .update({ collaborators: updatedCollaborators })
        .eq("id", listId)
        .select()

      if (error) throw error

      return data?.[0]
    }

    const collaboratorId = userData.id

    // Check if already a collaborator
    const collaborators = list.collaborators || []
    if (collaborators.includes(collaboratorId)) {
      throw new Error("User is already a collaborator")
    }

    // Add collaborator
    const updatedCollaborators = [...collaborators, collaboratorId]

    // Update the list
    const { data, error } = await supabase
      .from("lists")
      .update({ collaborators: updatedCollaborators })
      .eq("id", listId)
      .select()

    if (error) throw error

    return data?.[0]
  } catch (error) {
    console.error("Error adding collaborator:", error)
    throw error
  }
}

// Add function to remove collaborator
export async function removeCollaborator(listId: string, collaboratorId: string) {
  try {
    // First get the current list
    const { data: list, error: fetchError } = await supabase.from("lists").select("*").eq("id", listId).single()

    if (fetchError) throw fetchError

    // Remove collaborator
    const collaborators = list.collaborators || []
    const updatedCollaborators = collaborators.filter((id) => id !== collaboratorId)

    // Update the list
    const { data, error } = await supabase
      .from("lists")
      .update({ collaborators: updatedCollaborators })
      .eq("id", listId)
      .select()

    if (error) throw error

    return data?.[0]
  } catch (error) {
    console.error("Error removing collaborator:", error)
    throw error
  }
}

// Items
// Update addItemToList to include addedBy
export async function addItemToList(listId: string, item: MediaItem, userId: string) {
  // First get the current list
  const { data: list, error: fetchError } = await supabase.from("lists").select("*").eq("id", listId).single()

  if (fetchError) {
    console.error("Error fetching list:", fetchError)
    throw fetchError
  }

  // Add the item to the list with addedBy
  const itemWithAddedBy = {
    ...item,
    addedBy: userId,
    watched: false,
  }

  const updatedItems = [...(list.items || []), itemWithAddedBy]

  // Update the list
  const { data, error } = await supabase.from("lists").update({ items: updatedItems }).eq("id", listId).select()

  if (error) {
    console.error("Error adding item to list:", error)
    throw error
  }

  return data?.[0]
}

export async function updateListItems(listId: string, items: MediaItem[]) {
  const { data, error } = await supabase.from("lists").update({ items }).eq("id", listId).select()

  if (error) {
    console.error("Error updating list items:", error)
    throw error
  }

  return data?.[0]
}
