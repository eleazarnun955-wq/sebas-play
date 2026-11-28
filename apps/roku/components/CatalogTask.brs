sub init()
    m.top.functionName = "loadCatalog"
end sub

sub loadCatalog()
    root = CreateObject("roSGNode", "ContentNode")
    root.title = "SEBAS PLAY 24.0"
    laptopUrl = normalizeBaseUrl(safeString(m.top.laptopUrl))
    laptopToken = safeString(m.top.laptopToken)

    ' Build the Roku discovery catalog from the same published SEBAS PLAY
    ' database used by Android. All network work stays inside this Task node.
    supabaseUrl = SebasPlaySupabaseUrl()
    publicKey = SebasPlayPublishableKey()
    loadCollection(root, supabaseUrl, publicKey, "movies", "Películas recientes 2023–2026", "id,title,synopsis,release_year,age_rating,duration_minutes,poster_url,video_url", "release_year")
    loadSeriesEpisodes(root, supabaseUrl, publicKey)
    loadCollection(root, supabaseUrl, publicKey, "live_channels", "Televisión en vivo", "id,name,category,stream_url,logo_url,age_rating", "created_at")

    if laptopUrl <> "" and laptopToken <> ""
        m.top.errorMessage = "Catálogo SEBAS PLAY cargado. Conectando también con Mi laptop..."
        loadLaptopCatalog(root, laptopUrl, laptopToken)
    else
        m.top.errorMessage = "Explora el catálogo gratuito de SEBAS PLAY. Para añadir tus archivos, conecta Mi laptop desde Android."
    end if
    m.top.catalog = root
end sub

sub loadSeriesEpisodes(root as object, baseUrl as string, key as string)
    seriesRequest = CreateObject("roUrlTransfer")
    seriesRequest.SetCertificatesFile("common:/certs/ca-bundle.crt")
    seriesRequest.InitClientCertificates()
    seriesRequest.SetMinimumTransferRate(1, 20)
    seriesRequest.SetUrl(baseUrl + "/rest/v1/series?select=id,title,release_year&is_published=eq.true&release_year=gte.2023&order=release_year.desc&limit=40")
    seriesRequest.AddHeader("apikey", key)
    seriesRequest.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
    seriesRequest.AddHeader("Accept", "application/json")
    seriesResult = getTransferResponse(seriesRequest, 10000)
    seriesResponse = seriesResult.body
    if seriesResponse = invalid or seriesResponse = "" then return
    shows = ParseJson(seriesResponse)
    if type(shows) <> "roArray" then return

    for each show in shows
        showId = safeString(show.id)
        showTitle = safeString(show.title)
        if showId <> ""
            seasonRequest = CreateObject("roUrlTransfer")
            seasonRequest.SetCertificatesFile("common:/certs/ca-bundle.crt")
            seasonRequest.InitClientCertificates()
    seasonRequest.SetMinimumTransferRate(1, 20)
            seasonRequest.SetUrl(baseUrl + "/rest/v1/seasons?select=id,season_number,title&series_id=eq." + showId + "&order=season_number.asc")
            seasonRequest.AddHeader("apikey", key)
            seasonRequest.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
            seasonRequest.AddHeader("Accept", "application/json")
            seasonResult = getTransferResponse(seasonRequest, 10000)
            seasonResponse = seasonResult.body
            if seasonResponse <> invalid and seasonResponse <> ""
                seasons = ParseJson(seasonResponse)
                if type(seasons) = "roArray"
                    for each season in seasons
                        seasonId = safeString(season.id)
                        if seasonId <> ""
                            seasonNumber = safeString(season.season_number)
                            seasonTitle = safeString(season.title)
                            if seasonTitle = "" then seasonTitle = "Temporada " + seasonNumber
                            episodeRequest = CreateObject("roUrlTransfer")
                            episodeRequest.SetCertificatesFile("common:/certs/ca-bundle.crt")
                            episodeRequest.InitClientCertificates()
    episodeRequest.SetMinimumTransferRate(1, 20)
                            episodeRequest.SetUrl(baseUrl + "/rest/v1/episodes?select=id,title,episode_number,synopsis,duration_minutes,video_url&season_id=eq." + seasonId + "&is_published=eq.true&video_url=not.is.null&order=episode_number.asc")
                            episodeRequest.AddHeader("apikey", key)
                            episodeRequest.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
                            episodeRequest.AddHeader("Accept", "application/json")
                            episodeResult = getTransferResponse(episodeRequest, 10000)
                            episodeResponse = episodeResult.body
                            if episodeResponse <> invalid and episodeResponse <> ""
                                episodeList = ParseJson(episodeResponse)
                                if type(episodeList) = "roArray" and episodeList.Count() > 0
                                    section = CreateObject("roSGNode", "ContentNode")
                                    section.Title = showTitle + " · " + seasonTitle
                                    for each episode in episodeList
                                        if isDirectPlayableUrl(safeString(episode.video_url)) then
                                        item = section.CreateChild("ContentNode")
                                        item.Title = safeString(episode.episode_number) + ". " + safeString(episode.title)
                                        item.Description = safeString(episode.synopsis)
                                        item.Url = safeString(episode.video_url)
                                        item.StreamFormat = "auto"
                                        item.AddFields({ contentType: "episode", contentId: safeString(episode.id), seriesId: showId, seasonId: seasonId })
                                        end if
                                    end for
                                    if section.GetChildCount() > 0 then root.AppendChild(section)
                                end if
                            end if
                        end if
                    end for
                end if
            end if
        end if
    end for
