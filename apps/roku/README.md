# SEBAS PLAY para Roku 13.0

Canal Roku SceneGraph independiente de SEBAS PLAY 12.0, 11.0 y del APK Android.

## Catálogo y laptop
- El canal consulta películas, series y canales publicados en Supabase.
- Cuando hay una laptop configurada, agrega sus archivos MP4 como una fila adicional; no reemplaza el catálogo compartido.
- Las series publicadas muestran filas separadas por temporada y sus episodios publicados.
- El acceso a la laptop usa la URL y el token guardados localmente en el registro Roku. El token no se incluye en el catálogo público.

## Reproducción
La reproducción usa el reproductor SceneGraph nativo. Roku depende del contenedor, códec, DRM y URL; se recomienda MP4 H.264/AAC. Los demás formatos de la laptop se pueden reproducir en Android con VLC. El servidor Windows admite solicitudes HTTP Range y enlaces firmados; no transcodifica.

## Empaquetado y pruebas
El workflow de .github/workflows/roku-package.yml crea un ZIP para modo desarrollador. Antes de distribuir, validar navegación, reproducción, conexión local/remota y regreso al catálogo en un Roku físico o emulador. La certificación y publicación en Channel Store son pasos separados.

Publica únicamente contenido propio o con autorización/licencia para distribuirlo.
