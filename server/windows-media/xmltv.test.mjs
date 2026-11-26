import assert from "node:assert/strict";
import { parseXmltv, parseXmltvDate } from "./xmltv.mjs";

const now = new Date("2026-11-25T12:00:00.000Z");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="mx.canal.1"><display-name>Canal Uno</display-name><display-name><![CDATA[Canal & Noticias]]></display-name></channel>
  <programme start="20261125130000 +0000" stop="20261125140000 +0000" channel="mx.canal.1">
    <title lang="es">Noticias &amp; Deportes</title>
    <desc><![CDATA[Resumen <b>del día</b>]]></desc><category>Noticias</category><category>Actualidad</category>
  </programme>
  <programme start="20261125140000 +0000" stop="20261125143000 +0000" channel="missing">
    <title>Programa sin canal asociado</title>
  </programme>
  <programme start="20261125150000 +0000" stop="20261125140000 +0000" channel="mx.canal.1">
    <title>Horario inválido</title>
  </programme>
</tv>`;
const result = parseXmltv(xml, now);
assert.equal(result.channels.length, 1);
assert.deepEqual(result.channels[0].display_names, ["Canal Uno", "Canal & Noticias"]);
assert.equal(result.programmes.length, 2, "valid future programmes are retained even when channel mapping is pending");
assert.equal(result.programmes[0].title, "Noticias & Deportes");
assert.equal(result.programmes[0].description, "Resumen del día");
assert.deepEqual(result.programmes[0].categories, ["Noticias", "Actualidad"]);
assert.equal(result.programmes[0].start, "2026-11-25T13:00:00.000Z");
assert.equal(parseXmltvDate("20261125130000 +0100"), Date.parse("2026-11-25T12:00:00.000Z"));
assert.equal(parseXmltvDate("20260230120000 +0000"), null);
assert.equal(parseXmltvDate("invalid"), null);
const malformedEntity = parseXmltv(`<tv><channel id="bad"><display-name>&#99999999; &#x110000;</display-name></channel></tv>`, now);
assert.deepEqual(malformedEntity.channels[0].display_names, ["&#99999999; &#x110000;"]);
assert.throws(() => parseXmltv("<not-xmltv/>", now), /estructura XMLTV válida/);
assert.throws(() => parseXmltv("x".repeat(8 * 1024 * 1024 + 1), now), /no superar 8 MB/);
console.log("XMLTV parser tests passed.");
