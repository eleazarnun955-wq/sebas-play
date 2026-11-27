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

## Vinculación y sincronización Android
1. Inicia sesión en SEBAS PLAY 13.0 en Android.
2. Abre **Vincular Roku** y genera el código temporal.
3. En Roku, selecciona **Vincular con Android** e introduce el código de 12 caracteres antes de que venza (5 minutos).
4. El canal guarda el token del dispositivo en el registro local de Roku. No vuelvas a compartir ese token.
5. **Actualizar catálogo** también vuelve a consultar favoritos y progreso de la cuenta.

El canal muestra la fila **Mi lista sincronizada** cuando existen favoritos publicados que coinciden con el catálogo. El avance de películas y episodios publicados se consulta al vincular/actualizar y se envía periódicamente durante la reproducción. Si desvinculas el Roku desde Android, sus solicitudes posteriores dejan de estar autorizadas.

## Guía EPG
Cuando un administrador publica horarios en la sección Guía EPG de Android, Roku consulta los programas vigentes/próximos y los muestra en la descripción del canal en TV en vivo.

La sincronización depende de conexión a internet, una sesión Android válida para generar el código y que el contenido tenga el mismo ID publicado en Supabase. El progreso de archivos locales de la laptop que no tengan un ID del catálogo no se sincroniza.
