# SEBAS PLAY — servidor multimedia para Windows 10

Servidor ligero sin dependencias npm. Transmite archivos locales con soporte HTTP Range para búsqueda y reanudación en reproductores.

## Requisitos

- Windows 10 actualizado.
- Node.js LTS.
- Archivos de vídeo propios, de dominio público o con autorización de distribución.
- Para reproducción remota: dominio HTTPS estable y VPS con transferencia suficiente. No expongas directamente el puerto 8787 a Internet.

## Instalación

1. Copia la carpeta `server/windows-media` a la laptop.
2. Instala Node.js LTS desde https://nodejs.org/.
3. Ejecuta `setup-server.ps1` con PowerShell. Si Windows bloquea el script, abre PowerShell en esa carpeta y ejecuta `powershell -ExecutionPolicy Bypass -File .\\setup-server.ps1`.
4. El asistente genera claves seguras, `server-config.bat`, la carpeta `Peliculas` y el archivo privado `SEBAS-PLAY-ACCESS-TOKEN.txt`.
5. Ejecuta `start-server.bat`.
6. Comprueba `http://localhost:8787/health` desde la laptop.

## Carga y catálogo

En el panel administrador, conecta la laptop y usa el selector “Subir película desde este dispositivo”. El archivo se guarda en `Peliculas` y aparece como borrador en el catálogo compartido. El límite predeterminado es 20 GiB por archivo.

El endpoint `GET /api/catalog` requiere `Authorization: Bearer TU_ACCESS_TOKEN`. Devuelve URLs firmadas. Publica cada ficha únicamente después de verificar los derechos de distribución. Los archivos de vídeo permanecen en la laptop; no se suben a Supabase Storage.

Las URLs firmadas duran 30 días por defecto. Si cambias el archivo o la ruta, vuelve a consultar el catálogo para generar otra URL.

## Acceso remoto desde Android y Roku

Para todos los usuarios fuera de casa, sigue `docs/REMOTE-ACCESS-VPS.md`: dominio público HTTPS, Caddy en un VPS y conexión privada Tailscale o WireGuard entre VPS y laptop. Configura `SEBAS_PUBLIC_BASE_URL=https://media.tudominio.com` en `server-config.bat` y utiliza el mismo dominio en el panel.

No se debe usar Cloudflare Tunnel como proxy general de distribución de archivos de vídeo. No publiques el puerto 8787 directamente en Internet, ni expongas el catálogo administrativo sin su token. El token y el secreto HMAC nunca deben incluirse en Android, Roku, Supabase ni GitHub.

## Compatibilidad y límites

- Recomendado: MP4 con vídeo H.264 y audio AAC.
- Se admite HTTP Range/206 para búsqueda y reanudación.
- No se transcodifica vídeo. Convierte formatos/códecs no compatibles antes de agregarlos.
- La laptop debe permanecer encendida, sin suspensión y con Internet.
- La subida de Megacable y la transferencia mensual del VPS limitan la cantidad de reproducciones simultáneas.
- El canal Roku debe probarse en un dispositivo físico antes de considerarlo listo.
