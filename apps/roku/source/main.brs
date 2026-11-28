sub Main(args as dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.SetMessagePort(port)
    input = CreateObject("roInput")
    input.SetMessagePort(port)
    scene = screen.CreateScene("HomeScene")

    ' Initial ECP launch: deliver both laptop values atomically.
    if type(args) = "roAssociativeArray"
        launchConnection = {}
        if args.DoesExist("laptopUrl") then launchConnection.laptopUrl = args.laptopUrl
        if args.DoesExist("laptopToken") then launchConnection.laptopToken = args.laptopToken
        if launchConnection.DoesExist("laptopUrl") and launchConnection.DoesExist("laptopToken")
            scene.launchConnection = launchConnection
        end if
        if args.DoesExist("contentId") then scene.launchContentId = args.contentId
        if args.DoesExist("mediaType") then scene.launchMediaType = args.mediaType
    end if

    screen.Show()
    while true
        msg = wait(0, port)
        if type(msg) = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        else if type(msg) = "roInputEvent"
            if msg.IsInput()
                info = msg.GetInfo()
                if type(info) = "roAssociativeArray"
                    launchConnection = {}
                    if info.DoesExist("laptopUrl") then launchConnection.laptopUrl = info.laptopUrl
                    if info.DoesExist("laptopToken") then launchConnection.laptopToken = info.laptopToken
                    if launchConnection.DoesExist("laptopUrl") and launchConnection.DoesExist("laptopToken")
                        scene.launchConnection = launchConnection
                    end if
                end if
            end if
        end if
    end while
end sub
