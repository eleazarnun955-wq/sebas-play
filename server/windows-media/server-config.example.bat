@echo off
rem Copia este archivo como server-config.bat. No compartas ese archivo ni lo subas a GitHub.
set "SEBAS_HOST=0.0.0.0"
set "SEBAS_PORT=8787"
set "SEBAS_MEDIA_ROOT=%~dp0Peliculas"
rem Genera claves aleatorias largas. No reutilices contrasenas personales.
set "SEBAS_ACCESS_TOKEN=REEMPLAZA_POR_UN_TOKEN_ALEATORIO_DE_32_O_MAS_CARACTERES"
set "SEBAS_SIGNING_SECRET=REEMPLAZA_POR_UN_SECRETO_ALEATORIO_DE_64_CARACTERES"
rem Dejalo vacio para que el servidor detecte automaticamente el host LAN de cada dispositivo.
rem Para acceso remoto, coloca aqui tu URL HTTPS estable (ej. https://media.tudominio.com).
set "SEBAS_PUBLIC_BASE_URL="
rem Los enlaces firmados duran 30 dias.
set "SEBAS_URL_TTL_SECONDS=2592000"
rem Límite máximo por archivo: 20 GiB.
set "SEBAS_MAX_UPLOAD_BYTES=21474836480"
