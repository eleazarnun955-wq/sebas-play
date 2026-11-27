sub init()
    m.top.functionName = "runSync"
end sub

sub runSync()
    action = safeString(m.top.action)
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetMinimumTransferRate(1, 20)
    transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Content-Type", "application/json")
    response = ""
    if action = "sync"
        transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync?action=sync")
        transfer.AddHeader("Authorization", "Bearer " + safeString(m.top.deviceToken))
        transfer.AddHeader("Accept", "application/json")
        response = transfer.GetToString()
    else if action = "pair-device"
        transfer.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
        payload = m.top.payload
        response = transfer.PostFromString(FormatJson({ action: "pair-device", code: safeString(payload.code), device_name: "SEBAS PLAY Roku" }))
    else if action = "favorite"
        transfer.AddHeader("Authorization", "Bearer " + safeString(m.top.deviceToken))
        payload = m.top.payload
        response = transfer.PostFromString(FormatJson({ action: "favorite", content_type: safeString(payload.content_type), content_id: safeString(payload.content_id), operation: safeString(payload.operation) }))
    else
        m.top.errorMessage = "Operación de sincronización desconocida."
        return
    end if
    code = transfer.GetResponseCode()
    if code <> 200 or response = invalid or response = ""
        if code > 0
            m.top.errorMessage = "La sincronización respondió HTTP " + code.ToStr() + ". Inténtalo de nuevo."
        else
            m.top.errorMessage = "No se pudo contactar el servicio de sincronización. Revisa tu conexión."
        end if
        return
    end if
    m.top.response = response
end sub

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
