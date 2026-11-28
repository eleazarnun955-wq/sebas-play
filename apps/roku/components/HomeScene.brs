sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.introOverlay = m.top.FindNode("brandIntroOverlay")
    m.introAudio = m.top.FindNode("brandIntroAudio")
    m.introTimer = m.top.FindNode("brandIntroTimer")
    m.introTimer.ObserveField("fire", "onBrandIntroFinished")
    introContent = CreateObject("roSGNode", "ContentNode")
    introContent.url = "pkg:/audio/sebas-play-intro.mp3"
    introContent.streamFormat = "mp3"
    m.introAudio.content = introContent
    m.introAudio.control = "play"
    m.status = m.top.FindNode("status")
    m.actions = m.top.FindNode("topActions")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.rows.ObserveField("rowItemFocused", "onItemFocused")
    m.actions.ObserveField("buttonSelected", "onActionSelected")
    m.focusedItem = invalid
    m.connectButton = m.actions.CreateChild("Button")
    m.connectButton.text = "Conectar desde Android"
    refreshButton = m.actions.CreateChild("Button")
    refreshButton.text = "Actualizar biblioteca"
    m.registry = CreateObject("roRegistrySection", "SEBASPLAY27")
    m.laptopUrl = m.registry.Read("laptopUrl")
    m.laptopToken = m.registry.Read("laptopToken")
    m.deviceToken = m.registry.Read("rokuDeviceToken")
    if m.deviceToken = invalid then m.deviceToken = ""
    m.syncedProgress = {}
    m.syncedFavorites = []
    if m.laptopUrl = invalid then m.laptopUrl = ""
    if m.laptopToken = invalid then m.laptopToken = ""
    ' Android launch arguments may arrive just after SceneGraph init; observe both fields.
    m.top.ObserveField("launchLaptopUrl", "onLaunchLaptopConnectionChanged")
    m.top.ObserveField("launchLaptopToken", "onLaunchLaptopConnectionChanged")
    if safeString(m.top.launchLaptopUrl) <> "" and safeString(m.top.launchLaptopToken) <> ""
        onLaunchLaptopConnectionChanged()
    else if m.deviceToken <> ""
        syncRokuAccount()
    else
        loadCatalog()
    end if
    m.actions.SetFocus(true)
    m.introTimer.control = "start"
end sub

sub onBrandIntroFinished()
    if m.introOverlay <> invalid then m.introOverlay.visible = false
end sub

sub onLaunchLaptopConnectionChanged()
    launchUrl = safeString(m.top.launchLaptopUrl)
    launchToken = safeString(m.top.launchLaptopToken)
    if launchUrl = "" or launchToken = "" then return
    if launchUrl = m.laptopUrl and launchToken = m.laptopToken then return
    m.laptopUrl = launchUrl
    m.laptopToken = launchToken
    m.registry.Write("laptopUrl", m.laptopUrl)
    m.registry.Write("laptopToken", m.laptopToken)
    m.registry.Flush()
    m.status.text = "Android conectado. Cargando la biblioteca de tu laptop..."
    loadCatalog()
end sub

sub onActionSelected()
    index = m.actions.buttonSelected
    if index = 0
        m.status.text = "Para conectar tu laptop, abre SEBAS PLAY en Android y pulsa Conectar directamente a Roku."
    else if index = 1
        loadCatalog()
    end if
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
    m.focusedItem = item
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
    if Len(player.contentId) <> 36 then player.contentId = ""
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

sub onItemFocused()
    selection = m.rows.rowItemFocused
    if selection = invalid then return
    rowIndex = selection[0]
    itemIndex = selection[1]
    if m.rows.content = invalid then return
    row = m.rows.content.GetChild(rowIndex)
    if row = invalid then return
    m.focusedItem = row.GetChild(itemIndex)
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "options"
        toggleFocusedFavorite()
        return true
    end if
    return false
end function

sub toggleFocusedFavorite()
    if m.deviceToken = "" or m.focusedItem = invalid
        m.status.text = "Vincula Roku con Android y selecciona una película o episodio para guardar favoritos."
        return
    end if
    item = m.focusedItem
    contentType = safeString(item.contentType)
    contentId = safeString(item.contentId)
    if (contentType <> "movie" and contentType <> "series" and contentType <> "channel") or Len(contentId) <> 36
        m.status.text = "Este elemento no admite favoritos sincronizados."
        return
    end if
    operation = "add"
    for each favorite in m.syncedFavorites
        if safeString(favorite.content_type) = contentType and safeString(favorite.content_id) = contentId
            operation = "remove"
            exit for
        end if
    end for
    startSyncTask("favorite", { content_type: contentType, content_id: contentId, operation: operation })
end sub

sub askRokuPairCode()
    dialog = CreateObject("roSGNode", "StandardKeyboardDialog")
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
    startSyncTask("pair-device", { code: code, device_name: "SEBAS PLAY Roku" })
end sub

sub syncRokuAccount()
    if m.deviceToken = ""
        m.status.text = "Primero vincula este Roku desde tu cuenta Android."
        return
    end if
    startSyncTask("sync", {})
end sub

sub startSyncTask(action as string, payload as object)
    if m.syncTask <> invalid and m.syncTask.control = "RUN"
        m.status.text = "Hay una sincronización en curso. Espera un momento..."
        return
    end if
    m.syncTask = CreateObject("roSGNode", "SyncTask")
    m.syncTask.action = action
    m.syncTask.deviceToken = m.deviceToken
    m.syncTask.payload = payload
    m.syncTask.ObserveField("response", "onSyncTaskCompleted")
    m.syncTask.ObserveField("errorMessage", "onSyncTaskError")
    m.syncTask.control = "RUN"
end sub

sub onSyncTaskError()
    if m.syncTask <> invalid and m.syncTask.errorMessage <> ""
        m.status.text = m.syncTask.errorMessage
        if m.syncTask.action = "sync" then loadCatalog()
    end if
end sub

sub onSyncTaskCompleted()
    if m.syncTask = invalid then return
    response = m.syncTask.response
    if response = invalid or response = ""
        m.status.text = "El servicio de sincronización no devolvió datos."
        return
    end if
    parsed = ParseJson(response)
    if type(parsed) <> "roAssociativeArray"
        m.status.text = "La respuesta de sincronización no es válida."
        return
    end if
    if m.syncTask.action = "pair-device"
        if safeString(parsed.device_token) = ""
            m.status.text = "La vinculación no devolvió un token válido."
            return
        end if
        m.deviceToken = parsed.device_token
        m.registry.Write("rokuDeviceToken", m.deviceToken)
        m.registry.Flush()
        syncRokuAccount()
        return
    else if m.syncTask.action = "favorite"
        m.status.text = "Favorito actualizado. Sincronizando tu lista..."
        syncRokuAccount()
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
