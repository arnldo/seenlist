import { NextResponse } from "next/server"

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const type = searchParams.get("type") || "all" // 'movie', 'tv', or 'all'

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    let results = []

    // Search for movies if type is 'movie' or 'all'
    if (type === "movie" || type === "all") {
      const movieResponse = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
      )
      const movieData = await movieResponse.json()

      if (movieData.results) {
        const formattedMovies = movieData.results.slice(0, 10).map((movie: any) => ({
          id: `movie-${movie.id}`,
          tmdbId: movie.id,
          title: movie.title,
          type: "movie",
          year: movie.release_date ? movie.release_date.substring(0, 4) : "Unknown",
          genres: [], // We'll get genres in a separate request if needed
          image: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
          overview: movie.overview,
          voteAverage: movie.vote_average,
        }))
        results = [...results, ...formattedMovies]
      }
    }

    // Search for TV shows if type is 'tv' or 'all'
    if (type === "series" || type === "tv" || type === "all") {
      const tvResponse = await fetch(
        `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
      )
      const tvData = await tvResponse.json()

      if (tvData.results) {
        const formattedTvShows = tvData.results.slice(0, 10).map((show: any) => ({
          id: `tv-${show.id}`,
          tmdbId: show.id,
          title: show.name,
          type: "series",
          year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
          genres: [], // We'll get genres in a separate request if needed
          image: show.poster_path ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` : null,
          overview: show.overview,
          voteAverage: show.vote_average,
        }))
        results = [...results, ...formattedTvShows]
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching TMDB:", error)
    return NextResponse.json({ error: "Failed to search TMDB" }, { status: 500 })
  }
}
