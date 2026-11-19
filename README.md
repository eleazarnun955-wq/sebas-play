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
- `apps/android`: aplicación Android.
- `apps/roku`: aplicación Roku TV.
- `packages/catalog`: contratos y utilidades compartidas del catálogo.
- `supabase/migrations`: cambios versionados de base de datos.

## Estado

Panel administrativo implementado: inicio de sesión, control de rol administrador, resumen, alta y gestión de películas/series/canales, búsqueda, publicación/retiro y eliminación. Incluye administración de temporadas y episodios, carga de portadas a Supabase Storage y una guía de fuentes gratuitas/licenciadas para películas, series, TV en vivo y metadatos. La guía no incorpora streams automáticamente: cada obra o canal debe pasar una verificación de derechos y disponibilidad antes de publicarse. TMDB aporta metadatos y portadas, no derechos ni enlaces de reproducción. Las políticas RLS y el bucket de portadas están configurados. La compilación y el despliegue de los últimos commits están pendientes de verificación; Render debe publicar solo después de que CI pase. Los clientes Android y Roku aún están por desarrollar.

## Desarrollo

Las variables públicas de Supabase se configuran por entorno. La clave `service_role` y cualquier secreto deben permanecer exclusivamente en el servidor. No subir archivos `.env` al repositorio.
