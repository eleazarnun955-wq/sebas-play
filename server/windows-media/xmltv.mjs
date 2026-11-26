const MAX_XMLTV_BYTES = 8 * 1024 * 1024;
const MAX_PROGRAMMES = 10000;

function decodeXml(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ").trim();
}

function attr(tag, name) {
  const match = new RegExp("\\b" + name + "\\s*=\\s*(['"])(.*?)\\1", "i").exec(tag);
  return match?.[2] ?? null;
}

export function parseXmltv(xml, now = new Date()) {
  if (typeof xml !== "string" || Buffer.byteLength(xml, "utf8") > MAX_XMLTV_BYTES) {
    throw new Error("El archivo XMLTV debe ser texto y no superar 8 MB.");
  }
  if (!/<tv(?:\s|>)/i.test(xml) || !/<\/tv\s*>/i.test(xml)) {
    throw new Error("El archivo no tiene una estructura XMLTV válida.");
  }
  const channels = [];
  for (const match of xml.matchAll(/<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi)) {
    const id = attr("<channel " + match[1] + ">", "id");
    if (!id) continue;
    const names = [...match[2].matchAll(/<display-name(?:\s[^>]*)?>([\s\S]*?)<\/display-name>/gi)]
      .map(item => decodeXml(item[1])).filter(Boolean).slice(0, 8);
    channels.push({ id: id.slice(0, 160), display_names: names });
  }
  const programmes = [];
  for (const match of xml.matchAll(/<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi)) {
    if (programmes.length >= MAX_PROGRAMMES) break;
    const tag = "<programme " + match[1] + ">";
    const channel = attr(tag, "channel");
    const start = parseXmltvDate(attr(tag, "start"));
    const stop = parseXmltvDate(attr(tag, "stop"));
    const title = decodeXml(match[2].match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1]);
    if (!channel || !start || !stop || stop <= start || !title) continue;
    if (stop < now.getTime() - 24 * 60 * 60 * 1000 || start > now.getTime() + 14 * 24 * 60 * 60 * 1000) continue;
    const description = decodeXml(match[2].match(/<desc(?:\s[^>]*)?>([\s\S]*?)<\/desc>/i)?.[1]);
    const categories = [...match[2].matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)]
      .map(item => decodeXml(item[1])).filter(Boolean).slice(0, 5);
    programmes.push({
      channel_id: channel.slice(0, 160),
      start: new Date(start).toISOString(),
      stop: new Date(stop).toISOString(),
      title: title.slice(0, 300),
      description: description ? description.slice(0, 2000) : null,
      categories,
    });
  }
  programmes.sort((a, b) => a.start.localeCompare(b.start));
  return {
    channels: channels.slice(0, 2000),
    programmes,
    imported_at: now.toISOString(),
    source: "xmltv",
  };
}

export function parseXmltvDate(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s, sign, oh = "00", om = "00"] = match;
  const parts = [y, mo, d, h, mi, s].map(Number);
  const [year, month, day, hour, minute, second] = parts;
  const local = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(local);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day ||
      check.getUTCHours() !== hour || check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second) return null;
  const offset = (Number(oh) * 60 + Number(om)) * 60_000 * (sign === "-" ? -1 : 1);
  return local - offset;
}
