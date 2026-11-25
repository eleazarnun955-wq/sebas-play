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
        if isDirectPlayableUrl(movie.video_url)
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
            ' Build the row detached; append only when it contains playable episodes.
            showRow = CreateObject("roSGNode", "ContentNode")
            showRow.title = show.title
            showRow.addFields({seriesId: show.id, contentType: "series"})
            for each season in seasons
                if season.series_id = show.id
                    for each episode in episodes
                        if episode.season_id = season.id and isDirectPlayableUrl(episode.video_url)
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
            if showRow.GetChildCount() > 0 then root.AppendChild(showRow)
        end for
    end if

    channels = fetchRows("live_channels", "id,name,logo_url,category,country_code,stream_url", "created_at")
    if channels <> invalid
        channelRow = root.CreateChild("ContentNode")
        channelRow.title = "Televisión en vivo"
        for each channel in channels
            if isDirectPlayableUrl(channel.stream_url)
                item = channelRow.CreateChild("ContentNode")
                item.title = channel.name
                item.url = channel.stream_url
                item.hdPosterUrl = channel.logo_url
                item.description = channel.category
                item.addFields({contentId: channel.id, contentType: "channel"})
            end if
        end for
    end if

    loadPersonalSync(root)
    m.top.catalog = root
    if m.top.errorMessage = invalid or m.top.errorMessage = "" then m.top.errorMessage = "Catálogo actualizado"
end sub

function fetchRows(tableName as string, selectFields as string, orderField as string, publishedOnly = true as boolean) as dynamic
    allRows = []
    offset = 0
    pageSize = 300
    ' Read the complete catalog in bounded pages instead of silently truncating
    ' every category at the first 300 records.
    for pageNumber = 1 to 100
        transfer = CreateObject("roUrlTransfer")
        transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
        transfer.InitClientCertificates()
        query = "?select=" + selectFields + "&order=" + orderField + ".desc&limit=" + pageSize.ToStr() + "&offset=" + offset.ToStr()
        if publishedOnly then query = "?select=" + selectFields + "&is_published=eq.true&order=" + orderField + ".desc&limit=" + pageSize.ToStr() + "&offset=" + offset.ToStr()
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
        for each row in parsed
            allRows.Push(row)
        end for
        if parsed.Count() < pageSize then exit for
        offset = offset + pageSize
    end for
    return allRows
end function

' PRO 4.0 never lists HTML/embed pages as playable media.
' Only known direct Roku-compatible media resource extensions are admitted.
function isDirectPlayableUrl(value as dynamic) as boolean
    if value = invalid or type(value) <> "String" or value = "" then return false
    clean = LCase(Trim(value))
    if Left(clean, 7) <> "http://" and Left(clean, 8) <> "https://" then return false
    if Instr(1, clean, "/embed/") > 0 or Right(clean, 6) = "/embed" then return false
    queryAt = Instr(1, clean, "?")
    if queryAt > 0 then clean = Left(clean, queryAt - 1)
    hashAt = Instr(1, clean, "#")
    if hashAt > 0 then clean = Left(clean, hashAt - 1)
    return Right(clean, 4) = ".mp4" or Right(clean, 4) = ".m4v" or Right(clean, 4) = ".mov" or Right(clean, 5) = ".m3u8"
end function

sub loadPersonalSync(root as object)
    registry = CreateObject("roRegistrySection", "SEBASPLAYPRO50")
    token = registry.Read("device_token", "")
    if token = "" then return

    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync?action=sync")
    request.AddHeader("apikey", SebasPlayPublishableKey())
    request.AddHeader("Authorization", "Bearer " + token)
    request.AddHeader("Accept", "application/json")
    response = request.GetToString()
    if response = invalid or response = "" then return
    parsed = ParseJson(response)
    if parsed = invalid or parsed.favorites = invalid or parsed.watch_progress = invalid then return

    m.top.personalSync = parsed
    favorites = parsed.favorites
    if type(favorites) <> "roArray" or favorites.Count() = 0 then return

    favoritesRow = CreateObject("roSGNode", "ContentNode")
    favoritesRow.title = "Mi lista"
    for each favorite in favorites
        if favorite.content_id <> invalid
            for rowIndex = 0 to root.GetChildCount() - 1
                sourceRow = root.GetChild(rowIndex)
                for itemIndex = 0 to sourceRow.GetChildCount() - 1
                    sourceItem = sourceRow.GetChild(itemIndex)
                    if sourceItem.contentId = favorite.content_id and sourceItem.contentType = favorite.content_type
                        copy = favoritesRow.CreateChild("ContentNode")
                        copy.title = sourceItem.title
                        copy.url = sourceItem.url
                        copy.hdPosterUrl = sourceItem.hdPosterUrl
                        copy.description = sourceItem.description
                        copy.addFields({contentId: sourceItem.contentId, contentType: sourceItem.contentType})
                        exit for
                    end if
                end for
            end for
        end if
    end for
    if favoritesRow.GetChildCount() > 0 then root.AppendChild(favoritesRow)
end sub
