sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.status = m.top.FindNode("status")
    m.actions = m.top.FindNode("actions")
    m.actions.buttons = ["Vincular Roku"]
    m.actions.ObserveField("buttonSelected", "onActionSelected")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.task = CreateObject("roSGNode", "CatalogTask")
    m.task.ObserveField("catalog", "onCatalogLoaded")
    m.task.ObserveField("errorMessage", "onCatalogError")
    m.task.control = "RUN"
    m.actions.SetFocus(true)
end sub

sub onActionSelected()
    if m.actions.buttonSelected <> 0 then return
    m.pairDialog = CreateObject("roSGNode", "KeyboardDialog")
    m.pairDialog.title = "Vincular SEBAS PLAY PRO 5.0"
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
    registry = CreateObject("roRegistrySection", "SEBASPLAYPRO50")
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
