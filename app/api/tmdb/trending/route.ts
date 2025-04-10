import { NextResponse } from "next/server"
import { mapGenreIdsToNames } from "@/lib/tmdb-utils"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "all" // 'movie', 'tv', or 'all'

  try {
    // Determine the media type for the API call
    const mediaType = type === "movie" ? "movie" : type === "series" ? "tv" : "all"

    // Fetch trending items for the day
    const endpoint = `${TMDB_BASE_URL}/trending/${mediaType}/day?api_key=${TMDB_API_KEY}`

    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`Failed to fetch trending: ${response.statusText}`)
    }

    const data = await response.json()

    // Format the results
    const results = await Promise.all(
      data.results.map(async (item: any) => {
        const itemType = item.media_type || (item.title ? "movie" : "tv")

        // Get additional details based on media type
        const detailsEndpoint = `${TMDB_BASE_URL}/${itemType}/${item.id}?api_key=${TMDB_API_KEY}`
        const detailsResponse = await fetch(detailsEndpoint)
        const details = await detailsResponse.json()

        // Convert genre IDs to names
        const genreIds = item.genre_ids ? item.genre_ids.map((id: number) => id.toString()) : []
        const genres = mapGenreIdsToNames(genreIds, itemType === "movie" ? "movie" : "series")

        return {
          id: `${itemType === "movie" ? "movie" : "tv"}-${item.id}`,
          tmdbId: item.id,
          title: itemType === "movie" ? item.title : item.name,
          type: itemType === "movie" ? "movie" : "series",
          year:
            itemType === "movie"
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
          runtime: itemType === "movie" ? details.runtime : null,
          number_of_seasons: itemType === "tv" ? details.number_of_seasons : null,
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error fetching trending content:", error)
    return NextResponse.json({ error: "Failed to fetch trending content" }, { status: 500 })
  }
}
