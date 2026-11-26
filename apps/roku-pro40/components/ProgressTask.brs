sub init()
    m.top.functionName = "saveProgress"
end sub

sub saveProgress()
    if m.top.deviceToken = invalid or m.top.deviceToken = "" or m.top.contentId = invalid or m.top.contentId = "" then
        m.top.errorMessage = "Faltan datos del dispositivo o contenido."
        m.top.completed = true
        return
    end if
    payload = {
        action: "progress",
        content_type: m.top.contentType,
        content_id: m.top.contentId,
        position_seconds: m.top.positionSeconds
    }
    if m.top.durationSeconds > 0 then payload.duration_seconds = m.top.durationSeconds

    ' Retry once after transient network failures. A checkpoint is successful
    ' only when the HTTP status is 2xx and the API explicitly acknowledges it.
    for attempt = 1 to 2
        request = CreateObject("roUrlTransfer")
        request.SetCertificatesFile("common:/certs/ca-bundle.crt")
        request.InitClientCertificates()
        request.SetTimeout(10)
        request.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
        request.SetRequest("POST")
        request.AddHeader("apikey", SebasPlayPublishableKey())
        request.AddHeader("Authorization", "Bearer " + m.top.deviceToken)
        request.AddHeader("Content-Type", "application/json")
        response = request.PostFromString(FormatJson(payload))
        code = request.GetResponseCode()
        if response <> invalid and response <> "" and code >= 200 and code < 300
            parsed = ParseJson(response)
            if parsed <> invalid and parsed.ok = true
                m.top.errorMessage = ""
                m.top.completed = true
                return
            end if
            if parsed <> invalid and parsed.error <> invalid then m.top.errorMessage = parsed.error
        else
            m.top.errorMessage = "No se pudo sincronizar el progreso (HTTP " + code.ToStr() + ")."
        end if
        if attempt = 1 then sleep(300)
    end for
    m.top.completed = true
end sub
