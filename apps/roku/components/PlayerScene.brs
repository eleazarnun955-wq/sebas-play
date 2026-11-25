sub init()
    m.video = m.top.FindNode("video")
    m.lastSavedPosition = 0
    m.resumeApplied = false
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
    m.video.ObserveField("position", "onPositionChanged")
    if m.top.videoUrl <> "" then startPlayback()
end sub

sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then return
    content = CreateObject("roSGNode", "ContentNode")
    content.Url = m.top.videoUrl
    content.Title = m.top.videoTitle
    content.StreamFormat = "auto"
    m.video.content = content
    m.video.control = "play"
end sub

sub updateTitle()
    if m.top.videoTitle <> invalid then m.video.content.Title = m.top.videoTitle
end sub

sub onVideoState()
    state = m.video.state
    if state = "playing" and not m.resumeApplied
        m.resumeApplied = true
        if m.top.resumePosition > 10
            m.video.seek = m.top.resumePosition
        end if
    end if
    if state = "finished" or state = "error"
        m.video.control = "stop"
        m.top.wasClosed = true
        m.top.RemoveFromParent()
    end if
end sub

sub onPositionChanged()
    position = m.video.position
    if position = invalid or position < 5 then return
    if position - m.lastSavedPosition < 15 then return
    if m.top.deviceToken = invalid or m.top.deviceToken = "" then return
    if m.top.contentType <> "movie" and m.top.contentType <> "episode" then return
    if m.progressTask <> invalid then return

    duration = m.video.duration
    durationSeconds = 0
    if duration <> invalid and duration > 0 then durationSeconds = Int(duration)
    m.progressTask = CreateObject("roSGNode", "ProgressTask")
    m.progressTask.deviceToken = m.top.deviceToken
    m.progressTask.contentId = m.top.contentId
    m.progressTask.contentType = m.top.contentType
    m.progressTask.positionSeconds = Int(position)
    m.progressTask.durationSeconds = durationSeconds
    m.progressTask.ObserveField("completed", "onProgressSaved")
    m.top.AppendChild(m.progressTask)
    m.progressTask.control = "RUN"
    m.lastSavedPosition = position
end sub

sub onProgressSaved()
    if m.progressTask <> invalid
        m.top.RemoveChild(m.progressTask)
        m.progressTask = invalid
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
