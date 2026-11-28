sub init()
    m.top.functionName = "runSync"
end sub

' All account calls run in a SceneGraph Task with a strict timeout.
sub runSync()
    action = safeString(m.top.action)
    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetMinimumTransferRate(1, 10)
    transfer.AddHeader("apikey", SebasPlayPublishableKey())
    transfer.AddHeader("Content-Type", "application/json")
    if action = "sync"
        transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync?action=sync")
        transfer.AddHeader("Authorization", "Bearer " + safeString(m.top.deviceToken))
        transfer.AddHeader("Accept", "application/json")
        result = sendSyncRequest(transfer, "GET", "", 10000)
    else if action = "pair-device"
        transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
        transfer.AddHeader("Authorization", "Bearer " + SebasPlayAnonJwt())
        payload = m.top.payload
        body = FormatJson({ action: "pair-device", code: safeString(payload.code), device_name: "SEBAS PLAY Roku" })
        result = sendSyncRequest(transfer, "POST", body, 10000)
    else if action = "favorite"
        transfer.SetUrl(SebasPlaySupabaseUrl() + "/functions/v1/roku-device-sync")
        transfer.AddHeader("Authorization", "Bearer " + safeString(m.top.deviceToken))
        payload = m.top.payload
        body = FormatJson({ action: "favorite", content_type: safeString(payload.content_type), content_id: safeString(payload.content_id), operation: safeString(payload.operation) })
        result = sendSyncRequest(transfer, "POST", body, 10000)
    else
        m.top.errorMessage = "Operación de sincronización desconocida."
        return
    end if
    if result.timedOut
        m.top.errorMessage = "La sincronización tardó más de 10 segundos. La pantalla sigue disponible; vuelve a intentarlo."
        return
    end if
    if result.code <> 200 or result.body = invalid or result.body = ""
        if result.code > 0
            m.top.errorMessage = "La sincronización respondió HTTP " + result.code.ToStr() + ". Inténtalo de nuevo."
        else
            m.top.errorMessage = "No se pudo contactar el servicio de sincronización. Revisa tu conexión."
        end if
        return
    end if
    m.top.response = result.body
end sub

function sendSyncRequest(transfer as object, method as string, body as string, timeoutMs as integer) as object
    port = CreateObject("roMessagePort")
    transfer.SetMessagePort(port)
    if method = "GET"
        started = transfer.AsyncGetToString()
    else
        started = transfer.AsyncPostFromString(body)
    end if
    if not started then return { code: 0, body: "", timedOut: false }
    event = Wait(timeoutMs, port)
    if event = invalid
        transfer.AsyncCancel()
        return { code: 0, body: "", timedOut: true }
    end if
    return { code: event.GetResponseCode(), body: event.GetString(), timedOut: false }
end function

function safeString(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function
