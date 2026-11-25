import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "sebas-play-media-"));
const sample = Buffer.from("SEBAS-PLAY-TEST");
await fs.writeFile(path.join(temp, "sample.mp4"), sample);
await fs.writeFile(path.join(temp, "sample.mkv"), Buffer.from("MKV-TEST"));
await fs.writeFile(path.join(temp, "sample.avi"), Buffer.from("AVI-TEST"));
await fs.mkdir(path.join(temp, "Subcarpeta"), { recursive: true });
await fs.writeFile(path.join(temp, "Subcarpeta", "episode.webm"), Buffer.from("WEBM-TEST"));
const env = {
  ...process.env,
  SEBAS_MEDIA_ROOT: temp,
  SEBAS_HOST: "127.0.0.1",
  SEBAS_PORT: "18787",
  SEBAS_ACCESS_TOKEN: "test-access-token-that-is-long-enough-123456",
  SEBAS_SIGNING_SECRET: "test-signing-secret-that-is-long-enough-for-hmac-123456789",
  SEBAS_PUBLIC_BASE_URL: "http://127.0.0.1:18787",
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

  const catalogResponse = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.count, 5, "catalog must include MP4, MKV, AVI, recursively found WebM and the uploaded MP4");
  assert.ok(catalog.items.some(item => item.file === "sample.mkv" && item.mime_type === "video/x-matroska"));
  assert.ok(catalog.items.some(item => item.file === "sample.avi" && item.mime_type === "video/x-msvideo"));
  assert.ok(catalog.items.some(item => item.file === path.join("Subcarpeta", "episode.webm").split(path.sep).join("/")));
  const sampleItem = catalog.items.find(item => item.file === "sample.mp4");
  assert.ok(sampleItem, "original test video should remain in the library");
  const mkvItem = catalog.items.find(item => item.file === "sample.mkv");
  const aviItem = catalog.items.find(item => item.file === "sample.avi");
  assert.ok(mkvItem && aviItem, "MKV and AVI must be listed alongside MP4");
  const stream = await fetch(sampleItem.stream_url, { headers: { range: "bytes=0-5" } });
  assert.equal(stream.status, 206, "video endpoint must support HTTP Range");
  assert.equal(stream.headers.get("content-range"), `bytes 0-5/${sample.length}`);
  assert.equal(await stream.text(), "SEBAS-");
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

  console.log("PASS: recursive catalog includes MP4/MKV/AVI/WebM, plus protected access, LAN/HTTPS URLs, signed playback and HTTP Range.");
} finally {
  child.kill("SIGTERM");
  await wait(150);
  await fs.rm(temp, { recursive: true, force: true });
}
