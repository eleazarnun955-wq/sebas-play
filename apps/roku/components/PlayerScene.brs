sub init()
    m.video = m.top.FindNode("video")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
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
    if state = "finished" or state = "error"
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
