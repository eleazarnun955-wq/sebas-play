import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase server environment");
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const cors = { "access-control-allow-origin":"*", "access-control-allow-headers":"authorization, apikey, content-type", "access-control-allow-methods":"GET, POST, OPTIONS", "content-type":"application/json; charset=utf-8", "cache-control":"no-store" };
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:cors});
const hex=(bytes:Uint8Array)=>[...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");
async function digest(value:string){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))}
function randomToken(bytes=32){const data=crypto.getRandomValues(new Uint8Array(bytes));let binary="";for(const b of data)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function pairingCode(){const alphabet="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";const bytes=crypto.getRandomValues(new Uint8Array(12));return [...bytes].map(b=>alphabet[b%alphabet.length]).join("")}
async function userFromRequest(req:Request){const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");if(!token)return null;const {data,error}=await admin.auth.getUser(token);return error?null:data.user}
async function deviceFromRequest(req:Request){const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");if(!token||token.length<32)return null;const tokenHash=await digest(token);const {data,error}=await admin.from("paired_devices").select("id,user_id,device_name,profile_id").eq("token_hash",tokenHash).is("revoked_at",null).maybeSingle();if(error||!data)return null;await admin.from("paired_devices").update({last_seen_at:new Date().toISOString()}).eq("id",data.id);return data}
function validUuid(value:unknown):value is string{return typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)}
async function scopedQuery(table:"family_profile_favorites"|"family_profile_watch_progress"|"favorites"|"watch_progress",device:{user_id:string;profile_id:string|null}){let q=admin.from(table).select("*").eq("user_id",device.user_id);return device.profile_id?q.eq("profile_id",device.profile_id):q}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="GET"&&req.method!=="POST")return reply(405,{error:"Método no permitido"});
 const url=new URL(req.url);const action=url.searchParams.get("action")??(req.method==="GET"?"sync":"");let body:Record<string,unknown>={};
 if(req.method==="POST"){try{body=await req.json()}catch{return reply(400,{error:"JSON inválido"})}}
 const requestedAction=typeof body.action==="string"?body.action:action;
 if(requestedAction==="pair-device"){
  const code=String(body.code??"").replace(/\s+/g,"").toUpperCase();const deviceName=String(body.device_name??"Roku").trim().slice(0,80);
  if(!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(code)||!deviceName)return reply(400,{error:"Código o nombre de dispositivo inválido"});
  const {data:pending,error}=await admin.from("device_pairing_sessions").select("id,user_id,profile_id").eq("code_hash",await digest(code)).is("redeemed_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(error||!pending)return reply(400,{error:"Código vencido, incorrecto o ya utilizado"});
  const {data:redeemed,error:redeemError}=await admin.from("device_pairing_sessions").update({redeemed_at:new Date().toISOString()}).eq("id",pending.id).is("redeemed_at",null).select("id").maybeSingle();
  if(redeemError||!redeemed)return reply(409,{error:"El código ya fue utilizado"});
  const deviceToken=randomToken();const {data:device,error:insertError}=await admin.from("paired_devices").insert({user_id:pending.user_id,profile_id:pending.profile_id,device_name:deviceName,token_hash:await digest(deviceToken)}).select("id,device_name,created_at").single();
  if(insertError||!device)return reply(500,{error:"No se pudo vincular el dispositivo"});
  return reply(200,{ok:true,device,device_token:deviceToken});
 }
 if(requestedAction==="pair-code"){
  const user=await userFromRequest(req);if(!user)return reply(401,{error:"Inicia sesión en SEBAS PLAY para generar el código"});
  const profileId=body.profile_id===null||body.profile_id===undefined||body.profile_id===""?null:body.profile_id;
  if(profileId!==null){if(!validUuid(profileId))return reply(400,{error:"Perfil inválido"});const {data,error}=await admin.from("family_profiles").select("id").eq("id",profileId).eq("user_id",user.id).maybeSingle();if(error||!data)return reply(403,{error:"El perfil no pertenece a esta cuenta"})}
  const code=pairingCode();const expiresAt=new Date(Date.now()+5*60*1000).toISOString();
  await admin.from("device_pairing_sessions").delete().eq("user_id",user.id).is("redeemed_at",null);
  const {error}=await admin.from("device_pairing_sessions").insert({user_id:user.id,profile_id:profileId,code_hash:await digest(code),expires_at:expiresAt});
  if(error)return reply(500,{error:"No se pudo generar el código de vinculación"});
  return reply(200,{ok:true,code,expires_at:expiresAt});
 }
 if(requestedAction==="devices"){
  const user=await userFromRequest(req);if(!user)return reply(401,{error:"Sesión no válida"});
  const profileId=body.profile_id===null||body.profile_id===undefined||body.profile_id===""?null:body.profile_id;
  if(profileId!==null){if(!validUuid(profileId))return reply(400,{error:"Perfil inválido"});const {data,error}=await admin.from("family_profiles").select("id").eq("id",profileId).eq("user_id",user.id).maybeSingle();if(error||!data)return reply(403,{error:"El perfil no pertenece a esta cuenta"})}
  let query=admin.from("paired_devices").select("id,device_name,profile_id,created_at,last_seen_at,revoked_at").eq("user_id",user.id);
  query=profileId?query.eq("profile_id",profileId):query.is("profile_id",null);
  const {data,error}=await query.order("created_at",{ascending:false});
  return error?reply(500,{error:"No se pudieron consultar los dispositivos"}):reply(200,{devices:data??[]});
 }
 if(requestedAction==="revoke-device"){
  const user=await userFromRequest(req);if(!user)return reply(401,{error:"Sesión no válida"});if(!validUuid(body.device_id))return reply(400,{error:"Dispositivo inválido"});
  const profileId=body.profile_id===null||body.profile_id===undefined||body.profile_id===""?null:body.profile_id;
  if(profileId!==null){if(!validUuid(profileId))return reply(400,{error:"Perfil inválido"});const {data,error}=await admin.from("family_profiles").select("id").eq("id",profileId).eq("user_id",user.id).maybeSingle();if(error||!data)return reply(403,{error:"El perfil no pertenece a esta cuenta"})}
  let query=admin.from("paired_devices").update({revoked_at:new Date().toISOString()}).eq("id",body.device_id).eq("user_id",user.id).is("revoked_at",null);
  query=profileId?query.eq("profile_id",profileId):query.is("profile_id",null);
  const {data,error}=await query.select("id").maybeSingle();
  if(error)return reply(500,{error:"No se pudo revocar el dispositivo"});return reply(200,{ok:true,revoked:Boolean(data)});
 }
 if(requestedAction==="progress-user"){
  const user=await userFromRequest(req);if(!user)return reply(401,{error:"Sesión no válida"});
  const profileId=body.profile_id===null||body.profile_id===undefined?null:body.profile_id;
  if(profileId!==null){if(!validUuid(profileId))return reply(400,{error:"Perfil inválido"});const {data,error}=await admin.from("family_profiles").select("id").eq("id",profileId).eq("user_id",user.id).maybeSingle();if(error||!data)return reply(403,{error:"El perfil no pertenece a esta cuenta"})}
  if(!["movie","episode"].includes(String(body.content_type))||!validUuid(body.content_id)||!Number.isSafeInteger(body.position_seconds)||Number(body.position_seconds)<0||(body.duration_seconds!==null&&body.duration_seconds!==undefined&&(!Number.isSafeInteger(body.duration_seconds)||Number(body.duration_seconds)<=0)))return reply(400,{error:"Progreso de reproducción inválido"});
  const progressTable=profileId?"family_profile_watch_progress":"watch_progress";let query=admin.from(progressTable).select("id").eq("user_id",user.id).eq("content_type",body.content_type).eq("content_id",body.content_id);if(profileId)query=query.eq("profile_id",profileId);
  const {data:found,error:lookupError}=await query.maybeSingle();if(lookupError)return reply(500,{error:"No se pudo consultar el progreso"});
  const row={user_id:user.id,...(profileId?{profile_id:profileId}:{}),content_type:body.content_type,content_id:body.content_id,position_seconds:body.position_seconds,duration_seconds:body.duration_seconds??null,updated_at:new Date().toISOString()};
  const result=found?await admin.from(progressTable).update(row).eq("id",found.id):await admin.from(progressTable).insert(row);
  if(result.error)return reply(500,{error:"No se pudo guardar el progreso"});return reply(200,{ok:true});
 }
 const device=await deviceFromRequest(req);if(!device)return reply(401,{error:"Dispositivo no vinculado o revocado"});
 if(requestedAction==="sync"&&req.method==="GET"){
  const favoritesTable=device.profile_id?"family_profile_favorites":"favorites";const progressTable=device.profile_id?"family_profile_watch_progress":"watch_progress";const [favorites,progress]=await Promise.all([scopedQuery(favoritesTable,device),scopedQuery(progressTable,device)]);
  if(favorites.error||progress.error)return reply(500,{error:"No se pudo sincronizar la biblioteca"});
  return reply(200,{profile_id:device.profile_id,favorites:(favorites.data??[]).map(({id,user_id,profile_id,...x})=>x),watch_progress:(progress.data??[]).map(({id,user_id,profile_id,...x})=>x)});
 }
 if(requestedAction==="favorite"){
  const type=String(body.content_type??"");if(!["movie","series","channel"].includes(type)||!validUuid(body.content_id)||!["add","remove"].includes(String(body.operation)))return reply(400,{error:"Favorito inválido"});
  const favoritesTable=device.profile_id?"family_profile_favorites":"favorites";const foundRows=await scopedQuery(favoritesTable,device);if(foundRows.error)return reply(500,{error:"No se pudo consultar favoritos"});
  if(body.operation==="remove"){let q=admin.from(favoritesTable).delete().eq("user_id",device.user_id).eq("content_type",type).eq("content_id",body.content_id);if(device.profile_id)q=q.eq("profile_id",device.profile_id);const {error}=await q;if(error)return reply(500,{error:"No se pudo quitar el favorito"})}
  else if(!(foundRows.data??[]).some(x=>x.content_type===type&&x.content_id===body.content_id)){const {error}=await admin.from(favoritesTable).insert({user_id:device.user_id,...(device.profile_id?{profile_id:device.profile_id}:{}),content_type:type,content_id:body.content_id});if(error)return reply(500,{error:"No se pudo guardar el favorito"})}
  return reply(200,{ok:true});
 }
 if(requestedAction==="progress"){
  if(!["movie","episode"].includes(String(body.content_type))||!validUuid(body.content_id)||!Number.isSafeInteger(body.position_seconds)||Number(body.position_seconds)<0||(body.duration_seconds!==null&&body.duration_seconds!==undefined&&(!Number.isSafeInteger(body.duration_seconds)||Number(body.duration_seconds)<=0)))return reply(400,{error:"Progreso de reproducción inválido"});
  const progressTable=device.profile_id?"family_profile_watch_progress":"watch_progress";const {data:rows,error:lookupError}=await scopedQuery(progressTable,device);if(lookupError)return reply(500,{error:"No se pudo consultar el progreso"});
  const found=(rows??[]).find(x=>x.content_type===body.content_type&&x.content_id===body.content_id);
  const row={user_id:device.user_id,...(device.profile_id?{profile_id:device.profile_id}:{}),content_type:body.content_type,content_id:body.content_id,position_seconds:body.position_seconds,duration_seconds:body.duration_seconds??null,updated_at:new Date().toISOString()};
  const result=found?await admin.from(progressTable).update(row).eq("id",found.id):await admin.from(progressTable).insert(row);
  if(result.error)return reply(500,{error:"No se pudo guardar el progreso"});return reply(200,{ok:true});
 }
 return reply(404,{error:"Acción no reconocida"});
});