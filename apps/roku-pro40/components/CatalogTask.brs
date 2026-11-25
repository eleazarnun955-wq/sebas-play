sub init()
    m.top.functionName = "loadCatalog"
end sub

sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")

    movies = fetchRows("movies", "id,title,synopsis,poster_url,release_year,video_url", "created_at")
    if movies = invalid
        if m.top.errorMessage = invalid or m.top.errorMessage = "" then m.top.errorMessage = "No se pudo consultar Películas. Revisa conexión y permisos."
        return
    end if
    movieRow = root.CreateChild("ContentNode")
    movieRow.title = "Películas"
    for each movie in movies
        if movie.video_url <> invalid and movie.video_url <> ""
            item = movieRow.CreateChild("ContentNode")
            item.title = movie.title
            item.url = movie.video_url
            item.hdPosterUrl = movie.poster_url
            item.description = movie.synopsis
            item.addFields({contentId: movie.id, releaseYear: movie.release_year, contentType: "movie"})
        end if
    end for

    shows = fetchRows("series", "id,title,synopsis,poster_url,release_year", "created_at")
    seasons = fetchRows("seasons", "id,series_id,season_number,title", "season_number", false)
    episodes = fetchRows("episodes", "id,season_id,episode_number,title,synopsis,duration_minutes,video_url", "episode_number")
    if shows <> invalid and seasons <> invalid and episodes <> invalid
        for each show in shows
            showRow = root.CreateChild("ContentNode")
            showRow.title = show.title
            showRow.addFields({seriesId: show.id, contentType: "series"})
            for each season in seasons
                if season.series_id = show.id
                    for each episode in episodes
                        if episode.season_id = season.id and episode.video_url <> invalid and episode.video_url <> ""
                            item = showRow.CreateChild("ContentNode")
                            item.title = "T" + season.season_number.ToStr() + " · E" + episode.episode_number.ToStr() + " · " + episode.title
                            item.url = episode.video_url
                            item.hdPosterUrl = show.poster_url
                            item.description = episode.synopsis
                            item.addFields({contentId: episode.id, seriesId: show.id, contentType: "episode"})
                        end if
                    end for
                end if
            end for
        end for
    end if

    channels = fetchRows("live_channels", "id,name,logo_url,category,country_code,stream_url", "created_at")
    if channels <> invalid
        channelRow = root.CreateChild("ContentNode")
        channelRow.title = "Televisión en vivo"
        for each channel in channels
            if channel.stream_url <> invalid and channel.stream_url <> ""
                item = channelRow.CreateChild("ContentNode")
                item.title = channel.name
                item.url = channel.stream_url
                item.hdPosterUrl = channel.logo_url
                item.description = channel.category
                item.addFields({contentId: channel.id, contentType: "channel"})
            end if
        end for
    end if

    m.top.catalog = root
    if m.top.errorMessage = invalid or m.top.errorMessage = "" then m.top.errorMessage = "Catálogo actualizado"
end sub

function fetchRows(tableName as string, selectFields as string, orderField as string, publishedOnly = true as boolean) as dynamic
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    query = "?select=" + selectFields + "&order=" + orderField + ".desc&limit=300"
    if publishedOnly then query = "?select=" + selectFields + "&is_published=eq.true&order=" + orderField + ".desc&limit=300"
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/rest/v1/" + tableName + query)
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
    transfer.AddHeader("Accept", "application/json")
    response = transfer.GetToString()
    code = transfer.GetResponseCode()
    if response = invalid or response = "" or code < 200 or code >= 300
        detail = ""
        if response <> invalid then detail = Left(response, 180)
        m.top.errorMessage = "Catálogo " + tableName + " · HTTP " + code.ToStr() + " " + detail
        return invalid
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roArray"
        m.top.errorMessage = "Respuesta inesperada del catálogo: " + tableName
        return invalid
    end if
    return parsed
end function
