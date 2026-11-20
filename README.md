# SEBAS PLAY

Plataforma de entretenimiento con catálogo compartido entre Android y Roku TV.

## Principios del proyecto

- Aplicaciones independientes para Android y Roku TV.
- Un catálogo central administrado desde un panel web.
- Fuentes admitidas: contenido propio, contenido de dominio público y fuentes externas con autorización/licencia.
- No alojar ni retransmitir contenido sin derechos.
- Supabase es la infraestructura de autenticación y metadatos; los archivos de video requieren almacenamiento/hosting autorizado aparte.
- Nunca incluir claves secretas o service-role en aplicaciones cliente.

## Infraestructura actual

- Repositorio: `eleazarnun955-wq/sebas-play`
- Rama principal: `main`
- Supabase: proyecto `sebas-play` (región us-west-1).
- Tablas existentes en `public`: `profiles`, `movies`, `series`, `seasons`, `episodes`, `live_channels`, `favorites`, `watch_progress`.
- Todas las tablas verificadas tienen RLS habilitado.

## Estructura prevista

- `src/`: panel web administrativo React + TypeScript + Vite (primera etapa implementada).
- `apps/android`: aplicación Android (APK independiente).
- `apps/roku`: canal Roku SceneGraph independiente, con empaquetado automatizado.
- `apps/roku`: aplicación Roku TV.
- `packages/catalog`: contratos y utilidades compartidas del catálogo.
- `supabase/migrations`: cambios versionados de base de datos.

## Estado

La experiencia pública `/watch` ya incluye una primera versión instalable como PWA para Android y escritorio, con manifiesto, icono y caché limitada al shell estático. No almacena sesiones, datos privados ni transmisiones. En Android se puede instalar desde el menú del navegador cuando el sitio esté desplegado con HTTPS. Esta PWA no es todavía un APK nativo ni una aplicación Roku.

Panel administrativo implementado: inicio de sesión, control de rol administrador, resumen, alta y gestión de películas/series/canales, búsqueda, publicación/retiro y eliminación. Incluye administración de temporadas y episodios, carga de portadas a Supabase Storage y una guía de fuentes gratuitas/licenciadas para películas, series, TV en vivo y metadatos. La guía no incorpora streams automáticamente: cada obra o canal debe pasar una verificación de derechos y disponibilidad antes de publicarse. TMDB aporta metadatos y portadas, no derechos ni enlaces de reproducción. Las políticas RLS y el bucket de portadas están configurados. La compilación y el despliegue de los últimos commits están pendientes de verificación; Render debe publicar solo después de que CI pase. El cliente Android ya tiene configuración Capacitor independiente (`com.eleazarcompany.sebasplay`) y un workflow de GitHub Actions que genera un APK de depuración descargable; su compilación debe validarse en Actions antes de distribuirlo. El canal Roku tiene una primera base SceneGraph en `apps/roku`: consulta el catálogo público y muestra filas de películas, series y TV en vivo, con reproducción nativa para URLs compatibles. El paquete se genera mediante GitHub Actions; faltan pruebas en emulador/dispositivo Roku, navegación de episodios, sesión de usuario y publicación en Channel Store. El plan técnico está documentado en `docs/ANDROID-ROKU-PLAN.md` y el proceso del APK en `docs/ANDROID-APK.md`.

## Desarrollo

Las variables públicas de Supabase se configuran por entorno. La clave `service_role` y cualquier secreto deben permanecer exclusivamente en el servidor. No subir archivos `.env` al repositorio.


## SEBAS PLAY PRO 3.0 Streaming (en desarrollo)

- Android tendrá un applicationId nuevo: `com.eleazarcompany.sebasplay.pro30streaming20261120`, para instalarse junto a PRO 2.1, PRO 2.2 ADULTOS y PRO 2.2 AMERICANAS.
- Android reproduce películas y episodios con su reproductor HTML5 integrado; las señales en vivo directas también se envían al reproductor integrado cuando son URLs HTTPS compatibles (HLS/MP4).
- Roku usa su reproductor nativo SceneGraph/Video; no instala APK. Se entrega un ZIP de canal para modo desarrollador y se requiere validación en Roku físico/emulador.
- Una ficha sin URL directa autorizada no puede reproducirse mágicamente: Tubi, Canela y otras plataformas con DRM no permiten convertir sus páginas de catálogo en streams propios. El panel debe registrar URLs licenciadas/propias para cada película, episodio o canal.


## Biblioteca híbrida Android + Roku

La rama `sebas-play-hybrid-storage-android-roku` añade un panel de almacenamiento para administrar videos desde el teléfono:

- Copia local en IndexedDB del espacio privado de SEBAS PLAY, con reproducción offline en el mismo dispositivo.
- Carga de MP4 a Supabase Storage y alta automática como borrador en el catálogo compartido.
- La ficha solo aparece en Android/Roku después de revisar y publicar el contenido.
- Configuración del bucket y políticas en `supabase/sql/hybrid-video-storage.sql`.
- Guía de instalación y límites en `docs/HYBRID-STORAGE.md`.

**Límite del plan gratuito:** esta integración de Supabase admite hasta 50 MiB por archivo y queda sujeta a las cuotas de almacenamiento y transferencia del proyecto. No sirve para subir películas completas de varios cientos de MB/GB. El almacenamiento local permanece en el espacio privado de la aplicación y no es una carpeta pública de Android. Para Roku se requiere un MP4 HTTPS con códecs compatibles y derechos de distribución.
