sub init()
    m.top.functionName = "saveProgress"
end sub

sub saveProgress()
    if safeString(m.top.syncToken) = "" or safeString(m.top.contentId) = "" then return
    payload = {
        action: "progress",
        content_type: safeString(m.top.contentType),
        content_id: safeString(m.top.contentId),
        position_seconds: m.top.positionSeconds
    }
    if m.top.durationSeconds > 0 then payload.duration_seconds = m.top.durationSeconds
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetMinimumTransferRate(1, 20)
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Authorization", "Bearer " + safeString(m.top.syncToken))
    transfer.AddHeader("Content-Type", "application/json")
    transfer.PostFromString(FormatJson(payload))
end sub

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
