sub init()
    m.top.functionName = "loadCatalog"
end sub

sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")

    movies = fetchRows("movies", "id,title,synopsis,poster_url,release_year,video_url", "created_at")
    if movies = invalid
        if m.top.errorMessage = invalid or m.top.errorMessage = "" then
            m.top.errorMessage = "No se pudo consultar Películas. Revisa la conexión y permisos del catálogo."
        end if
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
    if shows <> invalid
        showRow = root.CreateChild("ContentNode")
        showRow.title = "Series"
        for each show in shows
            item = showRow.CreateChild("ContentNode")
            item.title = show.title
            item.hdPosterUrl = show.poster_url
            item.description = show.synopsis
            item.addFields({seriesId: show.id, releaseYear: show.release_year, contentType: "series"})
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
    if m.top.errorMessage = invalid or m.top.errorMessage = "" then
        m.top.errorMessage = "Catálogo actualizado"
    end if
end sub

function fetchRows(tableName as string, selectFields as string, orderField as string) as dynamic
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/rest/v1/" + tableName + "?select=" + selectFields + "&is_published=eq.true&order=" + orderField + ".desc&limit=100")
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
