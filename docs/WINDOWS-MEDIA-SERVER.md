# Almacenamiento de películas en laptop Windows 10

SEBAS PLAY PRO 3.0 conserva el catálogo central en Supabase y usa la laptop como origen de video. La laptop guarda los archivos grandes y los transmite bajo demanda; Supabase conserva títulos, portadas, categorías, URL de reproducción, favoritos e historial.

## Servidor Windows

El servidor está en `server/windows-media`. No usa paquetes npm ni base de datos. El primer inicio con `start-server.bat` genera claves privadas, crea `Peliculas`, prepara el archivo de token y trata de autorizar el puerto 8787 en el Firewall de Windows para redes privadas. Los inicios siguientes conservan el token existente y verifican la regla, sin regenerar credenciales.

## Red local

La laptop y el teléfono/Roku deben estar en la misma red Wi-Fi. El servidor muestra la dirección LAN de la laptop; esa dirección se usa en el panel administrador (por ejemplo, `http://192.168.1.15:8787`). No uses `localhost` desde el teléfono o Roku.

Al consultar el catálogo, el servidor construye cada URL de video usando el host de la solicitud. Por eso las URLs locales apuntan a la laptop que contiene los archivos, no al dispositivo que reproduce.

## Integración Android y Roku

Android y Roku consultan los registros publicados en Supabase. El panel administrador consulta el catálogo local de la laptop, permite cargar videos y guarda cada ficha como borrador en Supabase. Revisa los derechos y los datos de la ficha antes de publicarla. Desde Android, **Sincronizar todo al catálogo** agrega en lotes los archivos nuevos como borradores y renueva los enlaces firmados de los que ya existen; no publica automáticamente ningún contenido. Las URLs firmadas duran 30 días por defecto; al vencer, vuelve a importar/renovar el enlace desde el panel.

Roku usa el reproductor nativo y requiere que el contenedor, códec y URL sean compatibles. Se recomienda MP4 H.264/AAC. El servidor no transcodifica.

### Fila «Mi laptop» en Roku 9.0 ULTRA

Cuando importas desde Android una película o episodio de la laptop y publicas su ficha en el catálogo, Roku 9.0 ULTRA la muestra también en una fila independiente llamada **Mi laptop**. La aplicación identifica exclusivamente las URLs firmadas del servidor bajo `/media/`; no necesita ni recibe el token de administración de Windows. La reproducción sigue usando el enlace firmado con vencimiento y las solicitudes HTTP Range del servidor. Los favoritos y el progreso continúan sincronizándose mediante la vinculación segura de la cuenta. Para Roku, usa MP4 H.264/AAC; si un archivo no es compatible, conviértelo desde el panel con FFmpeg cuando esté instalado.


## Acceso remoto

Fuera de casa se requiere un hostname HTTPS estable y un proxy/túnel configurado. El paquete no puede crear una cuenta ni aceptar los términos de un proveedor externo por el usuario. Configura Cloudflare Tunnel u otro proveedor para publicar `http://localhost:8787` bajo HTTPS y define `SEBAS_PUBLIC_BASE_URL=https://tu-hostname` en el archivo local `server-config.bat`. No abras el puerto 8787 directamente en el router.

## Seguridad

El token de administración y el secreto HMAC permanecen en la laptop. Nunca los incluyas en Android, Roku, Supabase ni GitHub. El token se copia una vez desde `SEBAS-PLAY-ACCESS-TOKEN.txt` al panel administrador. Aloja únicamente contenido propio o con licencia para distribuirlo.
