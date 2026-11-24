# Acceso remoto temporal de SEBAS PLAY

Este complemento permite probar el acceso HTTPS fuera de casa sin abrir puertos del router y sin reinstalar Windows. Descarga Cloudflared para Windows de 32 bits (Windows 386) en la carpeta local `runtime`.

## Antes de iniciar
1. Ejecuta `start-server.bat` y confirma que el servidor Windows muestre **SERVIDOR ACTIVO**.
2. Ejecuta `INICIAR-ACCESO-REMOTO.bat`.
3. La primera vez descarga Cloudflared en la carpeta local `runtime`.
4. Espera a que aparezca una URL terminada en `.trycloudflare.com`.
5. Mantén abiertas las dos ventanas mientras quieras transmitir fuera de casa.

## Importante: dirección temporal
Quick Tunnel genera una URL aleatoria. Puede cambiar cuando se cierra o reinicia el túnel. Sirve para probar, no como dirección permanente para dejar configuradas las aplicaciones Android y Roku. Para probar el catálogo compartido, conecta el panel administrador a esa URL y publica únicamente fichas de contenido autorizado; los enlaces de reproducción firmados usan el host HTTPS del túnel.

## Para producción
Una dirección fija requiere un dominio propio agregado a Cloudflare y un túnel nombrado configurado en una cuenta Cloudflare. Esa vinculación requiere que el propietario inicie sesión y autorice el dominio; no se puede completar desde el repositorio ni conviene compartir credenciales.

## Seguridad
- No abras ni reenvíes el puerto 8787 en el router.
- No publiques el token privado de administración ni el secreto HMAC.
- El túnel publica el servicio de la laptop en internet. Comparte la URL solo con usuarios autorizados y detén el túnel cuando termines la prueba.
- El equipo debe permanecer encendido, conectado a internet y sin suspensión.
- Aloja y transmite únicamente contenido propio o con autorización/licencia.

## Compatibilidad
El instalador existente de SEBAS PLAY usa Node.js x86 para Windows de 32 bits. Este complemento descarga Cloudflared Windows 386 desde las publicaciones oficiales de Cloudflare.
