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
    if m.task.catalog <> invalid
        m.rows.content = m.task.catalog
        m.status.text = "Catálogo actualizado · selecciona una película"
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
