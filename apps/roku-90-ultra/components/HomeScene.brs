sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.status = m.top.FindNode("status")
    m.actions = m.top.FindNode("actions")
    m.actions.buttons = ["Vincular Roku", "Agregar / quitar de Mi lista"]
    m.actions.ObserveField("buttonSelected", "onActionSelected")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.rows.ObserveField("rowItemFocused", "onItemFocused")
    m.task = CreateObject("roSGNode", "CatalogTask")
    m.task.ObserveField("catalog", "onCatalogLoaded")
    m.task.ObserveField("errorMessage", "onCatalogError")
    m.task.control = "RUN"
    m.actions.SetFocus(true)
end sub

sub onActionSelected()
    if m.actions.buttonSelected = 1 then
        toggleFocusedFavorite()
        return
    end if
    if m.actions.buttonSelected <> 0 then return
    m.pairDialog = CreateObject("roSGNode", "KeyboardDialog")
    m.pairDialog.title = "Vincular SEBAS PLAY 9.0 ULTRA"
    m.pairDialog.message = "En Android, genera un código desde Vincular Roku e introdúcelo aquí. Vence en cinco minutos."
    m.pairDialog.buttons = ["Vincular", "Cancelar"]
    m.pairDialog.ObserveField("buttonSelected", "onPairDialogButton")
    m.top.dialog = m.pairDialog
end sub

sub onPairDialogButton()
    if m.pairDialog.buttonSelected <> 0 then
        m.top.dialog = invalid
        m.actions.SetFocus(true)
        return
    end if
    code = UCase(Trim(m.pairDialog.text))
    m.top.dialog = invalid
    if Len(code) <> 12 then
        m.status.text = "Código incompleto. Genera uno nuevo desde Android."
        m.actions.SetFocus(true)
        return
    end if
    m.status.text = "Vinculando Roku de forma segura..."
    m.pairTask = CreateObject("roSGNode", "PairingTask")
    m.pairTask.code = code
    m.pairTask.ObserveField("completed", "onPairingCompleted")
    m.top.AppendChild(m.pairTask)
    m.pairTask.control = "RUN"
end sub

sub onPairingCompleted()
    if m.pairTask.errorMessage <> invalid and m.pairTask.errorMessage <> ""
        m.status.text = "No se pudo vincular: " + m.pairTask.errorMessage
    else
        m.status.text = "Roku vinculado a tu cuenta. Favoritos y progreso se sincronizarán."
        m.task = CreateObject("roSGNode", "CatalogTask")
        m.task.ObserveField("catalog", "onCatalogLoaded")
        m.task.ObserveField("errorMessage", "onCatalogError")
        m.task.control = "RUN"
    end if
    m.top.RemoveChild(m.pairTask)
    m.pairTask = invalid
    m.actions.SetFocus(true)
end sub

sub onCatalogLoaded()
    if m.task.catalog <> invalid
        m.rows.content = m.task.catalog
        m.personalSync = m.task.personalSync
        m.status.text = "Catálogo actualizado · selecciona una película o episodio"
        if m.personalSync <> invalid
            favCount = m.personalSync.favorites.Count()
            progressCount = m.personalSync.watch_progress.Count()
            m.status.text = "Cuenta vinculada · " + favCount.ToStr() + " favoritos · " + progressCount.ToStr() + " reproducciones sincronizadas"
        end if
    end if
end sub

sub onCatalogError()
    if m.task.errorMessage <> invalid then m.status.text = m.task.errorMessage
end sub

sub onItemFocused()
    selection = m.rows.rowItemFocused
    if selection = invalid then return
    row = m.rows.content.GetChild(selection[0])
    if row = invalid then return
    m.focusedItem = row.GetChild(selection[1])
end sub

sub toggleFocusedFavorite()
    item = m.focusedItem
    if item = invalid or item.contentId = invalid or item.contentType = invalid
        m.status.text = "Selecciona primero una película, serie o canal."
        m.actions.SetFocus(true)
        return
    end if
    contentId = item.contentId
    contentType = item.contentType
    if contentType = "episode" and item.seriesId <> invalid
        contentId = item.seriesId
        contentType = "series"
    end if
    if contentType <> "movie" and contentType <> "series" and contentType <> "channel"
        m.status.text = "Este elemento no admite favoritos."
        m.actions.SetFocus(true)
        return
    end if
    registry = CreateObject("roRegistrySection", "SEBASPLAY90ULTRA")
    token = registry.Read("device_token", "")
    if token = ""
        m.status.text = "Vincula primero tu Roku desde Android."
        m.actions.SetFocus(true)
        return
    end if
    operation = "add"
    if m.personalSync <> invalid and m.personalSync.favorites <> invalid
        for each favorite in m.personalSync.favorites
            if favorite.content_id = contentId and favorite.content_type = contentType
                operation = "remove"
                exit for
            end if
        end for
    end if
    m.favoriteTask = CreateObject("roSGNode", "FavoriteTask")
    m.favoriteTask.deviceToken = token
    m.favoriteTask.contentId = contentId
    m.favoriteTask.contentType = contentType
    m.favoriteTask.operation = operation
    m.favoriteTask.ObserveField("completed", "onFavoriteCompleted")
    m.top.AppendChild(m.favoriteTask)
    m.favoriteTask.control = "RUN"
    m.status.text = "Actualizando Mi lista..."
end sub

sub onFavoriteCompleted()
    if m.favoriteTask.errorMessage <> invalid and m.favoriteTask.errorMessage <> ""
        m.status.text = "No se pudo actualizar Mi lista: " + m.favoriteTask.errorMessage
    else
        m.status.text = "Mi lista sincronizada con tu cuenta."
        m.task = CreateObject("roSGNode", "CatalogTask")
        m.task.ObserveField("catalog", "onCatalogLoaded")
        m.task.ObserveField("errorMessage", "onCatalogError")
        m.task.control = "RUN"
    end if
    m.top.RemoveChild(m.favoriteTask)
    m.favoriteTask = invalid
    m.actions.SetFocus(true)
end sub

sub onItemSelected()
    if m.player <> invalid then return
    selection = m.rows.rowItemSelected
    if selection = invalid then return
    row = m.rows.content.GetChild(selection[0])
    if row = invalid then return
    item = row.GetChild(selection[1])
    if item = invalid or item.url = invalid or item.url = "" then return

    player = CreateObject("roSGNode", "PlayerScene")
    player.videoUrl = item.url
    player.videoTitle = item.title
    player.contentId = item.contentId
    player.contentType = item.contentType
    registry = CreateObject("roRegistrySection", "SEBASPLAY90ULTRA")
    player.deviceToken = registry.Read("device_token", "")
    player.resumePosition = 0
    if m.personalSync <> invalid and m.personalSync.watch_progress <> invalid
        for each progress in m.personalSync.watch_progress
            if progress.content_id = item.contentId and progress.content_type = item.contentType
                player.resumePosition = progress.position_seconds
                exit for
            end if
        end for
    end if
    m.player = player
    m.top.AppendChild(m.player)
    m.player.ObserveField("wasClosed", "onPlayerClosed")
end sub

sub onPlayerClosed()
    if m.player <> invalid
        m.top.RemoveChild(m.player)
        m.player = invalid
    end if
    m.rows.SetFocus(true)
end sub
