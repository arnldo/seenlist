import { NextResponse } from "next/server"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type") // 'movie' or 'tv'

  if (!id || !type) {
    return NextResponse.json({ error: "ID and type parameters are required" }, { status: 400 })
  }

  try {
    // Fetch videos based on type
    const videosUrl = `${TMDB_BASE_URL}/${type === "movie" ? "movie" : "tv"}/${id}/videos?api_key=${TMDB_API_KEY}`
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()

    if (videosData.success === false) {
      return NextResponse.json({ error: "Videos not found" }, { status: 404 })
    }

    return NextResponse.json(videosData)
  } catch (error) {
    console.error("Error fetching TMDB videos:", error)
    return NextResponse.json({ error: "Failed to fetch videos from TMDB" }, { status: 500 })
  }
}
