# Auditoría Supabase para SEBAS PLAY PRO 4.0

Fecha de inspección: 2026-11-25. Solo lectura; no se modificó la base de datos de producción.

Proyecto: `sebas-play` (`ououwdzxywmjpppzqxqy`), estado observado: `ACTIVE_HEALTHY`.

## Tablas existentes observadas

- `profiles`: una fila por usuario Auth (id, display_name, avatar_url, created_at, updated_at). No representa todavía múltiples perfiles locales dentro de una cuenta.
- `movies`: catálogo de películas con title, synopsis, poster_url, backdrop_url, release_year, duration_minutes, age_rating, genres, video_url, source_type, rights_note, is_published.
- `series`, `seasons`, `episodes`: estructura de series y episodios; episodios con video_url e is_published.
- `live_channels`: canales con name, logo_url, stream_url, category, country_code, rights_note, is_published.
- `favorites`: favoritos por user_id, content_type y content_id.
- `watch_progress`: progreso por user_id, content_type (movie/episode), content_id, position_seconds, duration_seconds y updated_at.

Todas las tablas públicas enumeradas tenían RLS habilitado en la inspección.

## Políticas observadas

- Películas, series, temporadas, episodios y canales: lectura pública limitada a contenido publicado, con lectura administrativa adicional.
- Favoritos y progreso: lectura/escritura restringida al usuario autenticado propietario.
- Perfiles: cada usuario puede leer/crear/actualizar su propia fila.

## Brechas que PRO 4.0 debe resolver mediante cambios aditivos

1. Perfiles múltiples por cuenta/dispositivo: la tabla `profiles` actual es el perfil de cuenta Auth, no un selector de perfiles familiares. Diseñar `media_profiles` con propietario y PIN hasheado (nunca PIN en texto), y asociar favoritos/progreso a ese perfil sin romper las tablas actuales.
2. EPG: no se observó tabla de canales EPG ni programación XMLTV. Diseñar tablas separadas de fuentes/guía/programas y mapeo a `live_channels`.
3. Sincronización Android/Roku: ya existen `favorites` y `watch_progress`; extender de forma compatible para perfiles locales o añadir tablas nuevas. No alterar políticas actuales sin pruebas.
4. Índices únicos: comprobar restricciones actuales antes de añadir claves de idempotencia para progreso/favoritos.
5. Metadatos: las columnas de poster/synopsis/año ya existen en películas y series. La obtención automática requiere proveedor configurable y cache separado; nunca sobrescribir ediciones manuales sin consentimiento.

## Observación de compatibilidad del reproductor

En el catálogo consultado, los cinco registros de películas publicados usan URLs de páginas de inserción de Archive.org (`/embed/...`), no enlaces directos MP4/HLS. Roku Video y VLC requieren una URL reproducible compatible; PRO 4.0 debe distinguir páginas de inserción de streams directos y mostrar un error comprensible o resolver una fuente directa autorizada. No cambiar esos registros de producción automáticamente.

## Protección

Esta auditoría no ejecutó DDL ni cambió datos/policies. Las futuras migraciones se mantendrán como archivos en la rama PRO 4.0 y se probarán en un entorno de desarrollo antes de cualquier aplicación a producción.
