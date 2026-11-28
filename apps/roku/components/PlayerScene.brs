sub init()
    m.video = m.top.FindNode("video")
    m.errorLabel = m.top.FindNode("errorLabel")
    m.loadingLabel = m.top.FindNode("loadingLabel")
    m.titleLabel = m.top.FindNode("titleLabel")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
    m.saveTimer = m.top.FindNode("progressSaveTimer")
    m.saveTimer.ObserveField("fire", "savePlaybackPosition")
    m.registry = CreateObject("roRegistrySection", "SEBASPLAY18")
    m.resumePosition = 0
    m.resumeApplied = false
    if m.top.resumeSeconds > m.resumePosition then m.resumePosition = m.top.resumeSeconds
    m.video.enableUI = true
    if m.top.videoUrl <> "" then startPlayback()
end sub

sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then return
    m.errorLabel.visible = false
    m.loadingLabel.visible = true
    m.loadingLabel.text = "Cargando video..."
    m.resumePosition = 0
    m.resumeApplied = false
    savedUrl = m.registry.Read("lastVideoUrl")
    if savedUrl = m.top.videoUrl
        savedPositionText = m.registry.Read("lastVideoPosition")
        if savedPositionText = invalid then savedPositionText = "0"
        savedPosition = Val(savedPositionText)
        if savedPosition > 0 then m.resumePosition = savedPosition
    end if
    if m.top.resumeSeconds > m.resumePosition then m.resumePosition = m.top.resumeSeconds
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

sub savePlaybackPosition()
    if m.video <> invalid and m.top.videoUrl <> ""
        position = m.video.position
        if position > 0
            m.registry.Write("lastVideoUrl", m.top.videoUrl)
            m.registry.Write("lastVideoPosition", position.ToStr())
            m.registry.Flush()
            syncPlaybackProgress(position, m.video.duration)
        end if
    end if
end sub


sub syncPlaybackProgress(position as dynamic, duration as dynamic)
    if m.top.syncToken = "" or m.top.contentId = "" then return
    if m.top.contentType <> "movie" and m.top.contentType <> "episode" then return
    if m.progressTask <> invalid and m.progressTask.control = "RUN" then m.progressTask.control = "STOP"
    m.progressTask = CreateObject("roSGNode", "ProgressTask")
    m.progressTask.syncToken = m.top.syncToken
    m.progressTask.contentType = m.top.contentType
    m.progressTask.contentId = m.top.contentId
    m.progressTask.positionSeconds = Int(position)
    if duration <> invalid and duration > 0 then m.progressTask.durationSeconds = Int(duration)
    m.progressTask.control = "RUN"
end sub

sub onVideoState()
    state = m.video.state
    if state = "buffering"
        m.loadingLabel.visible = true
        m.loadingLabel.text = "Cargando video..."
    else if state = "playing"
        m.loadingLabel.visible = false
        m.errorLabel.visible = false
        if not m.resumeApplied
            m.resumeApplied = true
            if m.resumePosition > 15
                m.video.seek = m.resumePosition
                m.loadingLabel.visible = false
            end if
            m.saveTimer.control = "start"
        end if
    else if state = "error"
        m.top.errorMessage = "Roku no pudo reproducir este archivo. Para Roku se recomienda MP4 con video H.264 y audio AAC. Comprueba también que el enlace siga vigente."
        m.video.control = "stop"
        m.loadingLabel.visible = false
        m.errorLabel.text = m.top.errorMessage
        m.errorLabel.visible = true
    else if state = "finished"
        m.video.control = "stop"
        m.registry.Write("lastVideoUrl", m.top.videoUrl)
        m.registry.Write("lastVideoPosition", "0")
        m.registry.Flush()
        ' Clear cloud resume position when playback reaches the end.
        syncPlaybackProgress(0, m.video.duration)
        m.saveTimer.control = "stop"
        m.top.wasClosed = true
        m.top.RemoveFromParent()
    end if
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "back"
        savePlaybackPosition()
        m.saveTimer.control = "stop"
        m.video.control = "stop"
        m.top.wasClosed = true
        m.top.RemoveFromParent()
        return true
    end if
    return false
end function
