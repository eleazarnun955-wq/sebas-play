sub init()
    m.video = m.top.FindNode("video")
    m.errorLabel = m.top.FindNode("errorLabel")
    m.loadingLabel = m.top.FindNode("loadingLabel")
    m.titleLabel = m.top.FindNode("titleLabel")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
    m.video.enableUI = true
    if m.top.videoUrl <> "" then startPlayback()
end sub

sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then return
    m.errorLabel.visible = false
    m.loadingLabel.visible = true
    m.loadingLabel.text = "Cargando video..."
    content = CreateObject("roSGNode", "ContentNode")
    content.Url = m.top.videoUrl
    content.Title = m.top.videoTitle
    content.StreamFormat = "auto"
    m.video.content = content
    m.video.control = "play"
end sub

sub updateTitle()
    if m.top.videoTitle <> invalid
        m.titleLabel.text = m.top.videoTitle
    end if
end sub

sub onVideoState()
    state = m.video.state
    if state = "buffering"
        m.loadingLabel.visible = true
        m.loadingLabel.text = "Cargando video..."
    else if state = "playing"
        m.loadingLabel.visible = false
        m.errorLabel.visible = false
    else if state = "error"
        m.top.errorMessage = "Roku no pudo reproducir este archivo. Para Roku se recomienda MP4 con video H.264 y audio AAC. Comprueba también que el enlace siga vigente."
        m.video.control = "stop"
        m.loadingLabel.visible = false
        m.errorLabel.text = m.top.errorMessage
        m.errorLabel.visible = true
    else if state = "finished"
        m.video.control = "stop"
        m.top.wasClosed = true
        m.top.RemoveFromParent()
    end if
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "back"
        m.video.control = "stop"
        m.top.wasClosed = true
        m.top.RemoveFromParent()
        return true
    end if
    return false
end function
