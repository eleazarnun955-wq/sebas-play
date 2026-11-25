sub init()
    m.video = m.top.FindNode("video")
    m.title = m.top.FindNode("title")
    m.top.ObserveField("videoUrl", "startPlayback")
    m.top.ObserveField("videoTitle", "updateTitle")
    m.video.ObserveField("state", "onVideoState")
end sub
sub startPlayback()
    if m.top.videoUrl = invalid or m.top.videoUrl = "" then return
    content = CreateObject("roSGNode", "ContentNode")
    content.url = m.top.videoUrl
    content.title = m.top.videoTitle
    content.streamFormat = "mp4"
    m.video.content = content
    m.video.control = "play"
end sub
sub updateTitle()
    m.title.text = m.top.videoTitle
end sub
sub onVideoState()
    if m.video.state = "finished" or m.video.state = "error" then
        m.top.wasClosed = true
        m.top.visible = false
    end if
end sub
