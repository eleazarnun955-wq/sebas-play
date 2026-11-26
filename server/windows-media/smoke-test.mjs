import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "sebas-play-media-"));
const sample = Buffer.from("SEBAS-PLAY-TEST");
const outsidePath = path.join(os.tmpdir(), "sebas-play-outside-" + process.pid + ".mp4");
await fs.writeFile(path.join(temp, "sample.mp4"), sample);
await fs.writeFile(path.join(temp, "sample.nfo"), `<movie><title>Película de prueba</title><year>2024</year><plot><![CDATA[Una historia &amp; una prueba.]]></plot><mpaa>PG-13</mpaa><genre>Acción</genre><genre>Ciencia ficción</genre><runtime>118</runtime></movie>`);
await fs.writeFile(outsidePath, Buffer.from("OUTSIDE-LIBRARY"));
await fs.symlink(outsidePath, path.join(temp, "outside-link.mp4"));
const env = {
  ...process.env,
  SEBAS_MEDIA_ROOT: temp,
  SEBAS_HOST: "127.0.0.1",
  SEBAS_PORT: "18787",
  SEBAS_ACCESS_TOKEN: "test-access-token-that-is-long-enough-123456",
  SEBAS_SIGNING_SECRET: "test-signing-secret-that-is-long-enough-for-hmac-123456789",
  SEBAS_PUBLIC_BASE_URL: "http://127.0.0.1:18787",
  SEBAS_SCAN_INTERVAL_MS: "500",
  SEBAS_WATCH_DEBOUNCE_MS: "250",
};
const child = spawn(process.execPath, [new URL("./server.mjs", import.meta.url).pathname], { env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stdout.on("data", chunk => { logs += chunk.toString(); });
child.stderr.on("data", chunk => { logs += chunk.toString(); });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let health;
  for (let i = 0; i < 30; i++) {
    try { health = await fetch("http://127.0.0.1:18787/health"); if (health.ok) break; }
    catch {}
    if (child.exitCode !== null) throw new Error("Media server exited: " + logs);
    await wait(250);
  }
  assert.ok(health?.ok, "health endpoint did not become ready: " + logs);
  assert.equal((await health.json()).ok, true);

  const capabilitiesResponse = await fetch("http://127.0.0.1:18787/api/capabilities", { headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN } });
  assert.equal(capabilitiesResponse.status, 200, "capability discovery must require and accept the admin token");
  const capabilities = await capabilitiesResponse.json();
  assert.equal(capabilities.ok, true);
  assert.equal(capabilities.capabilities.direct_play, true);
  assert.equal(capabilities.capabilities.http_range, true);
  assert.equal(typeof capabilities.capabilities.ffmpeg.available, "boolean");
  assert.ok(capabilities.capabilities.ffmpeg.available ? capabilities.capabilities.ffmpeg.version : capabilities.capabilities.ffmpeg.reason);
  const deniedCapabilities = await fetch("http://127.0.0.1:18787/api/capabilities");
  assert.equal(deniedCapabilities.status, 401, "capability discovery must not be public");
  assert.equal(health.headers.get("access-control-allow-origin"), "*");

  const landing = await fetch("http://127.0.0.1:18787/");
  assert.equal(landing.status, 200, "server home page must load");
  assert.match(await landing.text(), /SEBAS PLAY/);

  const upload = await fetch("http://127.0.0.1:18787/api/upload?name=uploaded.mp4", {
    method: "POST",
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN, "content-type": "video/mp4" },
    body: Buffer.from("NEW-VIDEO"),
  });
  assert.equal(upload.status, 201, "authenticated uploads must be accepted");
  const uploaded = await upload.json();
  assert.match(uploaded.file, /uploaded\.mp4$/);
  const denied = await fetch("http://127.0.0.1:18787/api/catalog");
  assert.equal(denied.status, 401, "catalog must require admin token");
  const queryTokenDenied = await fetch("http://127.0.0.1:18787/api/catalog?access_token=" + encodeURIComponent(env.SEBAS_ACCESS_TOKEN));
  assert.equal(queryTokenDenied.status, 401, "admin token in URL must never authorize requests");
  const preflight = await fetch("http://127.0.0.1:18787/api/catalog", {
    method: "OPTIONS",
    headers: { origin: "https://app.example.test", "access-control-request-method": "GET", "access-control-request-headers": "authorization" },
  });
  assert.equal(preflight.status, 204, "Authorization header preflight must be supported");
  assert.match(preflight.headers.get("access-control-allow-headers") || "", /Authorization/i);

  const catalogResponse = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.count, 2);
  assert.ok(!catalog.items.some(item => item.file === "outside-link.mp4"), "symbolic links must never enter the media catalog");
  assert.equal(catalog.scan.count, 2, "automatic scanner should index original and uploaded media");
  const scanDenied = await fetch("http://127.0.0.1:18787/api/scan", { method:"POST" });
  assert.equal(scanDenied.status, 401, "manual library scan must require admin token");
  const statusDenied = await fetch("http://127.0.0.1:18787/api/status");
  assert.equal(statusDenied.status, 401, "server status must require admin token");
  const statusResponse = await fetch("http://127.0.0.1:18787/api/status", {
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal(statusResponse.status, 200);
  const serverStatus = await statusResponse.json();
  assert.equal(serverStatus.library_count, 2);
  assert.equal(serverStatus.scan.lastError, null);
  assert.ok(serverStatus.storage === null || serverStatus.storage.free_bytes >= 0);
  // New media files are discovered automatically (filesystem watcher on Windows,
  // short reconciliation interval on platforms without recursive watch support).
  await fs.writeFile(path.join(temp, "new-arrival.mp4"), Buffer.from("AUTO-INDEXED"));
  let autoCatalog;
  for (let i = 0; i < 20; i++) {
    const response = await fetch("http://127.0.0.1:18787/api/catalog", {
      headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
    });
    autoCatalog = await response.json();
    if (autoCatalog.items.some(item => item.title === "new-arrival")) break;
    await wait(150);
  }
  assert.ok(autoCatalog.items.some(item => item.title === "new-arrival"), "new files should be indexed automatically without manual scan");
  assert.equal(autoCatalog.count, 3);

  await fs.writeFile(path.join(temp, "new-arrival.mp4"), Buffer.from("AUTO-INDEXED-BUT-LONGER"));
  let changedCatalog;
  for (let i = 0; i < 20; i++) {
    const response = await fetch("http://127.0.0.1:18787/api/catalog", {
      headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
    });
    changedCatalog = await response.json();
    if (changedCatalog.items.find(item => item.title === "new-arrival")?.size_bytes === Buffer.byteLength("AUTO-INDEXED-BUT-LONGER")) break;
    await wait(150);
  }
  assert.equal(changedCatalog.items.find(item => item.title === "new-arrival")?.size_bytes, Buffer.byteLength("AUTO-INDEXED-BUT-LONGER"), "changed files should refresh automatically");

  await fs.unlink(path.join(temp, "new-arrival.mp4"));
  let deletedCatalog;
  for (let i = 0; i < 20; i++) {
    const response = await fetch("http://127.0.0.1:18787/api/catalog", {
      headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
    });
    deletedCatalog = await response.json();
    if (!deletedCatalog.items.some(item => item.title === "new-arrival")) break;
    await wait(150);
  }
  assert.ok(!deletedCatalog.items.some(item => item.title === "new-arrival"), "deleted files should disappear from the catalog automatically");
  assert.equal(deletedCatalog.count, 2);

  const sampleItem = catalog.items.find(item => item.file === "sample.mp4");
  assert.ok(sampleItem, "original test video should remain in the library");
  assert.equal(sampleItem.title, "Película de prueba", "NFO title should override the file-name fallback");
  assert.equal(sampleItem.synopsis, "Una historia & una prueba.");
  assert.equal(sampleItem.release_year, 2024);
  assert.equal(sampleItem.age_rating, "PG-13");
  assert.deepEqual(sampleItem.genres, ["Acción", "Ciencia ficción"]);
  assert.equal(sampleItem.duration_minutes, 118);
  await wait(10);
  await fs.writeFile(path.join(temp, "sample.nfo"), `<movie><title>Película de prueba</title><year>2025</year><plot>Metadatos actualizados</plot><genre>Drama</genre></movie>`);
  const nfoRefresh = await fetch("http://127.0.0.1:18787/api/scan", { method:"POST", headers:{ authorization:"Bearer " + env.SEBAS_ACCESS_TOKEN } });
  assert.equal(nfoRefresh.status, 200);
  const refreshedNfoResponse = await fetch("http://127.0.0.1:18787/api/catalog", { headers:{ authorization:"Bearer " + env.SEBAS_ACCESS_TOKEN } });
  const refreshedNfoCatalog = await refreshedNfoResponse.json();
  const refreshedNfoItem = refreshedNfoCatalog.items.find(item => item.title === "sample");
  assert.equal(refreshedNfoItem.release_year, 2025, "changed NFO sidecars should refresh metadata");
  assert.equal(refreshedNfoItem.synopsis, "Metadatos actualizados");
  assert.deepEqual(refreshedNfoItem.genres, ["Drama"]);
  const stream = await fetch(sampleItem.stream_url, { headers: { range: "bytes=0-5" } });
  assert.equal(stream.status, 206, "video endpoint must support HTTP Range");
  assert.equal(stream.headers.get("content-range"), `bytes 0-5/${sample.length}`);
  assert.equal(await stream.text(), "SEBAS-");

  const headStream = await fetch(sampleItem.stream_url, { method:"HEAD", headers:{ range:"bytes=0-5" } });
  assert.equal(headStream.status, 206, "HEAD requests should preserve range metadata");
  assert.equal(headStream.headers.get("content-range"), `bytes 0-5/${sample.length}`);
  assert.equal(await headStream.text(), "", "HEAD requests must not return a video body");

  const suffixStream = await fetch(sampleItem.stream_url, { headers:{ range:"bytes=-4" } });
  assert.equal(suffixStream.status, 206, "suffix byte ranges should be supported");
  assert.equal(await suffixStream.text(), "TEST", "suffix ranges should return the requested tail bytes");

  const invalidRange = await fetch(sampleItem.stream_url, { headers:{ range:"bytes=9999-10000" } });
  assert.equal(invalidRange.status, 416, "unsatisfiable byte ranges should return 416");

  const traversalExpiry = Math.floor(Date.now()/1000) + 60;
  const traversalRel = "../" + path.basename(outsidePath);
  const traversalSig = crypto.createHmac("sha256", env.SEBAS_SIGNING_SECRET).update(traversalRel + "\n" + traversalExpiry).digest("hex");
  const traversal = await fetch("http://127.0.0.1:18787/media/..%2F" + encodeURIComponent(path.basename(outsidePath)) + "?exp=" + traversalExpiry + "&sig=" + traversalSig);
  assert.equal(traversal.status, 400, "even a correctly signed path traversal must be rejected");

  const expiredUrl = new URL(sampleItem.stream_url);
  expiredUrl.searchParams.set("exp", String(Math.floor(Date.now()/1000) - 60));
  const expired = await fetch(expiredUrl);
  assert.equal(expired.status, 401, "expired signed playback links must be rejected");

  const tamperedUrl = new URL(sampleItem.stream_url);
  tamperedUrl.searchParams.set("sig", "0".repeat(64));
  const tampered = await fetch(tamperedUrl);
  assert.equal(tampered.status, 403, "tampered signed playback links must be rejected");

  const unauthorizedUpload = await fetch("http://127.0.0.1:18787/api/upload?name=blocked.mp4", {
    method:"POST",
    headers:{ "content-type":"video/mp4" },
    body:Buffer.from("SHOULD-NOT-BE-WRITTEN"),
  });
  assert.equal(unauthorizedUpload.status, 401, "uploads must require the admin token");
  assert.equal(await fs.access(path.join(temp, "blocked.mp4")).then(() => true).catch(() => false), false, "unauthorized upload must not create a file");
  // LAN requests must create URLs pointing to the laptop, never localhost.
  const lanResponse = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN, "x-forwarded-host": "192.168.1.15:18787", "x-forwarded-proto": "http" }
  });
  assert.equal(lanResponse.status, 200);
  const lanCatalog = await lanResponse.json();
  assert.ok(lanCatalog.items[0].stream_url.startsWith("http://192.168.1.15:18787/media/"));
  assert.ok(!lanCatalog.items[0].stream_url.includes("localhost"));

  // A reverse proxy can supply the stable public HTTPS hostname.
  const remoteResponse = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers: {
      authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN,
      host: "127.0.0.1:18787",
      "x-forwarded-host": "media.example.test",
      "x-forwarded-proto": "https"
    }
  });
  assert.equal(remoteResponse.status, 200);
  const remoteCatalog = await remoteResponse.json();
  assert.ok(remoteCatalog.items[0].stream_url.startsWith("https://media.example.test/media/"));

  // Verify a manual scan detects removals without touching the original library file.
  await fs.unlink(path.join(temp, uploaded.file));
  const refresh = await fetch("http://127.0.0.1:18787/api/scan", {
    method:"POST",
    headers:{ authorization:"Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal(refresh.status, 200);
  const refreshed = await refresh.json();
  assert.equal(refreshed.library_count, 1, "manual scan should remove deleted files from the catalog index while retaining the original media");
  const refreshedCatalog = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers:{ authorization:"Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal((await refreshedCatalog.json()).count, 1);

  console.log("PASS: home page, health, protected catalog/uploads, automatic indexing, refresh/removal, LAN/HTTPS URLs, signed playback expiry/tampering, HEAD and HTTP Range.");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise(resolve => child.once("exit", resolve));
    child.kill("SIGTERM");
    await Promise.race([exited, wait(3000)]);
  }
  assert.equal(child.exitCode, 0, "media server should exit cleanly after SIGTERM: " + logs);
  assert.ok(logs.includes("apagado ordenado (SIGTERM)"), "server should log its graceful shutdown path");
  await fs.rm(temp, { recursive: true, force: true });
  await fs.rm(outsidePath, { force: true });
}
