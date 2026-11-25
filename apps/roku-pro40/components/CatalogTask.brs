sub init()
    m.top.functionName = "loadCatalog"
end sub
sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")
    movies = fetchRows("movies", "id,title,synopsis,poster_url,release_year,video_url", "created_at")
    if movies = invalid
        m.top.errorMessage = "No se pudo leer el catálogo. Revisa conexión y permisos de publicación."
        return
    end if
    row = root.CreateChild("ContentNode")
    row.title = "Películas"
    for each movie in movies
        if movie.video_url <> invalid and movie.video_url <> ""
            item = row.CreateChild("ContentNode")
            item.title = movie.title
            item.url = movie.video_url
            item.hdPosterUrl = movie.poster_url
            item.description = movie.synopsis
            item.addFields({releaseYear: movie.release_year})
        end if
    end for
    series = fetchRows("series", "id,title,synopsis,poster_url,release_year", "created_at")
    if series <> invalid
        row2 = root.CreateChild("ContentNode")
        row2.title = "Series"
        for each show in series
            item = row2.CreateChild("ContentNode")
            item.title = show.title
            item.hdPosterUrl = show.poster_url
            item.description = show.synopsis
            item.addFields({seriesId: show.id})
        end for
    end if
    m.top.catalog = root
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
    if response = invalid or response = "" then return invalid
    parsed = ParseJson(response)
    if type(parsed) <> "roArray" then return invalid
    return parsed
end function
