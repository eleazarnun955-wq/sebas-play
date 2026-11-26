# SEBAS PLAY — servidor multimedia para Windows 10

Instalador de un clic para Windows 10 de 32 o 64 bits. No requiere instalar Node.js manualmente ni reinstalar Windows.

## Instalación sencilla

1. Descarga y extrae el paquete completo.
2. Haz doble clic en INSTALAR-SEBAS-PLAY.bat.
3. El asistente descarga el motor Node.js oficial de 32 bits y verifica su SHA-256.
4. Cuando aparezca la ventana de carpetas, elige la carpeta principal donde guardas tus películas y series. También se revisan sus subcarpetas.
5. Acepta la regla del Firewall para redes privadas si Windows la solicita.
6. Decide si quieres activar el inicio automático al entrar a Windows. Si respondes No, puedes iniciar el servidor manualmente con start-server.bat.

El servidor se inicia y abre la página de estado. El inicio automático es opcional y solo se configura si lo autorizas durante la instalación; puedes quitarlo en cualquier momento con QUITAR-INICIO-AUTOMATICO.bat. El servidor actualiza automáticamente el índice de archivos compatibles cada 30 segundos (configurable), reutiliza los metadatos de archivos sin cambios y detecta altas, cambios y eliminaciones. También permite forzar una actualización autenticada con `POST /api/scan`. Nunca mueve ni borra archivos.

## Conexión en casa

La laptop y los dispositivos deben estar conectados a la misma red Wi-Fi. El servidor muestra la dirección local de la laptop, por ejemplo http://192.168.1.15:8787. No uses localhost desde el teléfono o Roku.

El archivo SEBAS-PLAY-ACCESS-TOKEN.txt contiene el token privado que se introduce en el panel administrador de SEBAS PLAY. El panel lo envía exclusivamente en el encabezado Authorization: Bearer; el servidor rechaza tokens en parámetros de URL. No lo compartas. El estado avanzado autenticado está disponible en `/api/status` e informa cantidad de medios indexados, sesiones de reproducción y espacio libre. También se añadió detección segura de FFmpeg opcional en `/api/status` y `/api/capabilities`: informa si ya existe en PATH y su versión, pero no lo instala, no descarga ejecutables ni inicia transcodificación. Si no está disponible, la reproducción directa continúa funcionando.

## Android y Roku

Android y Roku siguen usando sus aplicaciones independientes y el catálogo compartido de Supabase. En el panel administrador se importa el catálogo local, se revisan las fichas y se publican las películas/episodios autorizados. No se suben los videos a Supabase Storage.

Roku usa su reproductor nativo; se recomienda MP4 H.264/AAC. No hay transcodificación. Formatos admitidos por el servidor: MP4, M4V, MOV y WebM.

## Acceso desde fuera de casa

La primera instalación configura la red local. Para reproducir desde fuera de casa se necesita un hostname HTTPS estable y un túnel/proxy (por ejemplo, Cloudflare Tunnel). Ese servicio externo requiere una cuenta y autorización del usuario; no se activa sin esas credenciales. No abras el puerto 8787 directamente a Internet.

## Seguridad y mantenimiento

- Las claves privadas permanecen en server-config.bat y SEBAS-PLAY-ACCESS-TOKEN.txt, dentro de la laptop.
- No publiques esos archivos ni los copies a Android, Roku, Supabase o GitHub.
- La laptop debe permanecer encendida y sin suspensión mientras transmite.
- El instalador no modifica ni reemplaza las aplicaciones Android/Roku.
- Para iniciar manualmente, usa start-server.bat.
- Para desactivar el inicio automático sin borrar nada, ejecuta QUITAR-INICIO-AUTOMATICO.bat.
- Para detener el servidor en ejecución, cierra la ventana minimizada SEBAS PLAY Media Server o reinicia Windows.

Aloja únicamente contenido propio, de dominio público o con autorización/licencia para distribuirlo.


### Metadatos locales NFO

El indexador busca un archivo NFO con el mismo nombre base que cada video. Si existe, lee de forma segura (máximo 256 KiB) título, sinopsis, año, clasificación, géneros y duración; los pasa al borrador del catálogo al importar. No necesita claves de API ni conexión con servicios externos. Los archivos NFO nunca se modifican y los cambios en el sidecar se detectan en el siguiente escaneo. Si no existe NFO, la reproducción y la importación básica siguen funcionando.
### Conversión opcional con FFmpeg

Si FFmpeg está instalado en Windows y disponible en PATH, el servidor permite crear una copia MP4 H.264/AAC compatible mediante la API administrativa autenticada:

- `POST /api/transcode` con JSON `{"file":"ruta/relativa/al/video.mkv","profile":"roku"}` o `"mobile"`.
- La respuesta entrega un identificador de trabajo; consulta `GET /api/transcode/{id}` para revisar el estado.
- El perfil Roku limita el ancho a 1920 px; el perfil móvil a 1280 px. Ambos usan H.264, AAC y MP4 con fast-start.
- El resultado se guarda en `Transcodificados` dentro de la biblioteca y aparece en el siguiente escaneo.
- Solo se aceptan archivos que ya estén en el índice de la biblioteca; no se aceptan rutas arbitrarias. Solo se ejecuta una conversión a la vez.
- Si FFmpeg no está instalado, el endpoint responde que no está disponible; la reproducción directa no se desactiva.

El endpoint no descarga ni instala FFmpeg. Instálalo desde una distribución confiable, agrega su carpeta `bin` al PATH de Windows y reinicia el servidor para que lo detecte.
