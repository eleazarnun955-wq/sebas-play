import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.SEBAS_MEDIA_ROOT || path.join(HERE, "Peliculas"));
const HOST = process.env.SEBAS_HOST || "0.0.0.0";
const PORT = Number(process.env.SEBAS_PORT || 8787);
const ACCESS_TOKEN = process.env.SEBAS_ACCESS_TOKEN || "";
const SIGNING_SECRET = process.env.SEBAS_SIGNING_SECRET || "";
const PUBLIC_BASE = (process.env.SEBAS_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const URL_TTL_SECONDS = Math.max(3600, Number(process.env.SEBAS_URL_TTL_SECONDS || 2592000));
const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.SEBAS_MAX_UPLOAD_BYTES || 21474836480));
const ALLOWED = new Set([".mp4", ".m4v", ".mov", ".webm", ".mkv", ".avi", ".wmv", ".flv", ".mpg", ".mpeg", ".m4v", ".3gp", ".ts", ".m2ts", ".mts", ".vob", ".ogv"]);
const MIME = { ".mp4":"video/mp4", ".m4v":"video/x-m4v", ".mov":"video/quicktime", ".webm":"video/webm", ".mkv":"video/x-matroska", ".avi":"video/x-msvideo", ".wmv":"video/x-ms-wmv", ".flv":"video/x-flv", ".mpg":"video/mpeg", ".mpeg":"video/mpeg", ".3gp":"video/3gpp", ".ts":"video/mp2t", ".m2ts":"video/mp2t", ".mts":"video/mp2t", ".vob":"video/dvd", ".ogv":"video/ogg" };

if (!ACCESS_TOKEN || ACCESS_TOKEN.length < 24) {
  console.error("Falta la clave de acceso. Ejecuta setup-server.ps1 para preparar el servidor.");
  process.exit(1);
}
if (!SIGNING_SECRET || SIGNING_SECRET.length < 32) {
  console.error("Falta la clave de firma. Ejecuta setup-server.ps1 para preparar el servidor.");
  process.exit(1);
}
fs.mkdirSync(ROOT, { recursive: true });

function json(res, status, value) {
  res.writeHead(status, { "content-type":"application/json; charset=utf-8", "cache-control":"no-store", "x-content-type-options":"nosniff", "access-control-allow-origin":"*", "access-control-allow-headers":"Authorization,Content-Type,Range", "access-control-expose-headers":"Content-Length,Content-Range,Accept-Ranges" });
  res.end(JSON.stringify(value));
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function authorized(req, url) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(bearer, ACCESS_TOKEN) || safeEqual(url.searchParams.get("access_token"), ACCESS_TOKEN);
}
function signature(rel, exp) {
  return crypto.createHmac("sha256", SIGNING_SECRET).update(`${rel}\n${exp}`).digest("hex");
}
function requestBaseUrl(req) {
  // A configured public HTTPS URL wins. Ignore the old localhost default because
  // localhost on a phone/Roku points to that device, not to the Windows laptop.
  if (PUBLIC_BASE && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(PUBLIC_BASE)) return PUBLIC_BASE;
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.headers.host || "");
  if (!host || /[\r\n\s]/.test(host)) throw new Error("No se pudo determinar el host de acceso al servidor");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  const proto = forwardedProto === "https" || Boolean(req.socket.encrypted) ? "https" : "http";
  return `${proto}://${host}`;
}
function signedUrl(rel, req) {
  const exp = Math.floor(Date.now()/1000) + URL_TTL_SECONDS;
  const encoded = rel.split(path.sep).map(encodeURIComponent).join("/");
  return `${requestBaseUrl(req)}/media/${encoded}?exp=${exp}&sig=${signature(rel, exp)}`;
}
function safePath(rel) {
  if (!rel || rel.includes("\0")) return null;
  const full = path.resolve(ROOT, rel);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}
