# SEBAS PLAY — servidor multimedia para Windows 10

Servidor ligero sin dependencias npm. Transmite archivos locales con soporte HTTP Range (necesario para búsqueda y reanudación en reproductores).

## Requisitos

El servidor fue validado con una prueba automatizada de salud, autenticación de catálogo, firma de URL y lectura parcial HTTP Range.

- Windows 10 actualizado.
- Node.js LTS instalado.
- Archivos de video propios, de dominio público o con autorización de distribución.
- Para reproducción desde fuera de casa: URL pública HTTPS estable. No expongas directamente el puerto 8787 a internet.

## Instalación

1. Copia la carpeta `server/windows-media` a la laptop.
2. Instala Node.js LTS desde https://nodejs.org/.
3. Copia `server-config.example.bat` y renombra la copia a `server-config.bat`.
4. Genera dos valores aleatorios largos y reemplaza `SEBAS_ACCESS_TOKEN` y `SEBAS_SIGNING_SECRET`. No compartas el archivo de configuración.
5. Coloca videos MP4/M4V/MOV/WebM en `Peliculas` (puedes crear subcarpetas).
6. Ejecuta `start-server.bat`.
7. Comprueba `http://localhost:8787/health` desde la laptop.

## Catálogo y publicación

El panel administrador puede consultar `GET /api/catalog` enviando `Authorization: Bearer TU_ACCESS_TOKEN`. La respuesta incluye `stream_url` firmadas. Copia la URL de la película correspondiente en el campo de video del catálogo de SEBAS PLAY y publícala solo después de comprobar que tienes derechos de distribución. La aplicación Android y el canal Roku leen el mismo catálogo Supabase; no se deben subir los videos a Supabase Storage.

Las URLs firmadas duran 30 días por defecto. Si cambias el archivo o la ruta, vuelve a consultar el catálogo para generar otra URL. Ajusta `SEBAS_URL_TTL_SECONDS` si necesitas otro plazo.

## Acceso desde Roku y fuera de casa

Para probar dentro de casa, abre la URL del servidor usando la IP local de la laptop (por ejemplo `http://192.168.1.50:8787`) y configura `SEBAS_PUBLIC_BASE_URL` con esa URL. Reserva una IP local para la laptop en el router.

Para ver desde internet, usa un túnel HTTPS (recomendado: Cloudflare Tunnel con hostname propio) y configura `SEBAS_PUBLIC_BASE_URL` con el hostname HTTPS final. El túnel debe apuntar a `http://localhost:8787`. No publiques `/api/catalog` sin el token; protege el acceso de administración. Una URL de túnel temporal puede cambiar y dejar inválidas las URLs guardadas.

## Compatibilidad y límites

- Recomendado: MP4 con video H.264 y audio AAC para mayor compatibilidad Android/Roku.
- Se admite Range/206 para que el reproductor pueda buscar y reanudar.
- No se transcodifica video. MKV/AVI y códecs no compatibles deben convertirse a MP4 H.264/AAC antes de agregarlos.
- La laptop debe permanecer encendida, sin suspensión, y con internet.
- El rendimiento remoto depende principalmente de la velocidad de subida de tu conexión.
- No se incluye un servicio de publicación Roku Store ni se afirma compatibilidad hasta probar en un Roku físico/emulador.
