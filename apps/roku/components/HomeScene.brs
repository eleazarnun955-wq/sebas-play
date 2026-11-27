sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.status = m.top.FindNode("status")
    m.dialogTimer = m.top.FindNode("dialogTransitionTimer")
    m.dialogTimer.ObserveField("fire", "onDialogTransitionTimer")
    m.dialogTransition = ""
    m.actions = m.top.FindNode("topActions")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.actions.ObserveField("buttonSelected", "onActionSelected")
    connectButton = m.actions.CreateChild("Button")
    connectButton.text = "Conectar laptop"
    refreshButton = m.actions.CreateChild("Button")
    refreshButton.text = "Actualizar catálogo"
    pairButton = m.actions.CreateChild("Button")
    pairButton.text = "Vincular con Android"
    m.registry = CreateObject("roRegistrySection", "SEBASPLAY")
    m.laptopUrl = m.registry.Read("laptopUrl")
    m.laptopToken = m.registry.Read("laptopToken")
    m.deviceToken = m.registry.Read("rokuDeviceToken")
    if m.deviceToken = invalid then m.deviceToken = ""
    m.syncedProgress = {}
    m.syncedFavorites = []
    if m.laptopUrl = invalid then m.laptopUrl = ""
    if m.laptopToken = invalid then m.laptopToken = ""
    if m.deviceToken <> "" then syncRokuAccount()
    loadCatalog()
    m.actions.SetFocus(true)
end sub

sub onActionSelected()
    index = m.actions.buttonSelected
    if index = 0
        askLaptopUrl()
    else if index = 1
        if m.deviceToken <> "" then syncRokuAccount() else loadCatalog()
    else if index = 2
        askRokuPairCode()
    end if
end sub

sub askLaptopUrl()
    dialog = CreateObject("roSGNode", "KeyboardDialog")
    dialog.title = "Dirección de tu laptop"
    dialog.text = m.laptopUrl
    dialog.buttons = ["Siguiente", "Cancelar"]
    dialog.ObserveField("buttonSelected", "onUrlEntered")
    m.top.dialog = dialog
end sub

sub onUrlEntered()
    dialog = m.top.dialog
    if dialog = invalid or dialog.buttonSelected <> 0 then
        m.top.dialog = invalid
        return
    end if
    m.laptopUrl = Trim(dialog.text)
    while Len(m.laptopUrl) > 0 and Right(m.laptopUrl, 1) = "/"
        m.laptopUrl = Left(m.laptopUrl, Len(m.laptopUrl) - 1)
    end while
    lowerUrl = LCase(m.laptopUrl)
    if Left(lowerUrl, 7) <> "http://" and Left(lowerUrl, 8) <> "https://" then
        m.status.text = "Escribe la dirección completa, empezando con http:// o https://"
        m.top.dialog = invalid
        return
    end if
    if Right(lowerUrl, 12) = "/api/catalog" then
        m.laptopUrl = Left(m.laptopUrl, Len(m.laptopUrl) - 12)
    else if Right(lowerUrl, 7) = "/health" then
        m.laptopUrl = Left(m.laptopUrl, Len(m.laptopUrl) - 7)
    end if
    m.top.dialog = invalid
    m.status.text = "Dirección aceptada. Preparando el campo del token..."
    m.dialogTransition = "token"
    m.dialogTimer.control = "start"
end sub

sub onDialogTransitionTimer()
    if m.dialogTransition = "token"
        m.dialogTransition = ""
        askLaptopToken()
    end if
end sub

sub askLaptopToken()
    dialog = CreateObject("roSGNode", "KeyboardDialog")
    dialog.title = "Pega el token privado (solo el código)"
    dialog.text = m.laptopToken
    dialog.buttons = ["Conectar", "Cancelar"]
    dialog.ObserveField("buttonSelected", "onTokenEntered")
    m.top.dialog = dialog
end sub