end sub

sub loadLaptopCatalog(root as object, baseUrl as string, token as string)
    ' First verify that the address really points to the Windows media server.
    healthRequest = CreateObject("roUrlTransfer")
    healthRequest.SetCertificatesFile("common:/certs/ca-bundle.crt")
    healthRequest.InitClientCertificates()
    healthRequest.SetMinimumTransferRate(1, 5)
    healthRequest.SetUrl(baseUrl + "/health")
    healthRequest.AddHeader("Accept", "application/json")
    healthResult = getTransferResponse(healthRequest, 12000)
    healthResponse = healthResult.body
    healthCode = healthResult.code
    if healthCode <> 200
        if healthCode > 0
            m.top.errorMessage = "La dirección respondió HTTP " + healthCode.ToStr() + ". Comprueba la dirección base y que el servidor esté encendido."
        else
            m.top.errorMessage = "La laptop no respondió en 12 segundos. Comprueba que Roku y la laptop estén en la misma red Wi-Fi y que el servidor esté activo."
        end if
        return
    end if
    healthData = ParseJson(healthResponse)
    if type(healthData) <> "roAssociativeArray" or healthData.ok <> true
        m.top.errorMessage = "La dirección responde, pero no parece ser el servidor multimedia de SEBAS PLAY."
        return
    end if

    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetMinimumTransferRate(1, 5)
    request.SetUrl(baseUrl + "/api/catalog")
    request.AddHeader("Authorization", "Bearer " + token)
    request.AddHeader("Accept", "application/json")
    catalogResult = getTransferResponse(request, 45000)
    response = catalogResult.body
    responseCode = catalogResult.code
    if responseCode = 401
        m.top.errorMessage = "TOKEN INCORRECTO: vuelve a conectar y pega el código privado de la laptop."
        return
    else if responseCode = 404
        m.top.errorMessage = "No se encontró /api/catalog. Actualiza el servidor multimedia de la laptop."
        return
    else if responseCode <> 200
        if responseCode > 0
            m.top.errorMessage = "La laptop respondió con HTTP " + responseCode.ToStr() + ". Revisa el servidor."
        else
            if catalogResult.timedOut
                m.top.errorMessage = "La biblioteca tardó más de 45 segundos en responder. Revisa que el servidor de Windows siga activo y pulsa Actualizar biblioteca."
            else
                m.top.errorMessage = "No se pudo completar la solicitud del catálogo. Comprueba la red y vuelve a intentarlo."
            end if
        end if
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
        streamUrl = safeString(entry.stream_url)
        transcodeUrl = safeString(entry.transcode_url)
        mediaType = safeString(entry.media_type)
        if mediaType = "episode"
            if Right(fileName, 4) <> ".mp4" and transcodeUrl = "" then unsupportedCount = unsupportedCount + 1
        else
            playUrl = streamUrl
            if Right(fileName, 4) <> ".mp4" then playUrl = transcodeUrl
            if playUrl <> ""
                item = section.CreateChild("ContentNode")
                item.Title = safeString(entry.title)
                if Right(fileName, 4) = ".mp4"
                    item.Description = safeString(entry.file) + " · MP4 para Roku"
                else
                    item.Description = safeString(entry.file) + " · Conversión FFmpeg a MP4"
                end if
                item.Url = playUrl
                item.StreamFormat = "mp4"
                item.AddFields({ contentType: "movie", contentId: safeString(entry.id) })
                playableCount = playableCount + 1
            else
                unsupportedCount = unsupportedCount + 1
            end if
        end if
    end for
    if section.GetChildCount() > 0 then root.AppendChild(section)

    ' The Windows scanner groups detected SxxExx files by series and season.
    ' Add compatible MP4 episodes to Roku as separate season rows.
    seriesCount = 0
    episodeCount = 0
    if type(parsed.series) = "roArray"
        for each show in parsed.series
            showTitle = safeString(show.title)
            if type(show.seasons) = "roArray"
                for each season in show.seasons
                    seasonNumber = safeString(season.season_number)
                    seasonRow = CreateObject("roSGNode", "ContentNode")
                    seasonRow.Title = showTitle + " · Temporada " + seasonNumber
                    if type(season.episodes) = "roArray"
                        for each episode in season.episodes
                            episodeFile = LCase(safeString(episode.file))
                            episodeUrl = safeString(episode.stream_url)
                            episodeTranscodeUrl = safeString(episode.transcode_url)
                            if Right(episodeFile, 4) <> ".mp4" then episodeUrl = episodeTranscodeUrl
                            if episodeUrl <> ""
                                episodeNode = seasonRow.CreateChild("ContentNode")
                                episodeNode.Title = safeString(episode.episode_number) + ". " + safeString(episode.title)
                                episodeNode.Description = showTitle + " · Temporada " + seasonNumber
                                episodeNode.Url = episodeUrl
                                episodeNode.StreamFormat = "mp4"
                                episodeNode.AddFields({ contentType: "episode", seriesTitle: showTitle, seasonNumber: seasonNumber, episodeNumber: safeString(episode.episode_number), contentId: safeString(episode.id) })
                                episodeCount = episodeCount + 1
                            end if
                        end for
                    end if
                    if seasonRow.GetChildCount() > 0
                        root.AppendChild(seasonRow)
                        seriesCount = seriesCount + 1
                    end if
                end for
            end if
        end for
    end if

    m.top.errorMessage = "Laptop conectada: " + parsed.items.Count().ToStr() + " archivos; " + playableCount.ToStr() + " películas MP4 y " + episodeCount.ToStr() + " episodios MP4 en " + seriesCount.ToStr() + " temporadas disponibles en Roku."
    if playableCount = 0 and episodeCount = 0 then m.top.errorMessage = m.top.errorMessage + " No hay MP4 con enlace reproducible para Roku."
    if unsupportedCount > 0 then m.top.errorMessage = m.top.errorMessage + " Otros " + unsupportedCount.ToStr() + " archivos se pueden abrir en Android con VLC."