async function walk(dir, prefix = "", req) {
  const out = [];
  for (const ent of await fs.promises.readdir(dir, { withFileTypes:true })) {
    const abs = path.join(dir, ent.name);
    const rel = path.join(prefix, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) out.push(...await walk(abs, rel, req));
    else if (ent.isFile() && ALLOWED.has(path.extname(ent.name).toLowerCase())) {
      const st = await fs.promises.stat(abs);
      out.push({ id: crypto.createHash("sha1").update(rel).digest("hex"), title:path.basename(ent.name, path.extname(ent.name)), file:rel.split(path.sep).join("/"), size_bytes:st.size, mime_type:MIME[path.extname(ent.name).toLowerCase()], stream_url:signedUrl(rel, req) });
    }
  }
  return out;
}
function sendError(res, status, message) { json(res, status, { error:message }); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "access-control-allow-origin":"*", "access-control-allow-methods":"GET,HEAD,POST,OPTIONS", "access-control-allow-headers":"Authorization,Content-Type,Range", "access-control-expose-headers":"Content-Length,Content-Range,Accept-Ranges" });
    return res.end();
  }
  if (url.pathname === "/" && req.method === "GET") {
    const base = requestBaseUrl(req);
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101827"><title>SEBAS PLAY · Servidor</title><style>*{box-sizing:border-box}body{margin:0;background:#101827;color:#edf3ff;font:16px system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:22px}.card{width:min(100%,560px);background:#1b2940;border:1px solid #33445f;border-radius:22px;padding:28px;box-shadow:0 20px 60px #0005}h1{margin:0 0 8px;font-size:28px}p{color:#b9c8dc;line-height:1.55}.ok{color:#68e0a0;font-weight:700}.link{display:block;margin:12px 0;padding:14px;border-radius:12px;background:#263954;color:#fff;text-decoration:none;overflow-wrap:anywhere}.small{font-size:13px;color:#9eb0c8}</style><main class="card"><div class="ok">● SERVIDOR ACTIVO</div><h1>SEBAS PLAY</h1><p>El servidor multimedia de tu laptop está encendido y disponible en esta red.</p><a class="link" href="${base}/health">Comprobar estado del servidor</a><p>El catálogo y las películas están protegidos. Conecta desde el panel administrador de SEBAS PLAY usando el token privado de esta laptop.</p><p>Biblioteca local: <b>Peliculas</b><br>Formatos: MP4, M4V, MOV y WebM</p><p class="small">Esta página confirma que la laptop responde. Para administrar la biblioteca, usa el panel de SEBAS PLAY y sus credenciales privadas. No compartas tu token.</p></main></html>`;
    res.writeHead(200, { "content-type":"text/html; charset=utf-8", "cache-control":"no-store", "x-content-type-options":"nosniff" });
    return res.end(html);
  }
  if (url.pathname === "/health" && req.method === "GET") return json(res, 200, { ok:true, service:"SEBAS PLAY Windows Media Server", storage_root:ROOT, port:PORT, access_url:`${requestBaseUrl(req)}/` });
  if (url.pathname === "/api/upload" && req.method === "POST") {
    if (!authorized(req, url)) return sendError(res, 401, "No autorizado");
    const length = Number(req.headers["content-length"] || 0);
    if (!Number.isSafeInteger(length) || length <= 0) return sendError(res, 411, "Se requiere Content-Length");
    if (length > MAX_UPLOAD_BYTES) return sendError(res, 413, "El archivo supera el límite configurado");
    const rawName = (url.searchParams.get("name") || "").split("/").pop() || "";
    const cleanName = rawName.replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/^\.+/, "").trim();
    const ext = path.extname(cleanName).toLowerCase();
    if (!cleanName || !ALLOWED.has(ext)) return sendError(res, 415, "Formato no admitido. Usa MP4, M4V, MOV o WebM.");
    const fileName = `${Date.now()}-${cleanName}`;
    const destination = safePath(fileName);
    try {
      await pipeline(req, fs.createWriteStream(destination, { flags: "wx" }));
      return json(res, 201, { ok:true, file:fileName, size_bytes:length, mime_type:MIME[ext] });
    } catch (error) {
      await fs.promises.unlink(destination).catch(() => {});
      return sendError(res, 400, error instanceof Error ? error.message : "No se pudo guardar el archivo");
    }
  }
  if (url.pathname === "/api/catalog" && req.method === "GET") {
    if (!authorized(req, url)) return sendError(res, 401, "No autorizado");
    try {
      const items = await walk(ROOT, "", req);
      return json(res, 200, { items, count:items.length, generated_at:new Date().toISOString(), note:"Solo archivos locales MP4/M4V/MOV/WebM. Publica únicamente contenido con derechos." });
    } catch (e) { return sendError(res, 500, e.message || "No se pudo leer la biblioteca"); }
  }
  if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/media/")) {
    let rel;
    try { rel = url.pathname.slice("/media/".length).split("/").map(decodeURIComponent).join(path.sep); }
    catch { return sendError(res, 400, "Ruta inválida"); }
    const exp = Number(url.searchParams.get("exp") || 0);
    const sig = url.searchParams.get("sig") || "";
    if (!Number.isSafeInteger(exp) || exp < Math.floor(Date.now()/1000)) return sendError(res, 401, "Enlace vencido");
    if (!safeEqual(sig, signature(rel, exp))) return sendError(res, 403, "Firma inválida");
    const full = safePath(rel);
    if (!full) return sendError(res, 400, "Ruta fuera de la biblioteca");
    try {
      const realRoot = await fs.promises.realpath(ROOT);
      const realFile = await fs.promises.realpath(full);
      if (!realFile.startsWith(realRoot + path.sep)) return sendError(res, 403, "Ruta no permitida");
      const st = await fs.promises.stat(realFile);
      if (!st.isFile() || !ALLOWED.has(path.extname(realFile).toLowerCase())) return sendError(res, 404, "Archivo no encontrado");
      const type = MIME[path.extname(realFile).toLowerCase()];
      const range = req.headers.range;
      let start = 0, end = st.size - 1, status = 200;
      if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!m) { res.writeHead(416, { "content-range":`bytes */${st.size}` }); return res.end(); }
        if (m[1] === "" && m[2] !== "") { const suffix = Number(m[2]); start = Math.max(0, st.size - suffix); }
        else { start = Number(m[1]); if (m[2]) end = Math.min(end, Number(m[2])); }
        if (start > end || start >= st.size) { res.writeHead(416, { "content-range":`bytes */${st.size}` }); return res.end(); }
        status = 206;
      }
      const headers = { "content-type":type, "content-length":end-start+1, "accept-ranges":"bytes", "cache-control":"private, max-age=3600", "x-content-type-options":"nosniff", "access-control-allow-origin":"*" };
      if (status === 206) headers["content-range"] = `bytes ${start}-${end}/${st.size}`;
      res.writeHead(status, headers);
      if (req.method === "HEAD") return res.end();
      const stream = fs.createReadStream(realFile, { start, end });
      stream.on("error", () => { if (!res.headersSent) sendError(res, 500, "Error leyendo el archivo"); else res.destroy(); });
      stream.pipe(res);
    } catch { return sendError(res, 404, "Archivo no encontrado"); }
    return;
  }
  return sendError(res, 404, "Ruta no encontrada");
});
server.listen(PORT, HOST, () => console.log(`SEBAS PLAY Media Server activo en http://${HOST}:${PORT}\nPrueba local: http://localhost:${PORT}/health\nBiblioteca: ${ROOT}\nArchivos compatibles: MP4, M4V, MOV, WebM`));
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
