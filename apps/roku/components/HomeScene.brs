sub init()
    m.rows = m.top.FindNode("catalogRows")
    m.status = m.top.FindNode("status")
    m.rows.ObserveField("rowItemSelected", "onItemSelected")
    m.task = CreateObject("roSGNode", "CatalogTask")
    m.task.ObserveField("catalog", "onCatalogLoaded")
    m.task.ObserveField("errorMessage", "onCatalogError")
    m.task.control = "RUN"
    m.rows.SetFocus(true)
end sub

sub onCatalogLoaded()
    catalog = m.task.catalog
    if catalog <> invalid
        m.rows.content = catalog
        m.status.text = "Explora con tu control remoto"
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
