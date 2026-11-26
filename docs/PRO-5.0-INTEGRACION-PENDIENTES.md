# SEBAS PLAY PRO 5.0 — integración de mejoras pendientes

Esta lista pertenece a la rama independiente `sebas-play-pro50-independent-20261125`. La entrega se considera terminada solo cuando el conjunto completo pase CI y las pruebas físicas de Windows 10, Android y Roku. No se deben publicar cambios parciales como versión final.

## Protección obligatoria
- PRO 5.0 conserva un applicationId propio y debe instalarse junto a PRO 4.0.
- No modificar `main`, no fusionar el PR ni aplicar cambios de esquema a Supabase de producción sin autorización expresa.
- No mover, renombrar ni borrar películas originales de la laptop.
- La transcodificación debe ser bajo demanda, opcional y conservar siempre el archivo original.
- Android y Roku deben consultar el mismo catálogo y nunca presentar páginas HTML/embed como si fueran archivos reproducibles.

## Estado heredado comprobado
- Servidor Windows: índice local, escaneo manual autenticado, enlaces HMAC y HTTP Range; vigilancia incremental de altas/cambios/eliminaciones con reconciliación periódica y apagado ordenado probado por CI. Las pruebas también verifican rechazo de tokens en URL, firmas vencidas/manipuladas, traversal firmado y exclusión de enlaces simbólicos.
- Android: acceso directo “Mi laptop”, importación al catálogo como borrador, reproductor VLC cuando está disponible, historial y favoritos para usuarios autenticados. El progreso se registra/reanuda en el reproductor integrado; la reproducción delegada a VLC externo no reporta posición a la app.
- Roku: consulta paginada de Supabase, filtro de URLs directas y estados básicos de reproducción. Se activó la interfaz nativa de controles del Video node para pausa/búsqueda y opciones de pistas compatibles con cada dispositivo; falta validación física en Roku.
- APK PRO 5.0: compilación previa exitosa y verificación de identidad del paquete Android.
- Roku PRO 5.0: identidad del manifest configurada; pairing seguro integrado en código y falta validación física del canal.

## Trabajo que debe quedar integrado antes de la entrega única
1. Escaneo de biblioteca: vigilancia incremental, reconciliación segura y pruebas de altas/cambios/eliminaciones sin tocar archivos. Implementado y probado en CI; el escaneo periódico se conserva como respaldo.
2. Reproductor profesional: controles y estados coherentes; subtítulos/pistas cuando el dispositivo los soporte; reanudación robusta y manejo de errores.
3. Sincronización Android/Roku: backend de vinculación segura, códigos temporales de un solo uso, tokens revocables y lectura/escritura de favoritos/progreso implementados. Falta completar pruebas físicas y los perfiles múltiples siguen pendientes.
4. Metadatos: proveedor configurable, caché y edición manual protegida contra sobrescritura automática.
5. Servidor Windows: instalación/arranque automático opcional y recuperación tras reinicio. El instalador ahora solicita consentimiento explícito antes de crear el acceso directo de inicio; responder No conserva el arranque manual. La desactivación reversible elimina únicamente ese acceso directo. El contrato se prueba en CI; falta validación física de instalación, reinicio y recuperación en Windows 10.
6. Transcodificación: FFmpeg opcional, verificación de disponibilidad, cola/concurrencia limitada, caché temporal y limpieza segura.
7. EPG: importación XMLTV configurable, mapeo de canales, zona horaria y actualización programada.
8. Perfiles: perfiles locales/de cuenta, PIN almacenado solo como hash y RLS probado por propietario.
9. Interfaz: rediseño coherente en Android y Roku sin romper “Mi laptop”, el catálogo ni la reproducción.

## Criterios de salida
- CI verde para build Android/web, pruebas del servidor y verificaciones de identidad.
- Pruebas automatizadas de seguridad del servidor local: token administrativo solo en encabezado, traversal firmado rechazado, enlaces simbólicos excluidos, enlaces HMAC vencidos/manipulados rechazados y rutas confinadas a la biblioteca. Las tablas de vinculación Roku tienen RLS y denegación directa para clientes; la función Edge verifica al usuario y el token de dispositivo. Falta prueba física del flujo completo.
- Pruebas con archivos reales MP4/H.264/AAC y un formato que requiera transcodificación.
- Pruebas físicas de catálogo y reproducción en Windows 10, Android y Roku, incluida una biblioteca mayor a 300 elementos.
- Confirmar que ambas APK se instalan simultáneamente y que la nueva no solicita reemplazar PRO 4.0.

