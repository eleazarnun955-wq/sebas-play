sub init()
    m.video = m.top.FindNode("video")
    m.title = m.top.FindNode("title")
    m.status = m.top.FindNode("playbackStatus")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
    m.video.ObserveField("position", "onPositionChanged")
    m.lastSavedPosition = 0
    m.resumeApplied = false
    m.progressTask = invalid
    m.pendingPosition = invalid
    m.pendingDuration = 0
    m.video.enableUI = true
    m.top.SetFocus(true)
    m.status.text = "Preparando reproducción…"
end sub

sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then return
    m.lastSavedPosition = 0
    m.resumeApplied = false
    m.top.wasClosed = false
    m.status.text = "Conectando con el servidor…"
    content = CreateObject("roSGNode", "ContentNode")
    content.url = m.top.videoUrl
    content.title = m.top.videoTitle
    content.streamFormat = detectStreamFormat(m.top.videoUrl)
    m.video.content = content
    m.video.control = "play"
end sub

function detectStreamFormat(url as string) as string
    cleanUrl = LCase(url)
    queryAt = Instr(1, cleanUrl, "?")
    if queryAt > 0 then cleanUrl = Left(cleanUrl, queryAt - 1)
    hashAt = Instr(1, cleanUrl, "#")
    if hashAt > 0 then cleanUrl = Left(cleanUrl, hashAt - 1)
    if Right(cleanUrl, 5) = ".m3u8" then return "hls"
    if Right(cleanUrl, 4) = ".mpd" then return "dash"
    if Right(cleanUrl, 4) = ".mkv" then return "mkv"
    if Right(cleanUrl, 5) = ".webm" then return "webm"
    return "mp4"
end function

sub updateTitle()
    m.title.text = m.top.videoTitle
end sub

sub onVideoState()
    state = m.video.state
    if state = "playing" and not m.resumeApplied
        m.resumeApplied = true
        if m.top.resumePosition > 10 then m.video.seek = m.top.resumePosition
    end if
    if state = "buffering"
        m.status.text = "Cargando video…"
    else if state = "playing"
        m.status.text = ""
    else if state = "paused"
        m.status.text = "Pausado"
        saveProgress(false)
    else if state = "error"
        m.status.text = "No se pudo reproducir este archivo. Comprueba el formato y la conexión. Presiona Atrás para volver al catálogo."
        saveProgress(true)
    else if state = "finished"
        closePlayer()
    end if
end sub

sub onPositionChanged()
    saveProgress(false)
end sub

' Save every 15 seconds and also checkpoint immediately on pause/exit.
' If a network write is already running, retain the newest checkpoint and
' send it after the current request completes so an older write cannot win.
sub saveProgress(force as boolean)
    position = m.video.position
    if position = invalid or position < 5 then return
    if m.top.deviceToken = invalid or m.top.deviceToken = "" then return
    if m.top.contentType <> "movie" and m.top.contentType <> "episode" then return
    if not force and position - m.lastSavedPosition < 15 then return

    durationSeconds = 0
    if m.video.duration <> invalid and m.video.duration > 0 then durationSeconds = Int(m.video.duration)

    if m.progressTask <> invalid
        m.pendingPosition = Int(position)
        m.pendingDuration = durationSeconds
        return
    end if
    startProgressTask(Int(position), durationSeconds)
end sub

sub startProgressTask(positionSeconds as integer, durationSeconds as integer)
    m.progressTask = CreateObject("roSGNode", "ProgressTask")
    m.progressTask.deviceToken = m.top.deviceToken
    m.progressTask.contentId = m.top.contentId
    m.progressTask.contentType = m.top.contentType
    m.progressTask.positionSeconds = positionSeconds
    m.progressTask.durationSeconds = durationSeconds
    m.progressTask.ObserveField("completed", "onProgressSaved")
    m.top.AppendChild(m.progressTask)
    m.progressTask.control = "RUN"
    m.lastSavedPosition = positionSeconds
end sub

sub onProgressSaved()
    if m.progressTask <> invalid
        m.top.RemoveChild(m.progressTask)
        m.progressTask = invalid
    end if
    if m.pendingPosition <> invalid
        nextPosition = m.pendingPosition
        nextDuration = m.pendingDuration
        m.pendingPosition = invalid
        m.pendingDuration = 0
        startProgressTask(nextPosition, nextDuration)
    end if
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if press and key = "back"
        closePlayer()
        return true
    end if
    return false
end function

sub closePlayer()
    if m.top.wasClosed then return
    saveProgress(true)
    m.top.wasClosed = true
    m.video.control = "stop"
    m.top.visible = false
end sub
