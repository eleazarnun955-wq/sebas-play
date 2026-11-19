# SEBAS PLAY — plan de aplicaciones

## Base compartida
- El panel web administra el catálogo central en Supabase.
- El cliente público consume únicamente registros publicados.
- Android y Roku serán clientes separados; no compartirán paquetes ni ciclos de actualización.
- Las credenciales de administrador y la clave `service_role` nunca se incluyen en clientes.
- Las aplicaciones solo reproducen archivos propios, de dominio público verificado o licenciados con permiso explícito para reproducción en cada plataforma.

## Cliente web instalable
La ruta `/watch` se puede instalar desde un navegador compatible como aplicación web progresiva (PWA). El service worker conserva únicamente el shell estático; nunca almacena sesiones, respuestas privadas, metadatos del catálogo ni video.

## Android nativo — siguiente entregable
- Proyecto Android independiente, identificador de paquete propio y nombre SEBAS PLAY.
- Inicio de sesión por correo, catálogo, búsqueda, fichas, reproducción compatible, favoritos e historial.
- Reproducción mediante componentes Android compatibles con los formatos autorizados.
- La sesión se almacena con mecanismos seguros del sistema; no se incluyen secretos administrativos.
- Construcción de APK mediante GitHub Actions y validación antes de distribuir.

## Roku — primera base implementada
- Canal Roku SceneGraph independiente en `apps/roku`, separado del APK Android.
- Home inicial con filas para películas, series y TV en vivo, cargadas desde las tablas públicas de Supabase.
- Navegación inicial con control remoto y reproducción con el nodo Video nativo para URLs compatibles.
- Workflow `SEBAS PLAY Roku package` que genera `SEBAS-PLAY-Roku.zip` como artefacto de GitHub Actions.
- Configurar la clave pública publishable/anon en `apps/roku/source/config.brs`; nunca usar `service_role`.
- Pendiente: probar en Roku Device Emulator/dispositivo real, implementar fichas y temporadas/episodios, autenticación, validar codecs/DRM y preparar publicación en Channel Store.

## No se debe dar por terminado
La PWA no equivale a un APK nativo ni a una aplicación Roku. Es una primera entrega instalable que permite validar el catálogo y la experiencia mientras se desarrollan los clientes nativos.
