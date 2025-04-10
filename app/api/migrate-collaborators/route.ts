import { NextResponse } from "next/server"
import { migrateCollaborators } from "@/lib/migrate-collaborators"

export async function GET(request: Request) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url)
    const secretKey = searchParams.get("key")

    // This is a simple protection - in a real app, use a more secure approach
    if (secretKey !== "your-secret-migration-key") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const migratedCount = await migrateCollaborators()

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully. ${migratedCount} lists updated.`,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
