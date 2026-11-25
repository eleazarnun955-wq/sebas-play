sub init()
    m.top.functionName = "saveProgress"
end sub

sub saveProgress()
    if m.top.deviceToken = invalid or m.top.deviceToken = "" or m.top.contentId = invalid or m.top.contentId = "" then
        m.top.completed = true
        return
    end if
    payload = {
        action: "progress",
        content_type: m.top.contentType,
        content_id: m.top.contentId,
        position_seconds: m.top.positionSeconds,
        duration_seconds: m.top.durationSeconds
    }
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    request.SetRequest("POST")
    request.AddHeader("apikey", SebasPlayPublishableKey())
    request.AddHeader("Authorization", "Bearer " + m.top.deviceToken)
    request.AddHeader("Content-Type", "application/json")
    response = request.PostFromString(FormatJson(payload))
    if response <> invalid and response <> ""
        parsed = ParseJson(response)
        if parsed <> invalid and parsed.ok = true
            m.top.completed = true
            return
        end if
    end if
    m.top.completed = true
end sub
