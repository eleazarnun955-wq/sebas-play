sub init()
    m.top.functionName = "updateFavorite"
end sub

sub updateFavorite()
    if m.top.deviceToken = invalid or m.top.deviceToken = "" or m.top.contentId = invalid or m.top.contentId = "" then
        m.top.errorMessage = "Vincula tu Roku y selecciona un elemento válido."
        m.top.completed = true
        return
    end if
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetTimeout(10)
    request.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    request.SetRequest("POST")
    request.AddHeader("apikey", SebasPlayPublishableKey())
    request.AddHeader("Authorization", "Bearer " + m.top.deviceToken)
    request.AddHeader("Content-Type", "application/json")
    payload = { action: "favorite", content_type: m.top.contentType, content_id: m.top.contentId, operation: m.top.operation }
    response = request.PostFromString(FormatJson(payload))
    code = request.GetResponseCode()
    if response = invalid or response = "" or code < 200 or code >= 300 then
        m.top.errorMessage = "No se pudo actualizar Mi lista (HTTP " + code.ToStr() + ")."
        m.top.completed = true
        return
    end if
    parsed = ParseJson(response)
    if parsed = invalid or parsed.ok <> true then
        if parsed <> invalid and parsed.error <> invalid then
            m.top.errorMessage = parsed.error
        else
            m.top.errorMessage = "No se pudo actualizar el favorito."
        end if
    end if
    m.top.completed = true
end sub
