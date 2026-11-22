# SEBAS PLAY — servidor multimedia para Windows 10

Servidor ligero sin dependencias npm. Transmite archivos locales con soporte HTTP Range para búsqueda y reanudación en Android y Roku.

## Requisitos

- Windows 10 actualizado.
- Node.js LTS instalado.
- Videos propios, de dominio público o con autorización expresa para su distribución.
- Para acceso remoto: una URL pública HTTPS estable. No expongas directamente el puerto 8787 a internet.

El servidor tiene pruebas automatizadas de salud, autenticación del catálogo, firma de URLs y lectura parcial HTTP Range.

## Instalación

1. Copia la carpeta `server/windows-media` a la laptop.
2. Instala Node.js LTS desde https://nodejs.org/.
3. Ejecuta `setup-server.ps1` con PowerShell. Si Windows bloquea el script, abre PowerShell en esa carpeta y ejecuta `powershell -ExecutionPolicy Bypass -File .\\setup-server.ps1`.
4. El asistente genera claves seguras, `server-config.bat`, la carpeta `Peliculas` y el archivo privado `SEBAS-PLAY-ACCESS-TOKEN.txt`. No compartas ese archivo ni el token.
5. Ejecuta `start-server.bat`.
6. Comprueba `http://localhost:8787/health` desde la laptop.

## Subir películas desde Android o el panel

En el panel administrador, conecta la laptop y usa el selector “Subir película desde este dispositivo”. El archivo se guarda directamente en la carpeta `Peliculas` de Windows. El límite predeterminado es 20 GiB por archivo; al terminar, se crea o actualiza una ficha como borrador en el catálogo compartido.

## Catálogo y publicación

El panel administrador consulta `GET /api/catalog` enviando `Authorization: Bearer TU_ACCESS_TOKEN`. La respuesta incluye URLs `stream_url` firmadas. Publica una película solo después de comprobar que tienes derechos para distribuirla.

Android y Roku leen el catálogo compartido de Supabase; los archivos de video permanecen en la laptop y no deben subirse a Supabase Storage. Las URLs firmadas duran 30 días por defecto. Si cambias el archivo o la ruta, vuelve a consultar el catálogo para generar otra URL. Puedes ajustar `SEBAS_URL_TTL_SECONDS`.

## Acceso desde Roku y fuera de casa

En la laptop, la comprobación local es `http://localhost:8787/health`. Para acceso público desde redes externas, Android y Roku necesitan HTTPS.

La arquitectura recomendada es:
1. Mantener el servidor de Windows escuchando solo en la red local, en el puerto 8787.
2. Conectar la laptop a un VPS mediante un enlace privado Tailscale o WireGuard.
3. Publicar un dominio HTTPS en el VPS mediante un proxy inverso como Caddy, apuntando a la IP privada de la laptop.
4. Configurar `SEBAS_PUBLIC_BASE_URL` y la conexión del panel con el hostname HTTPS público.

Ejemplo de Caddy en el VPS (sustituye el dominio y la IP privada de la laptop):

```caddy
media.tudominio.com {
    encode zstd gzip
    reverse_proxy 100.x.y.z:8787
}
```

No abras el puerto 8787 en el módem ni lo expongas directamente a internet. No publiques `/api/catalog` sin autenticación. No uses un túnel temporal como dirección permanente para las URLs guardadas. Antes de contratar un VPS o dominio, confirma el presupuesto y mide la velocidad de subida de la conexión de casa.

## Compatibilidad y límites

- Recomendado: MP4 con video H.264 y audio AAC.
- Admite HTTP Range/206 para búsqueda y reanudación.
- No transcodifica. Convierte MKV/AVI o códecs no compatibles a MP4 H.264/AAC antes de agregarlos.
- La laptop debe permanecer encendida, sin suspensión y conectada a internet.
- El rendimiento remoto depende principalmente de la velocidad de subida de tu conexión.
- El ZIP no publica el canal en Roku Store. La instalación y reproducción deben probarse en un Roku físico.
