# SEBAS PLAY para Roku

Canal Roku SceneGraph independiente del APK Android.

## Configuración
1. En `source/config.brs`, configura la URL de Supabase y la clave pública publishable/anon del proyecto.
2. Nunca uses `service_role`, claves secretas ni credenciales de administrador.
3. Las tablas consultadas son `movies`, `series` y `live_channels`; solo se solicitan registros con `is_published=true`.
4. Las políticas RLS deben permitir SELECT público únicamente a los registros publicados.
5. Publica únicamente URLs HTTPS de contenido propio o con autorización/licencia para distribución en Roku.

## Empaquetado
El workflow `.github/workflows/roku-package.yml` crea un ZIP del canal para instalarlo en modo desarrollador en un dispositivo Roku. Para validación real se necesita Roku Device Emulator o un Roku físico. La certificación y publicación en Roku Channel Store son pasos separados.

## Limitaciones de esta primera base
- El canal muestra películas, series y canales que devuelvan las consultas públicas.
- La reproducción usa el reproductor SceneGraph nativo con formato automático; el formato, códec, contenedor, DRM y disponibilidad deben ser compatibles con Roku.
- El catálogo de series se muestra, pero la navegación de temporadas/episodios y el inicio de sesión se completarán en la siguiente iteración.
- El contenido sin URL reproducible no se puede iniciar desde Roku.
