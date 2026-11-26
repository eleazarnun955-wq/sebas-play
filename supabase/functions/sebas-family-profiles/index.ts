import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { hashProfilePin, verifyProfilePin } from "./profile-security.mjs";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!url || !serviceKey) throw new Error("Missing Supabase server environment");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const reply = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers });

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
async function authenticatedUser(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply(405, { error: "Método no permitido" });
  const user = await authenticatedUser(req);
  if (!user) return reply(401, { error: "Inicia sesión para administrar perfiles" });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: "JSON inválido" }); }
  const action = String(body.action ?? "");

  if (action === "list-profiles") {
    const { data, error } = await admin.from("family_profiles")
      .select("id,display_name,avatar_url,created_at,pin_hash")
      .eq("user_id", user.id).order("created_at", { ascending: true });
    if (error) return reply(500, { error: "No se pudieron consultar los perfiles" });
    return reply(200, { profiles: (data ?? []).map((p) => ({
      id:p.id, display_name:p.display_name, avatar_url:p.avatar_url,
      created_at:p.created_at, pin_enabled:Boolean(p.pin_hash),
    })) });
  }

  if (action === "create-profile") {
    const displayName = String(body.display_name ?? "").trim().slice(0, 40);
    if (!displayName) return reply(400, { error: "El nombre debe tener entre 1 y 40 caracteres" });
    let pinFields: { pin_hash:string|null; pin_salt:string|null; pin_iterations:number|null } =
      { pin_hash:null, pin_salt:null, pin_iterations:null };
    if (body.pin !== undefined && body.pin !== null && body.pin !== "") {
      try { pinFields = await hashProfilePin(String(body.pin)); }
      catch (error) { return reply(400, { error:error instanceof Error?error.message:"PIN inválido" }); }
    }
    const { data, error } = await admin.from("family_profiles").insert({
      user_id:user.id, display_name:displayName, ...pinFields,
    }).select("id,display_name,avatar_url,created_at").single();
    if (error || !data) return reply(500, { error:"No se pudo crear el perfil" });
    return reply(201, { profile:{ ...data, pin_enabled:Boolean(pinFields.pin_hash) } });
  }

  if (action === "verify-profile-pin") {
    if (!validUuid(body.profile_id)) return reply(400, { error:"Perfil inválido" });
    const { data:p, error } = await admin.from("family_profiles")
      .select("id,pin_hash,pin_salt,pin_iterations,failed_attempts,locked_until")
      .eq("id", body.profile_id).eq("user_id", user.id).maybeSingle();
    if (error || !p) return reply(404, { error:"No se encontró el perfil" });
    if (p.locked_until && new Date(p.locked_until).getTime() > Date.now()) {
      return reply(429, { error:"Perfil bloqueado temporalmente. Intenta más tarde.", locked_until:p.locked_until });
    }
    if (!p.pin_hash) return reply(200, { ok:true, unlocked:true });
    const valid = await verifyProfilePin(String(body.pin ?? ""), p);
    if (!valid) {
      const attempts = Number(p.failed_attempts ?? 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now()+10*60*1000).toISOString() : null;
      await admin.from("family_profiles").update({
        failed_attempts:lockedUntil?0:attempts, locked_until:lockedUntil,
      }).eq("id", p.id).eq("user_id", user.id);
      return reply(401, { error:lockedUntil?"Demasiados intentos. Perfil bloqueado durante 10 minutos.":"PIN incorrecto." });
    }
    await admin.from("family_profiles").update({ failed_attempts:0, locked_until:null })
      .eq("id", p.id).eq("user_id", user.id);
    return reply(200, { ok:true, unlocked:true });
  }

  if (action === "set-profile-pin") {
    if (!validUuid(body.profile_id)) return reply(400, { error:"Perfil inválido" });
    let pinFields;
    try { pinFields = await hashProfilePin(String(body.pin ?? "")); }
    catch (error) { return reply(400, { error:error instanceof Error?error.message:"PIN inválido" }); }
    const { data, error } = await admin.from("family_profiles").update({
      ...pinFields, failed_attempts:0, locked_until:null,
    }).eq("id", body.profile_id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return reply(500, { error:"No se pudo actualizar el PIN" });
    return data ? reply(200, { ok:true }) : reply(404, { error:"No se encontró el perfil" });
  }

  if (action === "delete-profile") {
    if (!validUuid(body.profile_id)) return reply(400, { error:"Perfil inválido" });
    const { data, error } = await admin.from("family_profiles").delete()
      .eq("id", body.profile_id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return reply(500, { error:"No se pudo eliminar el perfil" });
    return data ? reply(200, { ok:true }) : reply(404, { error:"No se encontró el perfil" });
  }
  return reply(404, { error:"Acción no reconocida" });
});
