sub Main(args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.SetMessagePort(port)
    scene = screen.CreateScene("HomeScene")\n    if type(args) = "roAssociativeArray" and args.DoesExist("contentId")\n        scene.launchContentId = args.contentId\n        scene.launchMediaType = args.mediaType\n    end if
    screen.Show()
    while true
        msg = wait(0, port)
        if type(msg) = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub
