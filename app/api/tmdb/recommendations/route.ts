import { NextResponse } from "next/server"
import { mapGenreIdsToNames } from "@/lib/tmdb-utils"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type") // 'movie' or 'series'

  if (!id || !type) {
    return NextResponse.json({ error: "ID and type parameters are required" }, { status: 400 })
  }

  try {
    // Extract the numeric ID if it's in the format "movie-123" or "tv-123"
    const numericId = id.includes("-") ? id.split("-")[1] : id

    // Determine the endpoint based on type
    const mediaType = type === "movie" ? "movie" : "tv"
    const endpoint = `${TMDB_BASE_URL}/${mediaType}/${numericId}/recommendations?api_key=${TMDB_API_KEY}`

    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`)
    }

    const data = await response.json()

    // Format the results
    const results = await Promise.all(
      data.results.map(async (item: any) => {
        // Get additional details based on media type
        const mediaType = type === "movie" ? "movie" : "tv"
        const detailsEndpoint = `${TMDB_BASE_URL}/${mediaType}/${item.id}?api_key=${TMDB_API_KEY}`
        const detailsResponse = await fetch(detailsEndpoint)
        const details = await detailsResponse.json()

        // Convert genre IDs to names
        const genreIds = item.genre_ids ? item.genre_ids.map((id: number) => id.toString()) : []
        const genres = mapGenreIdsToNames(genreIds, type === "movie" ? "movie" : "series")

        return {
          id: `${mediaType === "movie" ? "movie" : "tv"}-${item.id}`,
          tmdbId: item.id,
          title: mediaType === "movie" ? item.title : item.name,
          type: mediaType === "movie" ? "movie" : "series",
          year:
            mediaType === "movie"
              ? item.release_date
                ? item.release_date.substring(0, 4)
                : "Unknown"
              : item.first_air_date
                ? item.first_air_date.substring(0, 4)
                : "Unknown",
          genres: genres,
          image: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
          overview: item.overview,
          voteAverage: item.vote_average,
          runtime: mediaType === "movie" ? details.runtime : null,
          number_of_seasons: mediaType === "tv" ? details.number_of_seasons : null,
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}