sub onTokenEntered()
    dialog = m.top.dialog
    if dialog = invalid or dialog.buttonSelected <> 0 then
        m.top.dialog = invalid
        return
    end if
    m.laptopToken = Trim(dialog.text)
    m.top.dialog = invalid
    if m.laptopToken = ""
        m.status.text = "Falta el token privado. Pulsa Conectar laptop y pega el código de acceso."
        m.actions.SetFocus(true)
        return
    end if
    m.status.text = "Verificando dirección y token de la laptop..."
    m.registry.Write("laptopUrl", m.laptopUrl)
    m.registry.Write("laptopToken", m.laptopToken)
    m.registry.Flush()
    loadCatalog()
end sub

sub loadCatalog()
    m.status.text = "Conectando con tu biblioteca. Espera la respuesta del servidor..."
    if m.task <> invalid then m.task.control = "STOP"
    m.task = CreateObject("roSGNode", "CatalogTask")
    m.task.laptopUrl = m.laptopUrl
    m.task.laptopToken = m.laptopToken
    m.task.ObserveField("catalog", "onCatalogLoaded")
    m.task.ObserveField("errorMessage", "onCatalogError")
    m.task.control = "RUN"
end sub

sub onCatalogLoaded()
    catalog = m.task.catalog
    if catalog <> invalid
        appendSyncedFavorites(catalog)
        m.rows.content = catalog
    end if
    if m.task.errorMessage <> invalid and m.task.errorMessage <> "" then m.status.text = m.task.errorMessage
end sub

sub onCatalogError()
    if m.task.errorMessage <> invalid and m.task.errorMessage <> ""
        m.status.text = m.task.errorMessage
    else
        m.status.text = "Explora con tu control remoto"
    end if
end sub

sub onItemSelected()
    selection = m.rows.rowItemSelected
    if selection = invalid then return
    rowIndex = selection[0]
    itemIndex = selection[1]
    row = m.rows.content.GetChild(rowIndex)
    if row = invalid then return
    item = row.GetChild(itemIndex)
    if item = invalid then return
    mediaUrl = item.Url
    if mediaUrl = invalid or mediaUrl = ""
        m.status.text = "Este título todavía no tiene un video autorizado disponible."
        return
    end if
    if LCase(Left(mediaUrl, 8)) <> "https://" and LCase(Left(mediaUrl, 7)) <> "http://"
        m.status.text = "La dirección del video no es válida."
        return
    end if
    player = CreateObject("roSGNode", "PlayerScene")
    m.activePlayer = player
    player.videoUrl = mediaUrl
    player.videoTitle = item.Title
    player.syncToken = m.deviceToken
    player.contentType = safeString(item.contentType)
    player.contentId = safeString(item.contentId)
    progressKey = player.contentType + "_" + player.contentId
    if m.syncedProgress.DoesExist(progressKey) then player.resumeSeconds = m.syncedProgress[progressKey]
    m.top.AppendChild(player)
    player.ObserveField("wasClosed", "onPlayerClosed")
    player.ObserveField("errorMessage", "onPlayerError")
end sub

sub onPlayerClosed()
    m.rows.SetFocus(true)
end sub

sub onPlayerError()
    if m.activePlayer <> invalid and m.activePlayer.errorMessage <> invalid and m.activePlayer.errorMessage <> ""
        m.status.text = m.activePlayer.errorMessage
    end if
end sub

sub askRokuPairCode()
    dialog = CreateObject("roSGNode", "KeyboardDialog")
    dialog.title = "Código de SEBAS PLAY en Android"
    dialog.text = ""
    dialog.buttons = ["Vincular", "Cancelar"]
    dialog.ObserveField("buttonSelected", "onRokuPairCodeEntered")
    m.top.dialog = dialog
end sub

