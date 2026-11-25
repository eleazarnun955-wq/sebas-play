# SEBAS PLAY — servidor multimedia para Windows 10

Instalador de un clic para Windows 10 de 32 o 64 bits. No requiere instalar Node.js manualmente ni reinstalar Windows.

## Instalación sencilla

1. Descarga y extrae el paquete completo.
2. Haz doble clic en INSTALAR-SEBAS-PLAY.bat.
3. El asistente descarga el motor Node.js oficial de 32 bits y verifica su SHA-256.
4. Cuando aparezca la ventana de carpetas, elige la carpeta principal donde guardas tus películas y series. También se revisan sus subcarpetas.
5. Acepta la regla del Firewall para redes privadas si Windows la solicita.

El servidor se inicia, abre la página de estado y queda configurado para arrancar cuando inicies sesión en Windows. PRO 4.0 actualiza automáticamente el índice de archivos compatibles cada 30 segundos (configurable) sin mover ni borrar archivos.

## Conexión en casa

La laptop y los dispositivos deben estar conectados a la misma red Wi-Fi. El servidor muestra la dirección local de la laptop, por ejemplo http://192.168.1.15:8787. No uses localhost desde el teléfono o Roku.

El archivo SEBAS-PLAY-ACCESS-TOKEN.txt contiene el token privado que se introduce en el panel administrador de SEBAS PLAY. No lo compartas. El estado avanzado autenticado está disponible en `/api/status` e informa cantidad de medios indexados, sesiones de reproducción y espacio libre.

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
- Para detener el servidor, cierra la ventana minimizada SEBAS PLAY Media Server o reinicia Windows.

Aloja únicamente contenido propio, de dominio público o con autorización/licencia para distribuirlo.
