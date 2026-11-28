sub Main(args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.SetMessagePort(port)
    scene = screen.CreateScene("HomeScene")
    if type(args) = "roAssociativeArray" and args.DoesExist("contentId")
        scene.launchContentId = args.contentId
        scene.launchMediaType = args.mediaType
    end if
    screen.Show()
    while true
        msg = wait(0, port)
        if type(msg) = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub
