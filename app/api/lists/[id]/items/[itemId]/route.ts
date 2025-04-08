import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In a real app, this would be a database
// For this demo, we'll use a simple in-memory store
const users: any[] = []
const lists: any[] = []

// Helper function to get the current user
function getCurrentUser() {
  const sessionId = cookies().get("session_id")?.value
  if (!sessionId) return null

  // In a real app, we would look up the session in a database
  // For this demo, we'll just return a mock user
  return users.find((user) => user.id === "mock-user-id")
}

// PUT /api/lists/[id]/items/[itemId] - Update an item in a list
export async function PUT(request: Request, { params }: { params: { id: string; itemId: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const listIndex = lists.findIndex((list) => list.id === params.id)

  if (listIndex === -1) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  // Check if the list belongs to the current user
  if (lists[listIndex].userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Find the item in the list
  const itemIndex = lists[listIndex].items.findIndex((item: any) => item.id === params.itemId)

  if (itemIndex === -1) {
    return NextResponse.json({ error: "Item not found in the list" }, { status: 404 })
  }

  try {
    const updates = await request.json()

    // Update the item
    lists[listIndex].items[itemIndex] = {
      ...lists[listIndex].items[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    lists[listIndex].updatedAt = new Date().toISOString()

    return NextResponse.json(lists[listIndex].items[itemIndex])
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

// DELETE /api/lists/[id]/items/[itemId] - Remove an item from a list
export async function DELETE(request: Request, { params }: { params: { id: string; itemId: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const listIndex = lists.findIndex((list) => list.id === params.id)

  if (listIndex === -1) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  // Check if the list belongs to the current user
  if (lists[listIndex].userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Find the item in the list
  const itemIndex = lists[listIndex].items.findIndex((item: any) => item.id === params.itemId)

  if (itemIndex === -1) {
    return NextResponse.json({ error: "Item not found in the list" }, { status: 404 })
  }

  // Remove the item from the list
  lists[listIndex].items.splice(itemIndex, 1)
  lists[listIndex].updatedAt = new Date().toISOString()

  return NextResponse.json({ success: true })
}
