sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.status = m.top.FindNode("status")
    m.actions = m.top.FindNode("topActions")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.actions.ObserveField("buttonSelected", "onActionSelected")
    connectButton = m.actions.CreateChild("Button")
    connectButton.text = "Conectar laptop"
    refreshButton = m.actions.CreateChild("Button")
    refreshButton.text = "Actualizar catálogo"
    m.registry = CreateObject("roRegistrySection", "SEBASPLAY")
    m.laptopUrl = m.registry.Read("laptopUrl")
    m.laptopToken = m.registry.Read("laptopToken")
    if m.laptopUrl = invalid then m.laptopUrl = ""
    if m.laptopToken = invalid then m.laptopToken = ""
    loadCatalog()
    m.actions.SetFocus(true)
end sub

sub onActionSelected()
    index = m.actions.buttonSelected
    if index = 0
        askLaptopUrl()
    else if index = 1
        loadCatalog()
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
    if Right(lowerUrl, 13) = "/api/catalog" then
        m.laptopUrl = Left(m.laptopUrl, Len(m.laptopUrl) - 12)
    else if Right(lowerUrl, 7) = "/health" then
        m.laptopUrl = Left(m.laptopUrl, Len(m.laptopUrl) - 7)
    end if
    m.top.dialog = invalid
    askLaptopToken()
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
    m.registry.Write("laptopUrl", m.laptopUrl)
    m.registry.Write("laptopToken", m.laptopToken)
    m.registry.Flush()
    loadCatalog()
end sub

sub loadCatalog()
    m.status.text = "Conectando con tu biblioteca..."
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
    if catalog <> invalid then m.rows.content = catalog
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
    player.videoUrl = mediaUrl
    player.videoTitle = item.Title
    m.top.AppendChild(player)
    player.ObserveField("wasClosed", "onPlayerClosed")
    player.ObserveField("errorMessage", "onPlayerError")
end sub

sub onPlayerClosed()
    m.rows.SetFocus(true)
end sub

sub onPlayerError()
    player = m.top.FindNode("PlayerScene")
    if player <> invalid and player.errorMessage <> invalid and player.errorMessage <> ""
        m.status.text = player.errorMessage
    end if
end sub
