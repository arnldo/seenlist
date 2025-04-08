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
    // Fetch credits based on type
    const creditsUrl = `${TMDB_BASE_URL}/${type === "movie" ? "movie" : "tv"}/${id}/credits?api_key=${TMDB_API_KEY}`
    const creditsResponse = await fetch(creditsUrl)
    const creditsData = await creditsResponse.json()

    if (creditsData.success === false) {
      return NextResponse.json({ error: "Credits not found" }, { status: 404 })
    }

    return NextResponse.json(creditsData)
  } catch (error) {
    console.error("Error fetching TMDB credits:", error)
    return NextResponse.json({ error: "Failed to fetch credits from TMDB" }, { status: 500 })
  }
}
