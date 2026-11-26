import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const edge = await readFile(new URL("../supabase/functions/sebas-family-profiles/index.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20261126021831_add_family_profiles.sql", import.meta.url), "utf8");
const ui = await readFile(new URL("../src/ViewerApp.tsx", import.meta.url), "utf8");
const denyMigration = await readFile(new URL("../supabase/migrations/20261126021845_deny_client_family_profile_access.sql", import.meta.url), "utf8");

for (const action of ["list-profiles", "create-profile", "verify-profile-pin", "set-profile-pin", "delete-profile"]) {
  assert.ok(edge.includes(`action === "${action}"`), `missing edge action: ${action}`);
}
assert.ok(edge.includes("hashProfilePin"), "PINs must be hashed before persistence");
assert.ok(edge.includes("verifyProfilePin"), "PIN verification must use the secure verifier");
assert.ok(edge.includes("locked_until"), "PIN failures must support temporary lockout");
assert.ok(migration.includes("enable row level security"), "family profiles must have RLS enabled");
assert.ok(migration.includes("revoke all on table public.family_profiles from anon, authenticated"), "client roles must not read PIN hashes");
assert.ok(migration.includes("pin_hash"), "migration must store the derived PIN hash, not raw PIN");
assert.ok(denyMigration.includes("using (false)") && denyMigration.includes("with check (false)"), "direct client access must be denied by RLS");
assert.ok(ui.includes("verify-profile-pin"), "viewer must call the PIN verification endpoint");
assert.ok(ui.includes("Crear perfil"), "viewer must expose profile creation");
console.log("Family profile endpoint contract tests passed.");