sub onRokuPairCodeEntered()
    dialog = m.top.dialog
    if dialog = invalid or dialog.buttonSelected <> 0
        m.top.dialog = invalid
        return
    end if
    code = UCase(Trim(dialog.text))
    m.top.dialog = invalid
    if Len(code) <> 12
        m.status.text = "El código debe tener 12 caracteres. Genera uno nuevo en Android."
        return
    end if
    m.status.text = "Vinculando Roku con tu cuenta SEBAS PLAY..."
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
    transfer.AddHeader("Content-Type", "application/json")
    body = FormatJson({ action: "pair-device", code: code, device_name: "SEBAS PLAY Roku" })
    response = transfer.PostFromString(body)
    if transfer.GetResponseCode() <> 200 or response = invalid
        m.status.text = "No se pudo vincular. Revisa el código y vuelve a generarlo desde Android."
        return
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roAssociativeArray" or safeString(parsed.device_token) = ""
        m.status.text = "La respuesta de vinculación no fue válida."
        return
    end if
    m.deviceToken = parsed.device_token
    m.registry.Write("rokuDeviceToken", m.deviceToken)
    m.registry.Flush()
    syncRokuAccount()
end sub

sub syncRokuAccount()
    if m.deviceToken = ""
        m.status.text = "Primero vincula este Roku desde tu cuenta Android."
        return
    end if
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync?action=sync")
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Authorization", "Bearer " + m.deviceToken)
    transfer.AddHeader("Accept", "application/json")
    response = transfer.GetToString()
    if transfer.GetResponseCode() <> 200 or response = invalid
        m.status.text = "Roku vinculado, pero no se pudo descargar la sincronización."
        return
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roAssociativeArray"
        m.status.text = "Respuesta de sincronización inválida."
        return
    end if
    m.syncedProgress = {}
    m.syncedFavorites = []
    if type(parsed.favorites) = "roArray" then m.syncedFavorites = parsed.favorites
    if type(parsed.watch_progress) = "roArray"
        for each entry in parsed.watch_progress
            key = safeString(entry.content_type) + "_" + safeString(entry.content_id)
            m.syncedProgress[key] = Val(safeString(entry.position_seconds))
        end for
    end if
    favoritesCount = 0
    if type(parsed.favorites) = "roArray" then favoritesCount = parsed.favorites.Count()
    m.status.text = "Roku vinculado. Sincronizados " + favoritesCount.ToStr() + " favoritos y " + m.syncedProgress.Count().ToStr() + " avances de reproducción."
    loadCatalog()
end sub

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function

sub appendSyncedFavorites(root as object)
    if type(m.syncedFavorites) <> "roArray" or m.syncedFavorites.Count() = 0 then return
    favoritesRow = CreateObject("roSGNode", "ContentNode")
    favoritesRow.Title = "Mi lista sincronizada"
    for each favorite in m.syncedFavorites
        favoriteType = safeString(favorite.content_type)
        favoriteId = safeString(favorite.content_id)
        for rowIndex = 0 to root.GetChildCount() - 1
            sourceRow = root.GetChild(rowIndex)
            if sourceRow <> invalid
                for itemIndex = 0 to sourceRow.GetChildCount() - 1
                    sourceItem = sourceRow.GetChild(itemIndex)
                    if sourceItem <> invalid and safeString(sourceItem.contentType) = favoriteType and safeString(sourceItem.contentId) = favoriteId
                        copy = favoritesRow.CreateChild("ContentNode")
                        copy.Title = sourceItem.Title
                        copy.Description = sourceItem.Description
                        copy.Url = sourceItem.Url
                        copy.StreamFormat = sourceItem.StreamFormat
                        copy.HDPosterUrl = sourceItem.HDPosterUrl
                        copy.AddFields({ contentType: favoriteType, contentId: favoriteId })
                        exit for
                    end if
                end for
            end if
        end for
    end for
    if favoritesRow.GetChildCount() > 0 then root.AppendChild(favoritesRow)
end sub
