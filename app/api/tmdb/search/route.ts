import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 })
  }

  try {
    const apiKey = process.env.TMDB_API_KEY
    const baseUrl = "https://api.themoviedb.org/3"

    // Search for movies
    const movieSearchUrl = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    const movieResponse = await fetch(movieSearchUrl)

    if (!movieResponse.ok) {
      throw new Error(`Failed to search movies: ${movieResponse.status}`)
    }

    const movieData = await movieResponse.json()

    // Search for TV shows
    const tvSearchUrl = `${baseUrl}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    const tvResponse = await fetch(tvSearchUrl)

    if (!tvResponse.ok) {
      throw new Error(`Failed to search TV shows: ${tvResponse.status}`)
    }

    const tvData = await tvResponse.json()

    // Format movie results
    const movieResults = movieData.results.map((movie: any) => ({
      id: `movie-${movie.id}`,
      type: "movie",
      title: movie.title,
      overview: movie.overview,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      year: (movie.release_date || "").substring(0, 4),
      voteAverage: movie.vote_average,
    }))

    // Format TV results with additional season info
    const tvResults = await Promise.all(
      tvData.results.map(async (tv: any) => {
        // Fetch additional details to get season count
        const detailsUrl = `${baseUrl}/tv/${tv.id}?api_key=${apiKey}`
        const detailsResponse = await fetch(detailsUrl)
        let number_of_seasons = 0

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          number_of_seasons = detailsData.number_of_seasons
        }

        return {
          id: `tv-${tv.id}`,
          type: "series",
          title: tv.name,
          overview: tv.overview,
          image: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : null,
          year: (tv.first_air_date || "").substring(0, 4),
          voteAverage: tv.vote_average,
          number_of_seasons: number_of_seasons,
        }
      }),
    )

    // Combine and sort results by popularity
    const combinedResults = [...movieResults, ...tvResults].sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))

    return NextResponse.json({ results: combinedResults })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}
