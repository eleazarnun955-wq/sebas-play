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
    if index = 0 then
        askLaptopUrl()
    else if index = 1 then
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
    m.laptopUrl = dialog.text
    if Left(m.laptopUrl, 7) <> "http://" and Left(m.laptopUrl, 8) <> "https://" then
        m.status.text = "Escribe la dirección completa, por ejemplo http://192.168.1.15:8787"
        m.top.dialog = invalid
        return
    end if
    m.top.dialog = invalid
    askLaptopToken()
end sub

sub askLaptopToken()
    dialog = CreateObject("roSGNode", "KeyboardDialog")
    dialog.title = "Token privado de SEBAS PLAY"
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
    m.laptopToken = dialog.text
    m.top.dialog = invalid
    if m.laptopToken = "" then
        m.status.text = "El token no puede quedar vacío."
        return
    end if
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
    if catalog <> invalid then
        m.rows.content = catalog
        if m.task.errorMessage <> invalid and m.task.errorMessage <> ""
            m.status.text = m.task.errorMessage
        else
            m.status.text = "Explora tus carpetas con el control remoto"
        end if
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
    row = m.rows.content.GetChild(selection[0])
    if row = invalid then return
    item = row.GetChild(selection[1])
    if item = invalid then return
    mediaUrl = item.Url
    if mediaUrl = invalid or mediaUrl = "" then
        m.status.text = "Este título no tiene un video disponible."
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
