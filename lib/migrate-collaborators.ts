import { supabase } from "./supabase"

// Run this once to update existing collaborators
export async function migrateCollaborators() {
  // Get all lists
  const { data: lists, error } = await supabase.from("lists").select("*")

  if (error) {
    console.error("Error fetching lists:", error)
    return
  }

  let migratedCount = 0

  for (const list of lists || []) {
    // Skip lists with no collaborators or already migrated collaborators
    if (
      !list.collaborators ||
      list.collaborators.length === 0 ||
      (typeof list.collaborators[0] === "object" && list.collaborators[0].email)
    ) {
      continue
    }

    // Convert string emails to objects
    const updatedCollaborators = list.collaborators.map((email: string) => ({
      email: email,
      status: "accepted", // Assume existing collaborators are accepted
      invitedAt: new Date().toISOString(),
      invitedBy: list.user_id,
      invitedByName: "System Migration",
    }))

    // Update the list
    const { error: updateError } = await supabase
      .from("lists")
      .update({ collaborators: updatedCollaborators })
      .eq("id", list.id)

    if (updateError) {
      console.error(`Error updating list ${list.id}:`, updateError)
    } else {
      migratedCount++
    }
  }

  console.log(`Migration completed. ${migratedCount} lists updated.`)
  return migratedCount
}
