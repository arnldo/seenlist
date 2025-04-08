import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"

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
}

export type List = {
  id: string
  name: string
  user_id: string
  items: MediaItem[]
  created_at?: string
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

// Items
export async function addItemToList(listId: string, item: MediaItem) {
  // First get the current list
  const { data: list, error: fetchError } = await supabase.from("lists").select("*").eq("id", listId).single()

  if (fetchError) {
    console.error("Error fetching list:", fetchError)
    throw fetchError
  }

  // Add the item to the list
  const updatedItems = [...(list.items || []), item]

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
