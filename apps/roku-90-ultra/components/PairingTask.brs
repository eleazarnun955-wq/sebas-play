sub init()
    m.top.functionName = "pairDevice"
end sub
sub pairDevice()
    code = UCase(Trim(m.top.code))
    if Len(code) <> 12 then
        m.top.errorMessage = "El código debe tener 12 caracteres."
        m.top.completed = true
        return
    end if
    payload = { action: "pair-device", code: code, device_name: m.top.deviceName }
    request = CreateObject("roUrlTransfer")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.SetTimeout(10)
    request.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    request.SetRequest("POST")
    request.AddHeader("apikey", SebasPlayPublishableKey())
    request.AddHeader("Content-Type", "application/json")
    response = request.PostFromString(FormatJson(payload))
    code = request.GetResponseCode()
    if response = invalid or response = "" or code < 200 or code >= 300 then
        m.top.errorMessage = "No se pudo conectar con el servicio de vinculación (HTTP " + code.ToStr() + ")."
        m.top.completed = true
        return
    end if
    parsed = ParseJson(response)
    if parsed = invalid or parsed.ok <> true or parsed.device_token = invalid or parsed.device_token = "" then
        if parsed <> invalid and parsed.error <> invalid then
            m.top.errorMessage = parsed.error
        else
            m.top.errorMessage = "El código no es válido o ya venció. Genera uno nuevo en Android."
        end if
        m.top.completed = true
        return
    end if
    token = parsed.device_token.ToStr()
    registry = CreateObject("roRegistrySection", "SEBASPLAY90ULTRA")
    registry.Write("device_token", token)
    registry.Write("device_name", m.top.deviceName)
    registry.Flush()
    m.top.deviceToken = token
    m.top.completed = true
end sub
