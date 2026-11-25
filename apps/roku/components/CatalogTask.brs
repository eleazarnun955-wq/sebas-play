sub init()
    m.top.functionName = "loadCatalog"
end sub

sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")
    root.title = "SEBAS PLAY"
    url = SebasPlaySupabaseUrl()
    key = SebasPlayPublishableKey()
    if key = "" or key = "REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY"
        m.top.errorMessage = "Falta configurar la clave pública de Supabase en apps/roku/source/config.brs."
        m.top.catalog = root
        return
    end if

    loadCollection(root, url, key, "movies", "Películas", "id,title,synopsis,poster_url,release_year,age_rating,video_url", "title")
    loadCollection(root, url, key, "series", "Series", "id,title,synopsis,poster_url,release_year,age_rating", "title")
    loadCollection(root, url, key, "live_channels", "TV en vivo", "id,name,logo_url,category,country_code,stream_url", "name")

    m.top.catalog = root
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
