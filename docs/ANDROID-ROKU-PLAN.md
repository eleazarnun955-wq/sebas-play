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

## Roku — siguiente entregable
- Aplicación Roku SceneGraph independiente, con su propio identificador y canal.
- Navegación con control remoto, filas de catálogo, fichas y reproducción autorizada.
- Integración con el mismo contrato de catálogo, respetando formatos y DRM admitidos por Roku.
- Pruebas en Roku Device Emulator y dispositivo real antes de publicación.

## No se debe dar por terminado
La PWA no equivale a un APK nativo ni a una aplicación Roku. Es una primera entrega instalable que permite validar el catálogo y la experiencia mientras se desarrollan los clientes nativos.
