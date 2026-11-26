import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const edge = await readFile(new URL("../supabase/functions/roku-device-sync/index.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20261126021600_add_family_profiles.sql", import.meta.url), "utf8");
const ui = await readFile(new URL("../src/ViewerApp.tsx", import.meta.url), "utf8");

for (const action of ["list-profiles", "create-profile", "verify-profile-pin", "set-profile-pin", "delete-profile"]) {
  assert.ok(edge.includes(`requestedAction === "${action}"`), `missing edge action: ${action}`);
}
assert.ok(edge.includes("hashProfilePin"), "PINs must be hashed before persistence");
assert.ok(edge.includes("verifyProfilePin"), "PIN verification must use the secure verifier");
assert.ok(edge.includes("locked_until"), "PIN failures must support temporary lockout");
assert.ok(migration.includes("enable row level security"), "family profiles must have RLS enabled");
assert.ok(migration.includes("auth.uid()) = user_id"), "RLS must restrict rows to the owner");
assert.ok(migration.includes("pin_hash"), "migration must store the derived PIN hash, not raw PIN");
assert.ok(ui.includes("verify-profile-pin"), "viewer must call the PIN verification endpoint");
assert.ok(ui.includes("Crear perfil"), "viewer must expose profile creation");
console.log("Family profile endpoint contract tests passed.");
