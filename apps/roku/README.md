# SEBAS PLAY para Roku 24.0

Canal Roku SceneGraph independiente de SEBAS PLAY 23.0 y anteriores y del APK Android.

## Catálogo y laptop
- El canal consulta únicamente películas y series publicadas desde 2023, con URL directa de medios compatible. Los canales en vivo solo aparecen cuando su URL es directa y termina en un formato de reproducción reconocido (.m3u8, .mp4, .m4v, .mov o .webm).
- Cuando hay una laptop configurada, agrega sus archivos MP4 como una fila adicional; no reemplaza el catálogo compartido.
- Las series publicadas muestran filas separadas por temporada y sus episodios publicados.
- El acceso a la laptop usa la URL y el token guardados localmente en el registro Roku. El token no se incluye en el catálogo público.

## Reproducción
La reproducción usa el reproductor SceneGraph nativo. Roku depende del contenedor, códec, DRM y URL; se recomienda MP4 H.264/AAC. Los demás formatos de la laptop se pueden convertir a MP4 H.264/AAC mediante FFmpeg cuando está instalado y detectado por el servidor Windows. El servidor limita las conversiones simultáneas y entrega enlaces firmados; sin FFmpeg, Roku muestra únicamente los archivos compatibles.

## Empaquetado y pruebas
El workflow de .github/workflows/roku-package.yml crea un ZIP para modo desarrollador. Antes de distribuir, validar navegación, reproducción, conexión local/remota y regreso al catálogo en un Roku físico o emulador. La certificación y publicación en Channel Store son pasos separados.

Publica únicamente contenido propio o con autorización/licencia para distribuirlo.

## Vinculación y sincronización Android
1. Inicia sesión en SEBAS PLAY 24.0 en Android.
2. Abre **Vincular Roku** y genera el código temporal.
3. En Roku, selecciona **Vincular con Android** e introduce el código de 12 caracteres antes de que venza (5 minutos).
4. El canal guarda el token del dispositivo en el registro local de Roku. No vuelvas a compartir ese token.
5. **Actualizar catálogo** también vuelve a consultar favoritos y progreso de la cuenta.

El canal muestra la fila **Mi lista sincronizada** cuando existen favoritos publicados que coinciden con el catálogo. El avance de películas y episodios publicados se consulta al vincular/actualizar y se envía periódicamente durante la reproducción. Si desvinculas el Roku desde Android, sus solicitudes posteriores dejan de estar autorizadas.

## Guía EPG
Cuando un administrador publica horarios en la sección Guía EPG de Android, Roku consulta los programas vigentes/próximos y los muestra en la descripción del canal en TV en vivo.

La sincronización depende de conexión a internet, una sesión Android válida para generar el código y que el contenido tenga el mismo ID publicado en Supabase. El progreso de archivos locales de la laptop que no tengan un ID del catálogo no se sincroniza.

## Curaduría v24.0
- Se excluye del catálogo público cualquier película o serie anterior a 2023.
- Películas, episodios y canales requieren una URL HTTP(S) directa con extensión de medio reconocida; las páginas web, embeds y enlaces sin formato reproducible no se listan.
- Este filtro reduce enlaces evidentemente incorrectos, pero no sustituye una prueba de reproducción real en el dispositivo. No se afirma que una fuente esté activa solo por tener una URL.
- La biblioteca privada de **Mi laptop** permanece separada y no se modifica por el filtro de estrenos.
