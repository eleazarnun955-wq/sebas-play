# SEBAS PLAY — servidor multimedia para Windows 10

Servidor local para guardar y transmitir videos desde la laptop a SEBAS PLAY Android y Roku. No instala paquetes npm ni crea una base de datos.

## Requisitos

- Windows 10.
- Node.js instalado y disponible en PATH.
- Laptop y celular/Roku conectados a la misma red Wi-Fi para la primera prueba.
- Videos propios, de dominio público o con autorización expresa para su distribución.

## Instalación de un clic

1. Extrae la carpeta del servidor en la laptop.
2. Ejecuta **start-server.bat** con doble clic. No ejecutes setup-server.ps1 manualmente.
3. En el primer inicio, el asistente crea las claves privadas, el archivo `server-config.bat`, el token y la carpeta `Peliculas`. Windows puede pedir autorización UAC una vez para permitir conexiones entrantes en redes privadas.
4. Copia tus videos a la carpeta `Peliculas`.
5. El servidor abre automáticamente su página de estado y muestra el enlace local que debes usar desde la misma red.

El archivo privado `SEBAS-PLAY-ACCESS-TOKEN.txt` contiene el token que se introduce una sola vez en el panel administrador de SEBAS PLAY. No compartas el token ni `server-config.bat`.

## Conexión desde Android y Roku

- Dentro de casa: usa en el panel administrador la dirección LAN que muestra la ventana del servidor, por ejemplo `http://192.168.1.15:8787`. No uses `localhost` en el teléfono.
- El catálogo genera las URLs de reproducción con el host de la solicitud. Así, si el panel consulta la laptop por su IP LAN, los enlaces de video también apuntan a esa laptop, no al teléfono.
- Las aplicaciones Android y Roku consultan los registros publicados en Supabase. Los videos permanecen en la laptop; no se suben a Supabase Storage.
- Los títulos importados desde el panel se guardan como borradores. Revisa derechos, portada y ficha antes de publicarlos.

## Acceso remoto

Para ver videos fuera de casa se necesita un hostname HTTPS estable (por ejemplo, un dominio con Cloudflare Tunnel). El servidor no puede crear automáticamente una cuenta, dominio ni credenciales de un proveedor externo. Configura el túnel para apuntar a `http://localhost:8787` y establece `SEBAS_PUBLIC_BASE_URL=https://tu-hostname` en `server-config.bat`. Reinicia el servidor después del cambio.

No abras directamente el puerto 8787 en el router ni lo expongas a internet sin un proxy HTTPS y controles de acceso. El acceso remoto requiere configurar el proveedor de túnel y probarlo desde una red móvil.

## Administración y seguridad

- `GET /`: página de estado.
- `GET /health`: comprobación de disponibilidad.
- `GET /api/catalog`: catálogo protegido por Bearer token.
- `POST /api/upload?name=archivo.mp4`: carga protegida por token.
- Las URLs de reproducción están firmadas y vencen después de 30 días por defecto.
- El token y el secreto HMAC se guardan localmente, nunca en Android, Roku, Supabase ni GitHub.
- Formatos admitidos: MP4, M4V, MOV y WebM. Recomendado: MP4 H.264 + AAC.
- No hay transcodificación. Los códecs no compatibles deben convertirse antes de agregarlos.
- La laptop debe permanecer encendida y sin suspensión durante la reproducción.

## Diagnóstico rápido

- Si el celular no conecta, confirma que esté en el mismo Wi-Fi, usa la IP LAN mostrada por el servidor y permite Node.js/puerto 8787 en Firewall de Windows para redes privadas.
- Si el servidor no inicia, revisa la ventana **SEBAS PLAY Media Server** y confirma que Node.js esté instalado.
- Si la página abre pero el catálogo da 401, vuelve a copiar el token desde `SEBAS-PLAY-ACCESS-TOKEN.txt`.
