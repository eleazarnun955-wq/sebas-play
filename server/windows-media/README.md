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
3. Ejecuta `setup-server.ps1` con PowerShell (si Windows bloquea el script, abre PowerShell en esa carpeta y ejecuta `powershell -ExecutionPolicy Bypass -File .\\setup-server.ps1`). El asistente genera claves seguras, `server-config.bat`, la carpeta `Peliculas` y el archivo privado `SEBAS-PLAY-ACCESS-TOKEN.txt`.
4. Ejecuta `start-server.bat`.
5. Comprueba `http://localhost:8787/health` desde la laptop.

## Subir desde Android o el panel web\n\nEn el panel administrador, conecta la laptop y usa el selector “Subir película desde este dispositivo”. El archivo viaja directamente a la carpeta Peliculas de Windows; el servidor limita cada archivo a 20 GiB por defecto. Al terminar, se crea o actualiza una ficha de película como borrador en el catálogo compartido.\n\n## Catálogo y publicación

El panel administrador puede consultar `GET /api/catalog` enviando `Authorization: Bearer TU_ACCESS_TOKEN`. La respuesta incluye `stream_url` firmadas. Copia la URL de la película correspondiente en el campo de video del catálogo de SEBAS PLAY y publícala solo después de comprobar que tienes derechos de distribución. La aplicación Android y el canal Roku leen el mismo catálogo Supabase; no se deben subir los videos a Supabase Storage.

Las URLs firmadas duran 30 días por defecto. Si cambias el archivo o la ruta, vuelve a consultar el catálogo para generar otra URL. Ajusta `SEBAS_URL_TTL_SECONDS` si necesitas otro plazo.

## Acceso desde Roku y fuera de casa

Puedes comprobar el servicio desde la laptop con `http://localhost:8787/health`. Sin embargo, el panel web y Android usan HTTPS y bloquean direcciones HTTP mixtas; Roku también necesita una URL HTTPS pública para el acceso remoto. Para integrar el catálogo y reproducir, configura un hostname HTTPS estable mediante Cloudflare Tunnel (recomendado) apuntando a `http://localhost:8787`, y coloca ese hostname en `SEBAS_PUBLIC_BASE_URL` y en el campo de conexión del panel. No publiques `/api/catalog` sin el token ni abras el puerto 8787 directamente a internet. Una URL de túnel temporal puede cambiar y dejar inválidas las URLs guardadas.

## Compatibilidad y límites

- Recomendado: MP4 con video H.264 y audio AAC para mayor compatibilidad Android/Roku.
- Se admite Range/206 para que el reproductor pueda buscar y reanudar.
- No se transcodifica video. MKV/AVI y códecs no compatibles deben convertirse a MP4 H.264/AAC antes de agregarlos.
- La laptop debe permanecer encendida, sin suspensión, y con internet.
- El rendimiento remoto depende principalmente de la velocidad de subida de tu conexión.
- No se incluye un servicio de publicación Roku Store ni se afirma compatibilidad hasta probar en un Roku físico/emulador.
