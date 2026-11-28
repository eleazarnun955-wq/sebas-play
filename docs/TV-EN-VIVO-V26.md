# SEBAS PLAY 26.0 — TV en vivo en español

## Regla de publicación

El panel muestra una lista de señales candidatas cuyo enlace es una URL HTTPS terminada en `.m3u8`. La aplicación no acepta páginas web, portales, enlaces de búsqueda ni reproductores incrustados como dirección de canal.

Las señales de esta lista son **candidatas técnicas**, no una declaración de licencia ni una garantía de disponibilidad. Las emisoras pueden restringir la reproducción fuera de su país, rotar las direcciones o limitar el uso a su reproductor oficial. No se retransmiten ni alojan las señales.

## Candidatas incorporadas al panel

- México: Canal Once; Canal 10 Chetumal.
- España: 24 Horas RTVE; La 1 RTVE; La 2 RTVE; Teledeporte RTVE; Clan RTVE; Aragón TV; 101TV Málaga.
- Internacional: DW Español.

Las direcciones HLS se recopilaron de listados públicos de señales que identifican a las emisoras y sus streams directos. Los listados consultados incluyen [M3U Player Pro — canales en español](https://m3uplayerpro.com/free-streams/es), [FreetuxTV — señales en español](https://database.freetuxtv.net/webStream/index?WebStreamSearchForm%5BLanguage%5D=es%26WebStreamSearchForm%5BStatus%5D=2%26WebStreamSearchForm%5BType%5D=1) y [Free-TV/IPTV — España](https://github.com/Free-TV/IPTV/blob/master/lists/spain.md). Estos directorios sirven para localizar endpoints, pero no sustituyen la confirmación de derechos por parte de cada emisora.

## Flujo seguro

1. El administrador elige una señal candidata; el formulario se rellena con la URL HLS directa.
2. La señal se guarda como borrador, nunca se publica automáticamente.
3. El administrador debe probarla desde la región/dispositivo previsto y documentar la autorización o los derechos de reproducción.
4. El panel bloquea la publicación si el enlace no es HTTPS HLS directo o si falta la nota de derechos.
5. Android y Roku filtran el catálogo público para mostrar solo URLs HLS directas; Roku asigna `StreamFormat = "hls"`.

**Límite de verificación:** la compilación automatizada comprueba el formato y las reglas de publicación, pero no equivale a probar cada señal en un teléfono o Roku físico. La disponibilidad y la autorización final deben confirmarse antes de publicar cada canal.
