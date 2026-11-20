# Biblioteca híbrida de SEBAS PLAY

## Qué hace esta entrega

- **Biblioteca local Android/PWA:** permite elegir un video desde el teléfono y guardarlo en IndexedDB dentro del espacio privado de SEBAS PLAY. Se puede reproducir sin internet en ese mismo dispositivo.
- **Nube compartida:** permite subir un MP4 al bucket público `sebas-play-videos` y crear una ficha de película como borrador en `public.movies`.
- **Catálogo compartido:** después de revisar derechos y publicar la ficha, Android y Roku pueden consultar la URL HTTPS del archivo.
- **Separación de copias:** eliminar una copia local no elimina la nube; eliminar la ficha no se debe interpretar como borrar el archivo de almacenamiento.

## Preparar Supabase

1. Abre el proyecto Supabase usado por SEBAS PLAY.
2. En SQL Editor, ejecuta el archivo `supabase/sql/hybrid-video-storage.sql`.
3. Confirma que se creó el bucket `sebas-play-videos`, público para lectura y limitado a MP4 de 50 MiB.
4. Comprueba que la cuenta administradora tenga el claim `app_metadata.role = admin`. La aplicación no usa `user_metadata` para conceder permisos.
5. Verifica que las políticas RLS de `movies` permitan al administrador insertar borradores y que Android/Roku solo lean contenido publicado.

No copies claves secretas ni `service_role` al APK, al canal Roku ni al navegador.

## Límites importantes

- El límite de archivo de esta integración es 50 MiB por video, correspondiente al máximo del plan gratuito de Supabase. Una película normal suele superar ampliamente ese tamaño; esta ruta gratuita sirve para clips, trailers o videos muy comprimidos, no para alojar un catálogo grande de películas.
- Supabase Storage también tiene cuotas de almacenamiento y transferencia. El plan Free puede limitar o pausar el uso al exceder cuotas; los planes de pago pueden facturar excedentes. La app no activa planes ni pagos. Mantén el proyecto en Free y revisa Usage/Billing antes de subir contenido.
- El almacenamiento local utiliza IndexedDB en el espacio privado de la aplicación/navegador. No aparece como archivo independiente en la carpeta pública Descargas/Movies y puede estar sujeto a las cuotas del dispositivo/Android. No desinstales ni borres los datos de SEBAS PLAY si deseas conservar esa biblioteca local.
- Para reproducir en Roku, utiliza MP4 con video H.264 y audio AAC en una URL HTTPS directa. El contenedor MP4 por sí solo no garantiza compatibilidad: los códecs deben ser compatibles con el dispositivo.
- Publica únicamente películas, clips o señales que sean propios, de dominio público o que tengas autorización/licencia para almacenar y distribuir. El bucket público permite que cualquier persona con la URL lea el video.

## Pruebas pendientes

- Ejecutar CI/build de TypeScript y Vite.
- Ejecutar el SQL en el proyecto real y probar carga con una cuenta administradora.
- Probar reproducción local sin conexión en Android físico.
- Probar URL MP4 desde Roku físico/emulador y validar códecs.
- Revisar cuotas de Storage y transferencia antes de cargar cualquier colección.
