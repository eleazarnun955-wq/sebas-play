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
    m.pairDialog.title = "Vincular SEBAS PLAY"
    m.pairDialog.message = "Abre Vincular Roku en tu Android e introduce el código de 12 caracteres. Vence en 5 minutos."
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
        m.status.text = "Código incompleto. Selecciona Vincular Roku e inténtalo de nuevo."
        m.actions.SetFocus(true)
        return
    end if
    m.status.text = "Vinculando este Roku de forma segura..."
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
        m.status.text = "Roku vinculado a tu cuenta. Ya puedes cerrar esta ventana."
    end if
    m.top.RemoveChild(m.pairTask)
    m.pairTask = invalid
    m.actions.SetFocus(true)
end sub

sub onCatalogLoaded()
    catalog = m.task.catalog
    if catalog <> invalid
        m.rows.content = catalog
        m.status.text = "Explora con tu control remoto · SEBAS PLAY PRO 5.0"
    end if
end sub

sub onCatalogError()
    if m.task.errorMessage <> invalid and m.task.errorMessage <> ""
        m.status.text = m.task.errorMessage
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
    if mediaUrl = invalid or mediaUrl = "" then
        m.status.text = "Este título todavía no tiene un video autorizado disponible."
        return
    end if
    if LCase(Left(mediaUrl, 8)) <> "https://" and LCase(Left(mediaUrl, 7)) <> "http://" then
        m.status.text = "La dirección del video no es válida."
        return
    end if

    player = CreateObject("roSGNode", "PlayerScene")
    player.videoUrl = mediaUrl
    player.videoTitle = item.Title
    m.top.AppendChild(player)
    player.ObserveField("wasClosed", "onPlayerClosed")
end sub

sub onPlayerClosed()
    m.rows.SetFocus(true)
end sub
