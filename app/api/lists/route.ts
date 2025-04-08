import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

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

// GET /api/lists - Get all lists for the current user
export async function GET() {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get lists for the current user
  const userLists = lists.filter((list) => list.userId === user.id)

  return NextResponse.json(userLists)
}

// POST /api/lists - Create a new list
export async function POST(request: Request) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 })
    }

    const newList = {
      id: uuidv4(),
      userId: user.id,
      name,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    lists.push(newList)

    return NextResponse.json(newList)
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 })
  }
}
