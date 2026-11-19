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

Panel administrativo inicial implementado: inicio de sesión, control de rol administrador, resumen, alta de películas/series/canales, búsqueda, publicación/retiro y eliminación. Las políticas RLS de administrador ya se aplicaron a las cinco tablas del catálogo y se verificaron. GitHub Actions ya completó compilaciones exitosas. `render.yaml` prepara el despliegue del panel como sitio estático, pendiente de conectar las variables públicas en Render. Falta asignar `app_metadata.role=admin` a la cuenta propietaria y configurar las variables del hosting. Después se ampliará el panel (temporadas/episodios, carga de medios y edición) y se crearán los clientes Android y Roku.

## Desarrollo

Las variables públicas de Supabase se configuran por entorno. La clave `service_role` y cualquier secreto deben permanecer exclusivamente en el servidor. No subir archivos `.env` al repositorio.