end sub

sub loadCollection(root as object, baseUrl as string, key as string, tableName as string, sectionTitle as string, fields as string, sortField as string)
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetMinimumTransferRate(1, 20)
    extraFilter = ""
    if tableName = "movies" then extraFilter = "&release_year=gte.2023&video_url=not.is.null"
    if tableName = "live_channels" then extraFilter = "&stream_url=not.is.null"
    request.SetUrl(baseUrl + "/rest/v1/" + tableName + "?select=" + fields + "&is_published=eq.true" + extraFilter + "&order=" + sortField + ".desc&limit=40")
    request.AddHeader("apikey", key)
    request.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
    request.AddHeader("Accept", "application/json")
    collectionResult = getTransferResponse(request, 10000)
    response = collectionResult.body
    if response = invalid or response = "" then return
    parsed = ParseJson(response)
    if type(parsed) <> "roArray" then return
    epgPrograms = []
    currentIso = CreateObject("roDateTime").ToISOString()
    if tableName = "live_channels"
        epgRequest = CreateObject("roUrlTransfer")
        epgRequest.SetCertificatesFile("common:/certs/ca-bundle.crt")
        epgRequest.InitClientCertificates()
    epgRequest.SetMinimumTransferRate(1, 20)
        epgRequest.SetUrl(baseUrl + "/rest/v1/epg_programs?select=channel_id,title,starts_at,ends_at&is_published=eq.true&ends_at=gt." + currentIso + "&order=starts_at.asc&limit=200")
        epgRequest.AddHeader("apikey", key)
        epgRequest.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
        epgRequest.AddHeader("Accept", "application/json")
        epgResult = getTransferResponse(epgRequest, 10000)
        epgResponse = epgResult.body
        if epgResponse <> invalid and epgResponse <> ""
            parsedEpg = ParseJson(epgResponse)
            if type(parsedEpg) = "roArray" then epgPrograms = parsedEpg
        end if
    end if
    section = CreateObject("roSGNode", "ContentNode")
    section.Title = sectionTitle
    for each entry in parsed
        entryUrl = safeString(entry.stream_url)
        if tableName = "movies" then entryUrl = safeString(entry.video_url)
        if isDirectPlayableUrl(entryUrl) then
        item = section.CreateChild("ContentNode")
        if tableName = "live_channels"
            item.Title = safeString(entry.name)
            item.Description = safeString(entry.category)
            upcomingProgram = ""
            currentProgramFound = false
            for each program in epgPrograms
                if safeString(program.channel_id) = safeString(entry.id)
                    programTitle = safeString(program.title)
                    programStart = safeString(program.starts_at)
                    programEnd = safeString(program.ends_at)
                    if programStart <= currentIso and programEnd > currentIso
                        item.Description = "EN VIVO: " + programTitle
                        currentProgramFound = true
                        exit for
                    else if programStart > currentIso and programTitle <> "" and upcomingProgram = ""
                        upcomingProgram = programTitle
                    end if
                end if
            end for
            if not currentProgramFound and upcomingProgram <> ""
                item.Description = "PRÓXIMO: " + upcomingProgram
            end if
            item.Url = safeString(entry.stream_url)
            item.HDPosterUrl = safeString(entry.logo_url)
            item.AddFields({ contentType: "channel", contentId: safeString(entry.id) })
        else
            item.Title = safeString(entry.title)
            item.Description = safeString(entry.synopsis)
            releaseYear = safeString(entry.release_year)
            ageRating = safeString(entry.age_rating)
            if releaseYear <> "" then item.Description = item.Description + " · " + releaseYear
            if ageRating <> "" then item.Description = item.Description + " · " + ageRating
            runtimeMinutes = safeString(entry.duration_minutes)
            if tableName = "movies" and runtimeMinutes <> "" and runtimeMinutes <> "0"
                item.Description = item.Description + " · " + runtimeMinutes + " min"
            end if
            item.HDPosterUrl = safeString(entry.poster_url)
            favoriteType = tableName
            if tableName = "movies" then favoriteType = "movie"
            item.AddFields({ contentType: favoriteType, contentId: safeString(entry.id) })
            item.AddFields({ year: releaseYear, ageRating: ageRating, runtimeMinutes: runtimeMinutes })
            if tableName = "movies" then item.Url = safeString(entry.video_url)
        end if
        item.AddFields({ ageRating: safeString(entry.age_rating) })
        end if
    end for
    if section.GetChildCount() > 0 then root.AppendChild(section)
