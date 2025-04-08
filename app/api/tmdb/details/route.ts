import { NextResponse } from "next/server"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type") // 'movie' or 'tv'

  if (!id || !type) {
    return NextResponse.json({ error: "ID and type parameters are required" }, { status: 400 })
  }

  // Extract the numeric ID if it's in the format "movie-123" or "tv-123"
  const numericId = id.includes("-") ? id.split("-")[1] : id

  try {
    // Fetch details based on type
    const detailsUrl = `${TMDB_BASE_URL}/${type === "movie" ? "movie" : "tv"}/${numericId}?api_key=${TMDB_API_KEY}`
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    if (detailsData.success === false) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Format the response based on type
    let formattedData
    if (type === "movie") {
      formattedData = {
        id: `movie-${detailsData.id}`,
        tmdbId: detailsData.id,
        title: detailsData.title,
        type: "movie",
        year: detailsData.release_date ? detailsData.release_date.substring(0, 4) : "Unknown",
        genres: detailsData.genres ? detailsData.genres.map((g: any) => g.name) : [],
        image: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.poster_path}` : null,
        backdrop: detailsData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.backdrop_path}` : null,
        overview: detailsData.overview,
        voteAverage: detailsData.vote_average,
        runtime: detailsData.runtime,
      }
    } else {
      formattedData = {
        id: `tv-${detailsData.id}`,
        tmdbId: detailsData.id,
        title: detailsData.name,
        type: "series",
        year: detailsData.first_air_date ? detailsData.first_air_date.substring(0, 4) : "Unknown",
        genres: detailsData.genres ? detailsData.genres.map((g: any) => g.name) : [],
        image: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.poster_path}` : null,
        backdrop: detailsData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.backdrop_path}` : null,
        overview: detailsData.overview,
        voteAverage: detailsData.vote_average,
        seasons: detailsData.number_of_seasons,
        episodes: detailsData.number_of_episodes,
      }
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error fetching TMDB details:", error)
    return NextResponse.json({ error: "Failed to fetch details from TMDB" }, { status: 500 })
  }
}