Este documento es un registro de alcance y aceptación, no una afirmación de que las nueve funciones ya estén implementadas. El escaneo incremental, el apagado ordenado, la solicitud explícita de consentimiento para el inicio automático y las pruebas automatizadas de confinamiento de rutas/enlaces simbólicos están implementados y pasan CI; siguen pendientes las demás integraciones indicadas.

## Sincronización personal — avance de implementación

- Las tablas existentes `favorites` y `watch_progress` ya tienen índices únicos por usuario/tipo/ID y políticas RLS de lectura/escritura/actualización/borrado por `auth.uid()`.
- Android ya carga favoritos e historial desde Supabase al iniciar sesión y guarda el progreso del reproductor. Se añadió refresco de la biblioteca personal cada 15 segundos mientras la app está visible y al volver a primer plano, usando la misma cuenta.
- El refresco no requiere cambios de esquema y no altera datos de producción.
- La publicación `supabase_realtime` no incluye actualmente `favorites` ni `watch_progress`; se dejó polling como alternativa segura, sin modificar la publicación de producción.
- Roku PRO 5.0 consulta el catálogo público como cliente anónimo y usa un token de dispositivo revocable para la biblioteca personal. No recibe ni guarda contraseñas ni JWT de usuario. La vinculación y sincronización están integradas en código, pero deben validarse en un Roku físico antes de considerarlas finalizadas.

## Vinculación Roku — avance 25-nov-2026

- Se añadieron en Supabase las tablas privadas `device_pairing_sessions` y `paired_devices`, ambas con RLS activo, sin permisos directos para `anon`/`authenticated` y políticas deny-all explícitas. El acceso queda limitado al rol de servicio dentro de la función Edge.
- Se desplegó `roku-device-sync`: genera códigos de 12 caracteres válidos por cinco minutos para una cuenta autenticada; el código es de un solo uso; el Roku recibe un token aleatorio que solo se almacena como hash en la base de datos y se puede revocar desde Android.
- Android PRO 5.0 incluye generación de código y lista/revocación de dispositivos. Roku PRO 5.0 incluye pantalla de vinculación, guarda el token en su registro privado, consulta favoritos/progreso y envía progreso de películas/episodios cada 15 segundos.
- La función no entrega credenciales Supabase al Roku ni permite consultar datos de otra cuenta. La sincronización solo queda confirmada cuando se complete la prueba física de emparejamiento, favoritos, progreso y revocación en el dispositivo Roku.
- El empaquetado de Roku y CI deben validar los nuevos componentes. No se debe marcar el trabajo como terminado hasta que pasen ambos workflows y las pruebas físicas.

## Validación automatizada de vinculación

- Se agregó `scripts/verify-pro50-pairing.mjs` a CI para comprobar acciones de la función Edge, hash de tokens, vencimiento/uso único de códigos, revocación, RLS, y cableado de Android/Roku.
- Las migraciones de pairing ya están registradas tanto en el proyecto Supabase como en `supabase/migrations/` del repositorio.
- La alerta de Supabase que permanece activa es la protección de contraseñas filtradas deshabilitada; es una configuración global de Auth ajena al pairing y no se cambió automáticamente.


## Mejora de checkpoints de reproducción Roku — 26-nov-2026

- El reproductor ahora guarda un checkpoint al pausar, al salir y ante un error, además del guardado periódico.
- Si ya hay una petición de progreso en curso, conserva el checkpoint más reciente y lo envía al terminar la petición anterior; así evita que una escritura antigua sobrescriba la posición final más reciente.
- Se añadieron verificaciones de regresión estáticas en `scripts/verify-pro50-pairing.mjs` para proteger este comportamiento.
- Pendiente: compilar/empaquetar Roku y probar pausa, salida, error y reanudación en hardware real. La prueba estática no sustituye la validación en un Roku físico.


## Detección opcional de FFmpeg — 26-nov-2026

- El servidor Windows ahora consulta `ffmpeg -version` mediante `execFile` (sin shell), con tiempo límite de 2.5 segundos y resultado cacheado durante la vida del proceso.
- Se expone el estado autenticado en `/api/status` y `/api/capabilities`; el panel de administración muestra si FFmpeg está disponible y su versión.
- No se instala ni descarga FFmpeg y no se ejecuta transcodificación. La reproducción directa y HTTP Range continúan disponibles aunque FFmpeg no exista.
- La prueba del servidor valida respuesta, autenticación y forma del resultado sin depender de que el ejecutable esté instalado.
- Pendiente: diseñar y probar transcodificación bajo demanda, con límites de concurrencia, archivos temporales separados y limpieza segura; requerirá confirmar explícitamente cualquier instalación en la laptop.


