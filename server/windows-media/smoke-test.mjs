import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "sebas-play-media-"));
const sample = Buffer.from("SEBAS-PLAY-TEST");
await fs.writeFile(path.join(temp, "sample.mp4"), sample);
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
  assert.equal((await health.json()).ok, true);\n  assert.equal(health.headers.get("access-control-allow-origin"), "*");

  const denied = await fetch("http://127.0.0.1:18787/api/catalog");
  assert.equal(denied.status, 401, "catalog must require admin token");

  const catalogResponse = await fetch("http://127.0.0.1:18787/api/catalog", {
    headers: { authorization: "Bearer " + env.SEBAS_ACCESS_TOKEN }
  });
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.count, 1);
  const stream = await fetch(catalog.items[0].stream_url, { headers: { range: "bytes=0-5" } });
  assert.equal(stream.status, 206, "video endpoint must support HTTP Range");
  assert.equal(stream.headers.get("content-range"), `bytes 0-5/${sample.length}`);
  assert.equal(await stream.text(), "SEBAS-");
  console.log("PASS: health, admin authorization, signed playback URL and HTTP Range.");
} finally {
  child.kill("SIGTERM");
  await wait(150);
  await fs.rm(temp, { recursive: true, force: true });
}
