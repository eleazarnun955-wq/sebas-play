# SEBAS PLAY para Roku 20.0

Canal Roku SceneGraph independiente de SEBAS PLAY 19.0, 18.0 y del APK Android.

## Catálogo y laptop
- El canal consulta películas, series y canales publicados en Supabase.
- Cuando hay una laptop configurada, agrega sus archivos MP4 como una fila adicional; no reemplaza el catálogo compartido.
- Las series publicadas muestran filas separadas por temporada y sus episodios publicados.
- El acceso a la laptop usa la URL y el token guardados localmente en el registro Roku. El token no se incluye en el catálogo público.

## Reproducción
La reproducción usa el reproductor SceneGraph nativo. Roku depende del contenedor, códec, DRM y URL; se recomienda MP4 H.264/AAC. Los demás formatos de la laptop se pueden convertir a MP4 H.264/AAC mediante FFmpeg cuando está instalado y detectado por el servidor Windows. El servidor limita las conversiones simultáneas y entrega enlaces firmados; sin FFmpeg, Roku muestra únicamente los archivos compatibles.

## Empaquetado y pruebas
El workflow de .github/workflows/roku-package.yml crea un ZIP para modo desarrollador. Antes de distribuir, validar navegación, reproducción, conexión local/remota y regreso al catálogo en un Roku físico o emulador. La certificación y publicación en Channel Store son pasos separados.

Publica únicamente contenido propio o con autorización/licencia para distribuirlo.

## Conexión directa Android → Roku

1. Enciende el servidor multimedia en la laptop y conecta el teléfono a esa biblioteca desde **Mi laptop**.
2. Asegúrate de que Roku y laptop estén en la misma red local.
3. Pulsa **Conectar directamente a Roku** en Android. La dirección y el token se envían juntos mediante ECP.
4. El canal admite tanto el inicio en frío como la recepción de una conexión cuando ya está abierto (`supports_input_launch` + `roInputEvent`).
5. La carga del catálogo se ejecuta en un Task de SceneGraph, con límites de espera y mensajes de error; la interfaz no debe bloquearse esperando a la laptop.

El catálogo de Roku procede exclusivamente de la biblioteca privada de la laptop. No se muestran enlaces externos de canales.

Publica únicamente contenido propio o con autorización/licencia para distribuirlo.
