# Almacenamiento de películas en laptop Windows 10

SEBAS PLAY PRO 3.0 conserva el catálogo central en Supabase y usa la laptop como origen de video. La laptop no reemplaza Supabase: guarda los archivos grandes y los transmite bajo demanda; Supabase conserva títulos, portadas, categorías, URL de reproducción, favoritos e historial.

## Entrega incluida

El servidor ligero está en `server/windows-media`. No usa base de datos ni paquetes npm: Node.js LTS y Windows 10 son suficientes. Tiene:

- Biblioteca local en la carpeta `Peliculas`.
- Escaneo recursivo de MP4, M4V, MOV y WebM.
- Catálogo de administración protegido por token.
- URLs de reproducción firmadas con vencimiento.
- Streaming por rangos HTTP para seek y reanudación.
- Bloqueo de traversal y enlaces simbólicos fuera de la biblioteca.

## Puesta en marcha

Sigue `server/windows-media/README.md`. La laptop debe permanecer encendida y sin suspensión. Para que Android y Roku reproduzcan desde cualquier red, configura un hostname HTTPS estable mediante Cloudflare Tunnel y coloca ese hostname en `SEBAS_PUBLIC_BASE_URL`. La configuración de red y el túnel se deben completar en la propia laptop y router; el repositorio no puede hacer esos cambios físicos de forma remota.

## Integración con Android y Roku

Ambos clientes consumen el mismo catálogo de Supabase. En el registro de cada película/episodio, `video_url` debe contener la URL firmada generada por el servidor Windows. Roku requiere URL HTTPS pública para funcionar fuera de la red local y formatos/códecs soportados. Para una prueba en casa se puede usar la IP local de la laptop; para uso fuera de casa se necesita el túnel HTTPS estable.

## Seguridad

Nunca pongas el token de administración ni el secreto HMAC en Android, Roku, Supabase ni GitHub. Solo se configuran en `server-config.bat`, que está excluido de Git. Las URLs firmadas son credenciales temporales: no las publiques en redes sociales. Aloja solo contenido que tengas derecho a distribuir.