## Favoritos desde Roku — 26-nov-2026

- La pantalla principal de Roku añade la acción «Agregar / quitar de Mi lista» para el elemento enfocado.
- La acción usa el token de dispositivo revocable y la función `roku-device-sync`; nunca transmite la sesión ni contraseña de Supabase.
- La operación add/remove se determina con la lista sincronizada de la cuenta y, tras guardar, se vuelve a consultar la biblioteca personal.
- Para episodios, el favorito se guarda a nivel de serie cuando existe el identificador de serie.
- CI comprueba el cableado del control y la solicitud autenticada. Falta validar el flujo con control remoto en Roku físico, incluyendo favoritos creados desde Android y reflejados en Roku y viceversa.


## Metadatos locales NFO — 26-nov-2026

- El indexador Windows lee opcionalmente el sidecar NFO con el mismo nombre base del video (límite 256 KiB).
- Extrae título, sinopsis, año, clasificación, géneros y duración; Android los copia al crear el borrador de película.
- Detecta cambios en el NFO en el siguiente escaneo, no altera el video ni el archivo NFO y no requiere API key.
- Se añadieron pruebas de extracción, entidades XML/CDATA y actualización del sidecar. Pendiente validar con colecciones reales y distintos formatos NFO de Kodi/Jellyfin.
- Los metadatos automáticos en línea y posters externos siguen pendientes; no se exige una clave TMDB para que la app funcione.


## XMLTV — parser base opcional — 25-nov-2026

- Se añadió un parser XMLTV independiente con límites de 8 MB y 10,000 programas, validación de fechas y offsets horarios, lectura de canales/nombres, títulos, descripciones y categorías.
- Descarta registros mal formados, fechas invertidas y programas fuera de la ventana de 14 días hacia delante / 24 horas hacia atrás; no requiere EPG para el funcionamiento normal.
- Hay pruebas de regresión para entidades/CDATA, canales, offsets, fechas inválidas y límites de tamaño, ejecutadas en CI y en el workflow del servidor Windows.
- **Todavía no está conectado a una pantalla de configuración ni a la guía visual Android/Roku**. No descarga URLs externas ni hace peticiones de red; falta la capa segura de importación/configuración y mapeo de canales.


## Perfiles familiares y PIN — preparación segura — 26-nov-2026

- Se verificó el esquema real: `profiles` actual representa una fila por cuenta Auth (su ID referencia `auth.users`), no perfiles infantiles/familiares. Favoritos y progreso todavía se autorizan por `user_id`, y Roku vinculado también se asocia únicamente a la cuenta.
- Se añadió `supabase/sql/pro50-family-profiles-draft.sql` como borrador no aplicado: crea perfiles familiares, credenciales PIN separadas, perfil predeterminado y claves foráneas para aislar favoritos, progreso y dispositivos.
- Se añadió un helper PBKDF2-HMAC-SHA256 con sal aleatoria por PIN (310,000 iteraciones), comparación constante y validación de PIN de 4–8 dígitos; las pruebas están en `scripts/profile-pin-test.mjs`.
- **No está listo para producción**: los clientes Android/Roku aún consultan favoritos y progreso directamente por `user_id`; las políticas RLS actuales permitirían ver los datos de todos los perfiles de la misma cuenta. Antes de habilitar perfiles infantiles, esas lecturas/escrituras deben pasar por el Edge Function con perfil activo verificado y límite de intentos atómico en servidor. El PIN nunca debe validarse solo en el dispositivo.
- No se aplicó SQL ni se modificó el esquema de producción. El borrador debe revisarse y probarse en una rama/base de pruebas antes de generar una migración formal.


## Integración XMLTV opcional (avance PRO 5.0)
- El servidor Windows ahora expone `POST /api/epg/import` y `GET /api/epg`, ambos protegidos por el token administrativo en encabezado.
- El importador acepta XMLTV de hasta 8 MB, valida y limita canales/programas mediante el parser ya probado, y conserva la guía anterior si un archivo nuevo es inválido.
- La guía se guarda en `SEBAS_DATA_DIR/xmltv-guide.json` (por defecto `server/windows-media/data`), separada de los videos originales.
- El panel de administración incorpora selector de archivo XMLTV opcional. Sin importar un archivo, el servidor y la aplicación siguen funcionando como antes.
- El smoke test ahora valida autenticación, ausencia de EPG por defecto, importación, persistencia y rechazo de XML inválido.
- Pendiente: conectar la guía importada con la pantalla de programación en Android/Roku y validar con una guía real de proveedor; no se ha activado ninguna fuente externa ni se requiere URL/API key.
