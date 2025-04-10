import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type")

  if (!id || !type) {
    return NextResponse.json({ error: "Missing id or type parameter" }, { status: 400 })
  }

  // Extract numeric ID if it's in the format "tv-123" or "movie-123"
  const numericId = id.includes("-") ? id.split("-")[1] : id

  try {
    const apiKey = process.env.TMDB_API_KEY
    const baseUrl = "https://api.themoviedb.org/3"

    // Fetch basic details
    const detailsUrl = `${baseUrl}/${type}/${numericId}?api_key=${apiKey}&append_to_response=credits`
    const detailsResponse = await fetch(detailsUrl)

    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch details: ${detailsResponse.status}`)
    }

    const detailsData = await detailsResponse.json()

    // Format the response based on the media type
    const formattedData = {
      id: `${type}-${numericId}`,
      type: type,
      title: detailsData.title || detailsData.name,
      overview: detailsData.overview,
      image: detailsData.poster_path ? `https://image.tmdb.org/t/p/w500${detailsData.poster_path}` : null,
      backdrop: detailsData.backdrop_path ? `https://image.tmdb.org/t/p/original${detailsData.backdrop_path}` : null,
      year: (detailsData.release_date || detailsData.first_air_date || "").substring(0, 4),
      voteAverage: detailsData.vote_average,
      genres: detailsData.genres?.map((g: any) => g.name) || [],
      runtime: detailsData.runtime || null,
      cast:
        detailsData.credits?.cast?.slice(0, 10).map((actor: any) => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profile: actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : null,
        })) || [],
    }

    // For TV series, fetch additional season and episode data
    if (type === "tv") {
      // Get all seasons data
      const seasons = []

      // Include the number_of_seasons directly from the API response
      formattedData.number_of_seasons = detailsData.number_of_seasons

      // Fetch detailed season data for each season
      for (let i = 1; i <= detailsData.number_of_seasons; i++) {
        const seasonUrl = `${baseUrl}/tv/${numericId}/season/${i}?api_key=${apiKey}`
        const seasonResponse = await fetch(seasonUrl)

        if (seasonResponse.ok) {
          const seasonData = await seasonResponse.json()

          // Format episodes data
          const episodes = seasonData.episodes.map((episode: any) => ({
            id: episode.id,
            name: episode.name,
            overview: episode.overview,
            episode_number: episode.episode_number,
            air_date: episode.air_date,
            still_path: episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : null,
            watched: false,
          }))

          seasons.push({
            id: i,
            name: seasonData.name,
            overview: seasonData.overview,
            poster_path: seasonData.poster_path ? `https://image.tmdb.org/t/p/w300${seasonData.poster_path}` : null,
            air_date: seasonData.air_date,
            episodes: episodes,
          })
        }
      }

      formattedData.seasons = seasons
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error fetching details:", error)
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 })
  }
}
