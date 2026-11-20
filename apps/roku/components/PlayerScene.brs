sub init()
    m.video = m.top.FindNode("video")
    m.status = m.top.FindNode("status")
    m.statusBackground = m.top.FindNode("statusBackground")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
    if m.top.videoUrl <> "" then startPlayback()
end sub

sub showStatus(message as string)
    m.status.text = message
    m.status.visible = true
    m.statusBackground.visible = true
end sub

sub hideStatus()
    m.status.visible = false
    m.statusBackground.visible = false
end sub

sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then
        showStatus("No hay una dirección de reproducción disponible.")
        return
    end if

    url = m.top.videoUrl
    if LCase(Left(url, 8)) <> "https://" and LCase(Left(url, 7)) <> "http://" then
        showStatus("La dirección del video no es válida.")
        return
    end if

    content = CreateObject("roSGNode", "ContentNode")
    content.Url = url
    content.Title = m.top.videoTitle
    content.StreamFormat = "auto"
    m.video.content = content
    hideStatus()
    m.video.control = "play"
end sub

sub updateTitle()
    if m.top.videoTitle <> invalid and m.video.content <> invalid
        m.video.content.Title = m.top.videoTitle
    end if
end sub

sub onVideoState()
    state = m.video.state
    if state = "error"
        showStatus("No se pudo reproducir esta transmisión. Comprueba el enlace y el formato admitido por Roku.")
    else if state = "finished"
        showStatus("La reproducción ha terminado. Pulsa Atrás para regresar al catálogo.")
    else if state = "playing"
        hideStatus()
    end if
end sub

sub closePlayer()
    m.video.control = "stop"
    m.top.wasClosed = true
    m.top.RemoveFromParent()
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false

    if key = "back"
        closePlayer()
        return true
    else if key = "play"
        if m.video.state = "playing"
            m.video.control = "pause"
        else
            m.video.control = "resume"
        end if
        return true
    end if

    return false
end function