end sub

' All server requests are asynchronous so a slow scan or unreachable host
' cannot freeze the Roku SceneGraph task forever.
' Wait for an asynchronous Roku URL event with a hard timeout.
function getTransferResponse(transfer as object, timeoutMs as integer) as object
    port = CreateObject("roMessagePort")
    transfer.SetMessagePort(port)
    started = transfer.AsyncGetToString()
    if not started
        return { code: 0, body: "", timedOut: false }
    end if

    event = Wait(timeoutMs, port)
    if event = invalid
        transfer.AsyncCancel()
        return { code: 0, body: "", timedOut: true }
    end if

    return { code: event.GetResponseCode(), body: event.GetString(), timedOut: false }
end function

function normalizeBaseUrl(value as string) as string
    cleaned = Trim(value)
    ' Remove punctuation accidentally copied with the address, e.g. http://192.168.1.15:8787.
    while Len(cleaned) > 0
        lastChar = Right(cleaned, 1)
        if lastChar = "/" or lastChar = "." or lastChar = "," or lastChar = ";"
            cleaned = Left(cleaned, Len(cleaned) - 1)
        else
            exit while
        end if
    end while
    return cleaned
end function

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
\nfunction isDirectPlayableUrl(value as string) as boolean\n    url = LCase(Trim(value))\n    if Left(url, 7) <> "http://" and Left(url, 8) <> "https://" then return false\n    pathEnd = Instr(1, url, "?")\n    if pathEnd > 0 then url = Left(url, pathEnd - 1)\n    return Right(url, 5) = ".m3u8" or Right(url, 4) = ".mp4" or Right(url, 4) = ".m4v" or Right(url, 4) = ".mov" or Right(url, 5) = ".webm"\nend function\n