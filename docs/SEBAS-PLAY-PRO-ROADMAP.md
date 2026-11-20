# SEBAS PLAY PRO — plan integrado de evolución

## Objetivo

Evolucionar el repositorio existente sin sustituir las funciones que ya sirven. Android, Roku y el panel web seguirán siendo clientes independientes del mismo catálogo autorizado de Supabase.

## Reglas que no se negocian

- No borrar ni sobrescribir el historial de la rama principal durante el desarrollo.
- Implementar y validar en una rama de trabajo; integrar mediante pull request después de revisar los checks.
- No incluir claves secretas ni service-role en clientes.
- Publicar solamente contenido propio, de dominio público o con licencia/autorización documentada.
- Supabase guarda identidad, metadatos y progreso; los videos requieren almacenamiento/hosting autorizado y compatible con cada dispositivo.
- No declarar compatibilidad de códecs, DRM, HLS ni disponibilidad sin probarlo en el dispositivo objetivo.

## Paquete de trabajo integrado

### 1. Base técnica y seguridad
- CI para compilar TypeScript/React y validar la estructura XML de Roku.
- Comprobación para impedir que credenciales service-role entren en los clientes.
- Migraciones SQL versionadas y revisión de RLS para catálogo, perfiles, favoritos y progreso.
- Revisión de límites, índices, políticas de almacenamiento y errores de sesión.
- Pruebas de regresión y compilación desde un checkout limpio.

### 2. Experiencia de catálogo
- Portada destacada, novedades, tendencias y carruseles por género.
- Búsqueda y filtros por título, año, género y clasificación.
- Fichas con póster, fondo, sinopsis, reparto, duración, clasificación y metadatos cuando existan.
- Favoritos, pendientes y continuar viendo.
- Estados vacíos, carga, desconexión y errores con mensajes comprensibles.

### 3. Reproductor
- Reproductor integrado para formatos realmente soportados por el dispositivo.
- Reanudación y guardado de progreso sin escrituras repetitivas.
- Selección de pistas/subtítulos/calidad solo cuando el manifiesto y el reproductor lo permitan.
- Controles de pausa, búsqueda, pantalla completa y siguiente episodio donde sean compatibles.
- Validación HTTPS y diagnóstico de fallos de reproducción.
- Guía de compatibilidad por plataforma y pruebas con muestras legales.

### 4. Series
- Navegación de temporadas y episodios en Android y Roku.
- Siguiente episodio, historial por episodio y reanudación.
- Visibilidad de episodios publicados únicamente.

### 5. TV en vivo
- Reproducción dentro de la app cuando el formato sea compatible.
- Categorías, favoritos, recientes y guía EPG cuando exista una fuente de programación autorizada.
- Reintentos controlados y diagnóstico de señal caída.
- No importar listas o señales sin autorización.

### 6. Perfiles y seguridad de cuenta
- Perfiles individuales vinculados a la cuenta.
- Perfil infantil y PIN parental.
- Recuperación de cuenta y administración de sesiones/dispositivos.
- Datos y progreso separados por perfil, con políticas RLS adecuadas.

### 7. Panel administrativo
- Edición de fichas existentes y administración de temporadas/episodios.
- Carga autorizada de medios y gestión de portadas.
- Validación de URL, campos obligatorios y derechos antes de publicar.
- Previsualización, borradores, programación y retirada.
- Métricas de reproducción y registros de fallos sin exponer datos sensibles.

### 8. Roku
- Fichas, navegación de temporadas/episodios, estados de carga y errores.
- Navegación completa con control remoto y accesibilidad de foco.
- Pruebas en emulador o Roku físico; empaquetar ZIP no equivale a validar el canal en hardware.

### 9. Android
- APK independiente con identificador com.eleazarcompany.sebasplay.
- Pruebas de instalación, orientación, ciclo de vida, reproducción y enlaces profundos.
- Generar artefacto solo después de compilar correctamente.

## Criterios de aceptación

1. npm run build pasa desde un checkout limpio.
2. XML de Roku parsea y el ZIP se genera sin archivos faltantes.
3. APK debug se compila y se instala en un dispositivo Android de prueba.
4. Roku se prueba en emulador/dispositivo real; no basta con empaquetar.
5. RLS impide a un usuario leer/modificar datos privados de otro.
6. Reproducción se valida con fuentes de prueba legales y formatos compatibles.
7. Ningún cliente contiene service-role ni secretos.
8. Los cambios se integran mediante PR con checks aprobados.

## Estado de implementación

Este documento define el paquete completo solicitado. Las funciones no se consideran terminadas hasta que exista código, pruebas y evidencia de ejecución en los dispositivos correspondientes.
