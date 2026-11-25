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
    content.streamFormat = detectStreamFormat(m.top.videoUrl)
    m.video.content = content
    m.video.control = "play"
end sub

function detectStreamFormat(url as string) as string
    cleanUrl = LCase(url)
    queryAt = Instr(1, cleanUrl, "?")
    if queryAt > 0 then cleanUrl = Left(cleanUrl, queryAt - 1)
    if Right(cleanUrl, 5) = ".m3u8" then return "hls"
    if Right(cleanUrl, 4) = ".mpd" then return "dash"
    if Right(cleanUrl, 4) = ".mkv" then return "mkv"
    if Right(cleanUrl, 4) = ".web" then return "webm"
    return "mp4"
end function

sub updateTitle()
    m.title.text = m.top.videoTitle
end sub

sub onVideoState()
    if m.video.state = "finished" or m.video.state = "error"
        m.top.wasClosed = true
        m.top.visible = false
    end if
end sub
