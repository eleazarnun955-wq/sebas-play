sub Main(args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.SetMessagePort(port)
    scene = screen.CreateScene("HomeScene")
    if type(args) = "roAssociativeArray"
        if args.DoesExist("laptopUrl") then scene.launchLaptopUrl = args.laptopUrl
        if args.DoesExist("laptopToken") then scene.launchLaptopToken = args.laptopToken
        if args.DoesExist("contentId") then scene.launchContentId = args.contentId
        if args.DoesExist("mediaType") then scene.launchMediaType = args.mediaType
    end if
    screen.Show()
    while true
        msg = wait(0, port)
        if type(msg) = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub
