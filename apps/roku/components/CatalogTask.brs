sub init()
    m.top.functionName = "loadCatalog"
end sub

sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")
    root.title = "SEBAS PLAY"
    laptopUrl = safeString(m.top.laptopUrl)
    laptopToken = safeString(m.top.laptopToken)
    if laptopUrl <> "" and laptopToken <> ""
        loadLaptopCatalog(root, laptopUrl, laptopToken)
        m.top.catalog = root
        return
    end if

    url = SebasPlaySupabaseUrl()
    key = SebasPlayPublishableKey()
    if key = "" or key = "REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY"
        m.top.errorMessage = "Configura Supabase o conecta tu laptop desde el botón superior."
        m.top.catalog = root
        return
    end if

    loadCollection(root, url, key, "movies", "Películas", "id,title,synopsis,poster_url,release_year,age_rating,video_url", "title")
    loadCollection(root, url, key, "series", "Series", "id,title,synopsis,poster_url,release_year,age_rating", "title")
    loadCollection(root, url, key, "live_channels", "TV en vivo", "id,name,logo_url,category,country_code,stream_url", "name")
    m.top.catalog = root
end sub

sub loadLaptopCatalog(root as object, baseUrl as string, token as string)
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetUrl(baseUrl + "/api/catalog")
    request.AddHeader("Authorization", "Bearer " + token)
    request.AddHeader("Accept", "application/json")
    response = request.GetToString()
    responseCode = request.GetResponseCode()
    if responseCode = 401
        m.top.errorMessage = "TOKEN INCORRECTO: vuelve a conectar y pega el código privado de la laptop."
        return
    else if responseCode = 404
        m.top.errorMessage = "No se encontró el servidor. Escribe la dirección base de la laptop, sin /health ni /api/catalog."
        return
    else if responseCode <> 200
        m.top.errorMessage = "La laptop respondió con HTTP " + responseCode.ToStr() + ". Revisa la dirección y el servidor."
        return
    end if
    if response = invalid or response = ""
        m.top.errorMessage = "La laptop respondió sin datos. Actualiza el servidor e inténtalo otra vez."
        return
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roAssociativeArray" or type(parsed.items) <> "roArray"
        m.top.errorMessage = "La respuesta de la laptop no contiene un catálogo válido."
        return
    end if
    section = CreateObject("roSGNode", "ContentNode")
    section.Title = "Películas de mi laptop"
    playableCount = 0
    unsupportedCount = 0
    for each entry in parsed.items
        fileName = LCase(safeString(entry.file))
        ' Roku local playback is restricted to MP4 containers; Android VLC handles the other formats.
        streamUrl = safeString(entry.stream_url)
        if Right(fileName, 4) = ".mp4" and streamUrl <> ""
            item = section.CreateChild("ContentNode")
            item.Title = safeString(entry.title)
            item.Description = safeString(entry.file) + " · MP4 para Roku"
            item.Url = streamUrl
            item.StreamFormat = "mp4"
            item.AddFields({ contentType: "movie", contentId: safeString(entry.id) })
            playableCount = playableCount + 1
        else
            unsupportedCount = unsupportedCount + 1
        end if
    end for
    if section.GetChildCount() > 0 then root.AppendChild(section)
    m.top.errorMessage = "Laptop: " + parsed.items.Count().ToStr() + " archivos; " + playableCount.ToStr() + " MP4 disponibles en Roku."
    if playableCount = 0
        m.top.errorMessage = m.top.errorMessage + " No hay MP4 con enlace reproducible para Roku."
    end if
    if unsupportedCount > 0
        m.top.errorMessage = m.top.errorMessage + " Otros " + unsupportedCount.ToStr() + " archivos se pueden abrir en Android con VLC."
    end if
end sub

sub loadCollection(root as object, baseUrl as string, key as string, tableName as string, sectionTitle as string, fields as string, sortField as string)
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetUrl(baseUrl + "/rest/v1/" + tableName + "?select=" + fields + "&is_published=eq.true&order=created_at.desc&limit=40")
    request.AddHeader("apikey", key)
    request.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
    request.AddHeader("Accept", "application/json")
    response = request.GetToString()
    if response = invalid or response = "" then return
    parsed = ParseJson(response)
    if type(parsed) <> "roArray" then return

    section = CreateObject("roSGNode", "ContentNode")
    section.Title = sectionTitle
    for each entry in parsed
        item = section.CreateChild("ContentNode")
        if tableName = "live_channels"
            item.Title = safeString(entry.name)
            item.Description = safeString(entry.category)
            item.Url = safeString(entry.stream_url)
            item.HDPosterUrl = safeString(entry.logo_url)
            item.AddFields({ contentType: "channel", contentId: safeString(entry.id) })
        else
            item.Title = safeString(entry.title)
            item.Description = safeString(entry.synopsis)
            item.HDPosterUrl = safeString(entry.poster_url)
            item.AddFields({ contentType: tableName, contentId: safeString(entry.id) })
            item.AddFields({ year: safeString(entry.release_year) })
            if tableName = "movies" then item.Url = safeString(entry.video_url)
        end if
        item.AddFields({ ageRating: safeString(entry.age_rating) })
    end for
    if section.GetChildCount() > 0 then root.AppendChild(section)
end sub

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
