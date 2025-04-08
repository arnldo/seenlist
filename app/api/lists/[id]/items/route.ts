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

// POST /api/lists/[id]/items - Add an item to a list
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  try {
    const item = await request.json()

    // Check if the item already exists in the list
    if (lists[listIndex].items.some((existing: any) => existing.id === item.id)) {
      return NextResponse.json({ error: "Item already exists in the list" }, { status: 409 })
    }

    // Add the item to the list
    const newItem = {
      ...item,
      watched: false,
      addedAt: new Date().toISOString(),
    }

    lists[listIndex].items.push(newItem)
    lists[listIndex].updatedAt = new Date().toISOString()

    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Error adding item to list:", error)
    return NextResponse.json({ error: "Failed to add item to list" }, { status: 500 })
  }
}
