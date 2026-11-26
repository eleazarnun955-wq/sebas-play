import assert from "node:assert/strict";
import fs from "node:fs/promises";

const root = new URL("./", import.meta.url);
const installer = await fs.readFile(new URL("INSTALAR-SEBAS-PLAY.bat", root), "utf8");
const uninstaller = await fs.readFile(new URL("QUITAR-INICIO-AUTOMATICO.bat", root), "utf8");
const start = await fs.readFile(new URL("start-server.bat", root), "utf8");
const readme = await fs.readFile(new URL("README.md", root), "utf8");

assert.match(installer, /choice \/C SN/i, "installer must ask before enabling automatic startup");
assert.match(installer, /if errorlevel 2 goto skip_autostart/i, "answering No must skip startup registration");
assert.match(installer, /SEBAS PLAY Servidor\.lnk/i, "installer must create the documented startup shortcut only after consent");
assert.match(installer, /:skip_autostart/i, "installer must provide a manual-start path");
assert.ok(start.includes("server.mjs"), "manual launcher must still start the media server");
assert.match(uninstaller, /Remove-Item -LiteralPath \$shortcut/i, "uninstaller may remove only the startup shortcut");
assert.doesNotMatch(uninstaller, /Remove-Item[^\r\n]*(server-config|ACCESS-TOKEN|Peliculas|runtime)/i, "uninstaller must never delete media or private configuration");
assert.match(readme, /inicio automático es opcional/i, "documentation must describe opt-in startup");

console.log("PASS: Windows installer requires explicit startup consent; opt-out and reversible uninstall preserve media/configuration.");
