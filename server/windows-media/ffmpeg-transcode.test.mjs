import assert from "node:assert/strict";
import { buildTranscodeArgs, transcodeOutputPath } from "./ffmpeg-transcode.mjs";

const id = "123e4567-e89b-42d3-a456-426614174000";
assert.equal(transcodeOutputPath(id), `Transcodificados/${id}.mp4`);
assert.throws(() => transcodeOutputPath("../escape"), /Identificador/);
const roku = buildTranscodeArgs("Peliculas/original.mkv", "Transcodificados/out.mp4", "roku");
assert.ok(roku.includes("libx264"));
assert.ok(roku.includes("aac"));
assert.ok(roku.includes("1920"));
const mobile = buildTranscodeArgs("in.mkv", "out.mp4", "mobile");
assert.ok(mobile.includes("1280"));
assert.throws(() => buildTranscodeArgs("in", "out", "unknown"), /Perfil/);
console.log("FFmpeg transcode argument tests passed.");
