# SEBAS PLAY — acceso remoto público mediante VPS

Este documento define el despliegue remoto recomendado para que los usuarios de SEBAS PLAY reproduzcan la biblioteca de la laptop desde Android y Roku, incluso cuando están fuera de casa.

## Arquitectura

- **Laptop Windows:** conserva los archivos originales en `server/windows-media/Peliculas` y ejecuta el servidor SEBAS PLAY en el puerto privado 8787.
- **Tailscale/WireGuard:** crea un enlace privado saliente entre la laptop y un VPS. No requiere abrir puertos entrantes en el módem Megacable y funciona aunque la conexión doméstica esté detrás de CGNAT.
- **VPS público:** ejecuta Caddy como proxy inverso y termina HTTPS para un dominio como `media.tudominio.com`.
- **Android y Roku:** se conectan al dominio HTTPS público. No necesitan instalar Tailscale ni pertenecer a la red privada.
- **Supabase:** conserva metadatos, fichas, portadas y catálogo; los archivos de vídeo permanecen en la laptop.

## Flujo de reproducción

1. El usuario inicia sesión en SEBAS PLAY.
2. Android o Roku obtiene la ficha publicada desde el catálogo.
3. El reproductor solicita la URL firmada HTTPS.
4. Caddy recibe la petición pública y la reenvía por la red privada al servidor Windows.
5. Windows transmite el archivo mediante HTTP Range para permitir búsqueda y reanudación.

El tráfico de vídeo pasa por el VPS. Por eso el VPS debe tener suficiente transferencia mensual, ancho de banda y política de uso adecuada para streaming. No se debe elegir un plan únicamente por CPU/RAM.

## Requisitos previos que no se deben asumir

- Contratar un VPS con IPv4 pública, tráfico mensual suficiente y puertos TCP 80/443 disponibles.
- Registrar o disponer de un dominio y crear un registro DNS `A` hacia la IPv4 del VPS.
- Crear una red privada Tailscale o WireGuard y unir el VPS y la laptop.
- Confirmar la velocidad real de subida de Megacable y probar estabilidad.
- Verificar si la laptop puede permanecer encendida y sin suspensión.
- No comprar ni activar un VPS de pago sin aprobación expresa del propietario.

## Configuración del proxy Caddy en el VPS

Una vez que Tailscale esté conectado en ambos equipos, sustituir `100.x.y.z` por la IP privada Tailscale de la laptop y `media.tudominio.com` por el dominio real:

```caddy
media.tudominio.com {
    encode zstd gzip
    reverse_proxy 100.x.y.z:8787
}
```

Caddy obtiene y renueva el certificado HTTPS automáticamente cuando el DNS apunta al VPS y los puertos 80/443 son accesibles.

En el firewall del VPS, permitir TCP 80 y 443 desde Internet. El puerto 8787 de Windows no debe exponerse en el router ni abrirse al público; debe aceptar tráfico únicamente desde la interfaz/red privada del VPS.

## Configuración del servidor Windows

1. Instalar Node.js LTS y Tailscale en Windows.
2. Ejecutar `setup-server.ps1` una sola vez para generar las claves locales.
3. Configurar `SEBAS_PUBLIC_BASE_URL=https://media.tudominio.com` en `server-config.bat`.
4. Mantener el token de administración y el secreto HMAC únicamente en el equipo Windows. No subirlos a GitHub, Supabase, Android ni Roku.
5. Ejecutar `start-server.bat` y comprobar `http://localhost:8787/health` desde la laptop.
6. Comprobar desde el VPS que el origen privado responde y desde una red externa que `https://media.tudominio.com/health` funciona.

El panel administrador debe conectarse al mismo dominio HTTPS. El token de administración no debe incluirse en las aplicaciones públicas ni entregarse a usuarios finales.

## Reglas de seguridad

- No publicar directamente el puerto 8787.
- No incluir tokens, claves privadas ni archivos `server-config.bat` en el repositorio.
- Mantener HTTPS en todas las conexiones públicas.
- Utilizar cuentas individuales y contraseñas distintas para los usuarios.
- Limitar el acceso administrativo a personas autorizadas.
- Publicar únicamente películas y episodios cuya licencia permita la distribución prevista.
- Las URLs firmadas son credenciales temporales; renovar enlaces cuando caduquen.
- Mantener Windows actualizado, copias de seguridad y protección del VPS.

## Pruebas de aceptación antes de entregar APKs

1. Salud local del servidor Windows.
2. Catálogo administrativo protegido: sin token debe responder 401/403.
3. Streaming Range: una petición parcial debe responder 206 y permitir seek.
4. HTTPS público válido desde una red móvil ajena al Wi-Fi doméstico.
5. Reproducción completa en Android fuera de casa.
6. Reproducción completa en Roku fuera de casa.
7. Prueba simultánea con varios usuarios y medición de subida, CPU, RAM y transferencia del VPS.
8. Verificar que las versiones Android existentes siguen instalándose y abriendo sin ser reemplazadas.
9. Generar y verificar APK Android, paquete Roku y ZIP del servidor Windows desde artefactos de CI.

## Nota sobre Cloudflare Tunnel

No se debe usar Cloudflare Tunnel como proxy general de distribución de archivos de vídeo para este servicio. Para streaming público de la biblioteca se utiliza el VPS propio como punto de entrada HTTPS y relay de tráfico, sujeto a los términos y límites del proveedor elegido.
