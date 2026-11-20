@echo off
rem Copia este archivo como server-config.bat. No compartas ese archivo ni lo subas a GitHub.
set "SEBAS_HOST=0.0.0.0"
set "SEBAS_PORT=8787"
set "SEBAS_MEDIA_ROOT=%~dp0Peliculas"
rem Genera claves aleatorias largas. No reutilices contrasenas personales.
set "SEBAS_ACCESS_TOKEN=REEMPLAZA_POR_UN_TOKEN_ALEATORIO_DE_32_O_MAS_CARACTERES"
set "SEBAS_SIGNING_SECRET=REEMPLAZA_POR_UN_SECRETO_ALEATORIO_DE_64_CARACTERES"
rem URL publica HTTPS de Cloudflare Tunnel o dominio. Para prueba local deja localhost.
set "SEBAS_PUBLIC_BASE_URL=http://localhost:8787"
rem Los enlaces firmados duran 30 dias.
set "SEBAS_URL_TTL_SECONDS=2592000"
