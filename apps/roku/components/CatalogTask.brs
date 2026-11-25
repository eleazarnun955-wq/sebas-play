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
        m.top.errorMessage = "Conecta tu laptop desde el botón superior."
        m.top.catalog = root
        return
    end if
    loadCollection(root, url, key, "movies", "Películas", "id,title,synopsis,poster_url,release_year,age_rating,video_url")
    loadCollection(root, url, key, "series", "Series", "id,title,synopsis,poster_url,release_year,age_rating")
    loadCollection(root, url, key, "live_channels", "TV en vivo", "id,name,logo_url,category,country_code,stream_url")
    m.top.catalog = root
end sub

sub loadLaptopCatalog(root as object, baseUrl as string, token as string)
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    cleanBase = baseUrl
    if Right(cleanBase, 1) = "/" then cleanBase = Left(cleanBase, Len(cleanBase) - 1)
    request.SetUrl(cleanBase + "/api/catalog")
    request.AddHeader("Authorization", "Bearer " + token)
    request.AddHeader("Accept", "application/json")
    response = request.GetToString()
    if response = invalid or response = "" then
        m.top.errorMessage = "La laptop no responde. Comprueba que esté encendida y en la misma Wi-Fi."
        return
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roAssociativeArray" or parsed.items = invalid then
        m.top.errorMessage = "No se pudo interpretar el catálogo de la laptop."
        return
    end if

    groups = {}
    folderNames = []
    for each entry in parsed.items
        fileName = safeString(entry.file)
        lowerName = LCase(fileName)
        if Right(lowerName, 4) = ".mp4"
            folderName = "Películas"
            slash = Instr(1, fileName, "/")
            if slash > 0 then folderName = Left(fileName, slash - 1)
            if groups.DoesExist(folderName) = false
                groups[folderName] = CreateObject("roSGNode", "ContentNode")
                groups[folderName].Title = folderName
                folderNames.Push(folderName)
            end if
            item = groups[folderName].CreateChild("ContentNode")
            item.Title = safeString(entry.title)
            item.Description = fileName
            item.Url = safeString(entry.stream_url)
            item.StreamFormat = "mp4"
            item.AddFields({ contentType: "movie", contentId: safeString(entry.id) })
        end if
    end for

    folderNames.Sort()
    for each folderName in folderNames
        folder = groups[folderName]
        if folder.GetChildCount() > 0 then root.AppendChild(folder)
    end for
    if folderNames.Count() = 0
        m.top.errorMessage = "La laptop respondió, pero no encontró archivos MP4 compatibles en la biblioteca."
    else
        m.top.errorMessage = "Catálogo de laptop: " + parsed.items.Count().ToStr() + " archivos detectados."
    end if
end sub

sub loadCollection(root as object, baseUrl as string, key as string, tableName as string, sectionTitle as string, fields as string)
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
        else
            item.Title = safeString(entry.title)
            item.Description = safeString(entry.synopsis)
            item.HDPosterUrl = safeString(entry.poster_url)
            if tableName = "movies" then item.Url = safeString(entry.video_url)
        end if
    end for
    if section.GetChildCount() > 0 then root.AppendChild(section)
end sub

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
