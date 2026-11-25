# SEBAS PLAY PRO 5.0 — integración de mejoras pendientes

Esta lista pertenece a la rama independiente `sebas-play-pro50-independent-20261125`. La entrega se considera terminada solo cuando el conjunto completo pase CI y las pruebas físicas de Windows 10, Android y Roku. No se deben publicar cambios parciales como versión final.

## Protección obligatoria
- PRO 5.0 conserva un applicationId propio y debe instalarse junto a PRO 4.0.
- No modificar `main`, no fusionar el PR ni aplicar cambios de esquema a Supabase de producción sin autorización expresa.
- No mover, renombrar ni borrar películas originales de la laptop.
- La transcodificación debe ser bajo demanda, opcional y conservar siempre el archivo original.
- Android y Roku deben consultar el mismo catálogo y nunca presentar páginas HTML/embed como si fueran archivos reproducibles.

## Estado heredado comprobado
- Servidor Windows: escaneo periódico, índice local, escaneo manual autenticado, enlaces HMAC y soporte HTTP Range.
- Android: acceso directo “Mi laptop”, importación al catálogo como borrador, reproductor VLC cuando está disponible, historial y favoritos para usuarios autenticados.
- Roku: consulta paginada de Supabase, filtro de URLs directas y estados básicos de reproducción.
- APK PRO 5.0: compilación previa exitosa y verificación de identidad del paquete Android.
- Roku PRO 5.0: identidad del manifest configurada; falta validación física del canal.

## Trabajo que debe quedar integrado antes de la entrega única
1. Escaneo de biblioteca: pasar de escaneo periódico completo a vigilancia incremental, con reconciliación segura y pruebas de altas/cambios/eliminaciones sin tocar archivos.
2. Reproductor profesional: controles y estados coherentes; subtítulos/pistas cuando el dispositivo los soporte; reanudación robusta y manejo de errores.
3. Sincronización real Android/Roku: progreso, vistos y favoritos con identidad de usuario/perfil compartida; no usar un usuario anónimo distinto por dispositivo como falsa sincronización.
4. Metadatos: proveedor configurable, caché y edición manual protegida contra sobrescritura automática.
5. Servidor Windows: instalación/arranque automático opcional, recuperación tras reinicio, salud y firewall limitado a red privada.
6. Transcodificación: FFmpeg opcional, verificación de disponibilidad, cola/concurrencia limitada, caché temporal y limpieza segura.
7. EPG: importación XMLTV configurable, mapeo de canales, zona horaria y actualización programada.
8. Perfiles: perfiles locales/de cuenta, PIN almacenado solo como hash y RLS probado por propietario.
9. Interfaz: rediseño coherente en Android y Roku sin romper “Mi laptop”, el catálogo ni la reproducción.

## Criterios de salida
- CI verde para build Android/web, pruebas del servidor y verificaciones de identidad.
- Pruebas automatizadas de seguridad: token administrativo solo en encabezado, rutas confinadas a la biblioteca y RLS por propietario.
- Pruebas con archivos reales MP4/H.264/AAC y un formato que requiera transcodificación.
- Pruebas físicas de catálogo y reproducción en Windows 10, Android y Roku, incluida una biblioteca mayor a 300 elementos.
- Confirmar que ambas APK se instalan simultáneamente y que la nueva no solicita reemplazar PRO 4.0.

Este documento es un registro de alcance y aceptación, no una afirmación de que las nueve funciones ya estén implementadas.

## Sincronización personal — avance de implementación

- Las tablas existentes `favorites` y `watch_progress` ya tienen índices únicos por usuario/tipo/ID y políticas RLS de lectura/escritura/actualización/borrado por `auth.uid()`.
- Android ya carga favoritos e historial desde Supabase al iniciar sesión y guarda el progreso del reproductor. Se añadió refresco de la biblioteca personal cada 15 segundos mientras la app está visible y al volver a primer plano, usando la misma cuenta.
- El refresco no requiere cambios de esquema y no altera datos de producción.
- La publicación `supabase_realtime` no incluye actualmente `favorites` ni `watch_progress`; se dejó polling como alternativa segura, sin modificar la publicación de producción.
- Roku PRO 5.0 todavía consulta el catálogo como cliente anónimo y no tiene inicio de sesión de usuario. Por ello no se debe afirmar que Roku sincroniza favoritos/progreso entre cuentas hasta implementar un flujo seguro de vinculación de TV y probarlo en un dispositivo físico. No se guardan contraseñas ni tokens de usuario en el código Roku.
