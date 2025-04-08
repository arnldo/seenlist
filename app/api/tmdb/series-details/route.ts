import { NextResponse } from "next/server"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 })
  }

  try {
    // Fetch TV show details
    const tvResponse = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=season/1`)
    const tvData = await tvResponse.json()

    if (tvData.success === false) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Get all seasons (excluding specials)
    const seasons = tvData.seasons.filter((season: any) => season.season_number > 0)

    // Fetch details for each season
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season: any) => {
        const seasonResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${id}/season/${season.season_number}?api_key=${TMDB_API_KEY}`,
        )
        const seasonData = await seasonResponse.json()

        return {
          id: seasonData.id,
          name: seasonData.name,
          season_number: seasonData.season_number,
          episode_count: seasonData.episodes.length,
          episodes: seasonData.episodes.map((episode: any) => ({
            id: episode.id,
            name: episode.name,
            episode_number: episode.episode_number,
            overview: episode.overview,
            still_path: episode.still_path ? `${TMDB_IMAGE_BASE_URL}${episode.still_path}` : null,
            air_date: episode.air_date,
            watched: false, // Default to unwatched
          })),
        }
      }),
    )

    return NextResponse.json({
      id: tvData.id,
      name: tvData.name,
      seasons: seasonsWithEpisodes,
    })
  } catch (error) {
    console.error("Error fetching series details:", error)
    return NextResponse.json({ error: "Failed to fetch series details" }, { status: 500 })
  }
}
