# SEBAS PLAY 27.0 — TV en vivo en español, México primero

## Objetivo
La versión 27 prioriza canales mexicanos públicos, culturales, educativos y regionales, sin convertir páginas web ni portales en canales. El panel acepta únicamente manifiestos HTTPS HLS directos terminados en `.m3u8`.

## Candidatas mexicanas añadidas
- Canal Catorce (SPR)
- Canal 22.2
- TV4 Cultura (Guanajuato)
- TV UNAM
- Canal 44 Chihuahua
- Se conservan Canal Once y Canal 10 Chetumal de la revisión anterior.

También se conservan las señales internacionales en español ya presentes en v26. Las nuevas direcciones mexicanas se localizaron en listas públicas de streams; por eso permanecen como borradores y no se consideran autorizadas ni garantizadas. Fuentes de referencia: [SPR — medios públicos](https://www.spr.gob.mx/medios-publicos.html), [MxPlus — televisión pública en vivo](https://mxplus.tv/television), [lista comunitaria de señales mexicanas](https://github.com/GerardoHD/Internet-TV/blob/master/Canales.m3u8).

## Prueba técnica en el panel
Se incorpora una prueba HLS con Hls.js para comprobar si el navegador recibe el manifiesto y puede iniciar reproducción. Un resultado positivo solo significa que la señal respondió en ese navegador y red; no demuestra derechos, disponibilidad permanente, ni compatibilidad con Roku o Android. El administrador debe confirmar imagen y audio, probar el dispositivo/región de destino y documentar autorización antes de publicar.

## Reglas de publicación
1. HTTPS y ruta terminada en `.m3u8`; se rechazan páginas web, portales y enlaces de reproductor.
2. Cada canal nuevo se guarda como borrador.
3. La publicación requiere nota de autorización/derechos.
4. Android y Roku solo muestran señales HLS directas.
5. Roku usa un namespace independiente `SEBASPLAY27`.

## Compatibilidad e independencia
- Android package ID: `com.eleazarcompany.sebasplay.v27.mexicolivetv20261128`.
- Roku major_version: `27`.
- Namespace Roku: `SEBASPLAY27`.
- El módulo y acceso visible **Mi laptop** se heredan sin cambios de v26.
- No se reemplazan ni modifican los paquetes instalados de versiones anteriores.

**Límite de verificación:** las pruebas automatizadas comprueban reglas y compilación. No sustituyen pruebas físicas en teléfono/Roku ni autorización del titular de cada canal.
