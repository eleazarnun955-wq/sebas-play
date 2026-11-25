# SEBAS PLAY PRO 4.0 — plan de implementación independiente

## Regla de protección

Este trabajo se desarrolla únicamente en la rama `sebas-play-pro40-independent-20261125`. No modificar ni borrar archivos existentes de PRO 3.0, ni cambiar el flujo de compilación actual. PRO 4.0 tendrá un applicationId Android nuevo (`com.eleazarcompany.sebasplay.pro40.independent20261125`) y un paquete/carpeta Roku independiente (`apps/roku-pro40`). No se debe reutilizar el identificador de PRO 3.0 ni sobrescribir sus artefactos.

## Arquitectura confirmada en el repositorio

- Cliente web/Android: React 19 + Vite + TypeScript + Capacitor 8; la app existente está en `src/App.tsx`, `src/ViewerApp.tsx` y componentes especializados.
- Reproductor Android: integración nativa VLC/libVLC mediante el script existente `scripts/install-vlc-android.mjs`.
- Servidor Windows: Node.js local, instalado en carpeta propia, con raíz de medios configurable, token de acceso y secreto de firma; puerto predeterminado 8787.
- Roku: SceneGraph/BrightScript en `apps/roku`, consulta catálogo de Supabase y reproducción mediante nodo Video.
- Catálogo compartido: Supabase. No usarlo para almacenar copias de películas; los archivos permanecen en el disco de la laptop.

## Paquete de mejoras solicitado (una sola entrega PRO 4.0)

1. Escaneo automático: vigilancia de carpetas configuradas, indexación incremental, detección de cambios/eliminaciones y deduplicación por ruta/tamaño/huella; no mover ni borrar medios del usuario.
2. Reproductor profesional: controles, reanudar posición, subtítulos y pistas cuando el motor/formato lo permita, selector de audio y manejo robusto de errores; mantener la ruta VLC Android y Video Roku, con capacidades específicas por plataforma.
3. Sincronización Android/Roku: progreso, vistos, favoritos y perfiles en backend compartido; actualizaciones con debounce y timestamps para evitar sobrescrituras entre dispositivos.
4. Portadas e información: proveedor configurable de metadatos, caché local, edición manual y fallback sin conexión; no depender de un proveedor sin clave o permiso.
5. Servidor Windows: arranque automático opcional, comprobación de salud, reconexión, monitor de almacenamiento y sesiones, configuración respaldable y reglas de firewall limitadas a perfil privado.
6. Transcodificación: FFmpeg opcional, bajo demanda y solo cuando la reproducción directa no sea compatible; conservar original, generar salida temporal/cacheada y limitar CPU/espacio. No transcodificar todos los archivos al escanear.
7. EPG: guía XMLTV/EPG configurable para canales legítimos, mapeo de IDs y zona horaria, actualización programada y fallback cuando no haya guía.
8. Perfiles: perfiles separados, PIN opcional, progreso/favoritos por perfil y políticas RLS en Supabase; jamás exponer service_role en clientes.
9. Diseño: rediseño de interfaz PRO 4.0 separado, navegación clara y accesible; no sustituir pantallas actuales de PRO 3.0.

## Contratos de seguridad y compatibilidad

- Mantener autenticación de administración en encabezados, no tokens de administración en query strings.
- Enlaces de reproducción firmados de corta duración y validación de ruta dentro de la carpeta raíz; nunca aceptar rutas arbitrarias.
- Mantener el servidor y el catálogo retrocompatibles; los cambios de esquema deben ser aditivos y con migraciones nuevas.
- No modificar tablas/policies existentes sin inspección y migración compatible. Las políticas RLS deben probarse con usuario anónimo y autenticado.
- No abrir el puerto del servidor a Internet de forma automática. Acceso remoto solo con túnel/HTTPS autenticado configurado explícitamente.
- Mantener la reproducción directa como primera opción. La transcodificación será fallback para formatos incompatibles.

## Criterios de aceptación antes de publicar

- Compilación Android PRO 4.0 con applicationId distinto a todos los APK anteriores y verificado leyendo el APK final.
- Paquete Roku PRO 4.0 generado en ruta separada y probado en dispositivo físico; el canal previo permanece intacto.
- Pruebas de escaneo sin borrar ni mover archivos; pruebas de cambios y duplicados.
- Pruebas de MP4/H.264/AAC y formatos de entrada incompatibles, incluyendo fallback FFmpeg cuando esté disponible.
- Pruebas de reproducción, pausa, reanudación y progreso sincronizado entre Android y Roku.
- Pruebas de EPG, perfiles y permisos RLS.
- Pruebas del servidor Windows en Windows 10, incluyendo inicio/parada, reinicio, firewall y reconexión.
- Build y pruebas automatizadas verdes. No declarar APK final listo si falta prueba en teléfono/Roku real.

## Estado

Base de trabajo e identidades independientes creadas. Las nueve funciones son el alcance de una única entrega PRO 4.0; esta especificación no afirma que ya estén implementadas ni probadas. No publicar ni reemplazar versiones previas hasta completar todos los criterios de aceptación.


## Regla de reproducción directa (PRO 4.0)
- El catálogo nuevo solo presenta recursos HTTP(S) cuyo path termina en una extensión de vídeo directa admitida por el cliente.
- Se excluyen páginas HTML, páginas de inserción/reproductores web (incluidas rutas `/embed/`) y enlaces sin extensión multimedia reconocible.
- Android PRO 4.0 aplica el filtro mediante `VITE_SEBAS_PRO40=true`; las versiones anteriores no activan ese filtro en sus builds.
- Roku PRO 4.0 aplica el mismo criterio a películas, episodios y canales: MP4, M4V, MOV y HLS M3U8.
- No se borran filas ni archivos de la base de datos; únicamente se omiten del catálogo PRO 4.0.
- Los enlaces directos con URL firmada se aceptan porque la validación usa la ruta antes de los parámetros de consulta.
- La compatibilidad final de cada códec y contenedor debe validarse en el modelo físico de Roku; un enlace directo no garantiza que el dispositivo soporte el códec.
