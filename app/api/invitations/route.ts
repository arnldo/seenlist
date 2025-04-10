import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// This endpoint will be used to get pending invitations for a user
// It bypasses the RLS policy by using server-side access
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Get the authenticated user to verify the request is legitimate
    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session || authData.session.user.email !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all lists
    const { data: lists, error } = await supabase
      .from("lists")
      .select("id, name, user_id, collaborators, created_at, items")

    if (error) {
      throw error
    }

    // Filter for pending invitations client-side
    const pendingInvitations = lists
      .filter((list) => {
        return (
          list.collaborators &&
          list.collaborators.some((c) => typeof c === "object" && c.email === email && c.status === "pending")
        )
      })
      .map((list) => {
        const invitation = list.collaborators.find(
          (c) => typeof c === "object" && c.email === email && c.status === "pending",
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

    return NextResponse.json(pendingInvitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

// This endpoint will be used to respond to an invitation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { listId, email, accept } = body

    if (!listId || !email || accept === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the authenticated user to verify the request is legitimate
    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session || authData.session.user.email !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
        return c === email
          ? {
              email: c,
              status: accept ? "accepted" : "rejected",
              invitedAt: new Date().toISOString(),
              respondedAt: new Date().toISOString(),
              invitedBy: list.user_id || "unknown",
            }
          : c
      } else if (c.email === email && c.status === "pending") {
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

    return NextResponse.json({ success: true, status: accept ? "accepted" : "rejected" })
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return NextResponse.json({ error: "Failed to respond to invitation" }, { status: 500 })
  }
}
