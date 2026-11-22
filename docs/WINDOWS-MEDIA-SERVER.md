# Almacenamiento de películas en laptop Windows 10

SEBAS PLAY PRO 3.0 conserva el catálogo central en Supabase y usa la laptop como origen de vídeo. La laptop guarda los archivos grandes y los transmite bajo demanda; Supabase conserva títulos, portadas, categorías, URL de reproducción, favoritos e historial.

## Funciones del servidor

El servidor ligero está en `server/windows-media` y requiere Node.js LTS:

- Biblioteca local en `Peliculas`.
- Escaneo recursivo de MP4, M4V, MOV y WebM.
- Catálogo administrativo protegido por token.
- URLs de reproducción firmadas con vencimiento.
- Streaming HTTP Range para búsqueda y reanudación.
- Bloqueo de traversal y enlaces simbólicos fuera de la biblioteca.
- Carga autenticada desde el panel; límite predeterminado de 20 GiB por archivo.

## Puesta en marcha local

Sigue `server/windows-media/README.md`. Ejecuta `setup-server.ps1` una sola vez, guarda el token generado en privado y luego inicia `start-server.bat`. Comprueba `http://localhost:8787/health` desde la laptop.

## Acceso remoto público para Android y Roku

Para todos los usuarios fuera de casa, utiliza un dominio HTTPS estable y un VPS como punto de entrada público. La laptop y el VPS se conectan mediante Tailscale o WireGuard; así no se requiere abrir puertos entrantes en el módem Megacable ni instalar VPN en cada teléfono o Roku.

Consulta la guía completa `docs/REMOTE-ACCESS-VPS.md`. El VPS transmite el tráfico de vídeo hacia los usuarios, por lo que debe tener suficiente transferencia mensual y ancho de banda. No se debe contratar un plan sin aprobar primero su coste y comprobar la velocidad real de subida de Megacable.

No uses Cloudflare Tunnel como proxy general para distribuir archivos de vídeo. No expongas el puerto 8787 directamente a Internet.

## Integración con Android y Roku

Ambos clientes consumen el mismo catálogo de Supabase. En cada ficha publicada, `video_url` debe contener una URL HTTPS firmada generada por el servidor Windows. Los reproductores deben soportar HTTP Range. Se recomienda MP4 con vídeo H.264 y audio AAC para mejorar la compatibilidad.

El servidor no transcodifica. Los archivos con contenedores o códecs no compatibles deben convertirse antes de agregarlos, respetando siempre los derechos de la obra.

## Seguridad y límites

- Nunca incluyas el token administrativo ni el secreto HMAC en Android, Roku, Supabase o GitHub.
- Mantén secretos únicamente en `server-config.bat`, excluido del repositorio.
- La laptop debe permanecer encendida, sin suspensión y conectada a Internet.
- Las URLs firmadas son credenciales temporales; renuévalas cuando caduquen.
- Publica únicamente obras cuya licencia permita la distribución prevista.
- El paquete Roku no equivale a una publicación en Roku Store; hay que probar en un dispositivo Roku real.
