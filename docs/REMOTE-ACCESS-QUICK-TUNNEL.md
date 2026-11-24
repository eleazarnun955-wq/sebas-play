# Acceso remoto temporal de SEBAS PLAY

Este complemento permite probar el acceso HTTPS fuera de casa sin abrir puertos del router y sin instalar otro sistema operativo. Es compatible con Windows de 32 bits mediante el ejecutable Windows 386 de Cloudflare Tunnel.

## Antes de iniciar
1. Ejecuta `start-server.bat` y confirma que el servidor Windows muestre **SERVIDOR ACTIVO**.
2. Ejecuta `INICIAR-ACCESO-REMOTO.bat`.
3. La primera vez descarga Cloudflared en la carpeta local `runtime`.
4. Espera a que aparezca una URL terminada en `.trycloudflare.com`.
5. Mantén abiertas las dos ventanas mientras quieras transmitir fuera de casa.

## Importante: dirección temporal
Quick Tunnel genera una URL aleatoria. Puede cambiar cuando se cierra o reinicia el túnel. Sirve para probar, no como dirección permanente para dejar configuradas las aplicaciones Android y Roku.

## Para producción
Una dirección fija requiere un dominio propio agregado a Cloudflare y un túnel nombrado configurado en una cuenta Cloudflare. Esa vinculación requiere que el propietario inicie sesión y autorice el dominio; no se puede completar desde el repositorio ni conviene compartir credenciales.

## Seguridad
- No abras ni reenvíes el puerto 8787 en el router.
- No publiques el token privado de administración ni el secreto HMAC.
- El túnel publica el servicio de la laptop en internet. Comparte la URL solo con usuarios autorizados y detén el túnel cuando termines la prueba.
- El equipo debe permanecer encendido, conectado a internet y sin suspensión.
- Aloja y transmite únicamente contenido propio o con autorización/licencia.

## Compatibilidad
El instalador existente de SEBAS PLAY usa Node.js x86 para Windows de 32 bits. Este complemento descarga Cloudflared Windows 386 de la publicación oficial de Cloudflare.
