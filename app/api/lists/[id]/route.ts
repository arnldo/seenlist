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

// GET /api/lists/[id] - Get a specific list
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const list = lists.find((list) => list.id === params.id)

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  // Check if the list belongs to the current user
  if (list.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  return NextResponse.json(list)
}

// PUT /api/lists/[id] - Update a list
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    const updates = await request.json()

    // Update the list
    lists[listIndex] = {
      ...lists[listIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(lists[listIndex])
  } catch (error) {
    console.error("Error updating list:", error)
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 })
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

  // Remove the list
  lists.splice(listIndex, 1)

  return NextResponse.json({ success: true })
}
