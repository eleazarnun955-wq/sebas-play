import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, RefreshCw, Smartphone, Tv, Unplug, Copy, Clock3, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./device-sync-manager.css";

type PairedDevice = { id:string; device_name:string; created_at:string; last_seen_at:string|null; revoked_at:string|null };
type PairCode = { code:string; expires_at:string };

export default function DeviceSyncManager({ profileId = null }: { profileId?: string | null }) {
  const [code,setCode]=useState<PairCode|null>(null);
  const [devices,setDevices]=useState<PairedDevice[]>([]);
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const refreshSequence=useRef(0);
  const profileEpoch=useRef(0);
  const devicesRef=useRef<PairedDevice[]>([]);
  devicesRef.current=devices;

  // Keep the function request tied to a fresh authenticated session. Capacitor can
  // resume after Android has suspended the app, so the cached access token may expire.
  const call=useCallback(async(body:Record<string,unknown>)=>{
    if(!supabase) throw new Error("Supabase no está conectado.");
    let {data:sessionData,error:sessionError}=await supabase.auth.getSession();
    if(sessionError) throw new Error("No se pudo recuperar tu sesión: "+sessionError.message);
    let session=sessionData.session;
    if(!session) throw new Error("Tu sesión no está activa. Cierra sesión, vuelve a entrar y genera otro código.");
    if(!session.expires_at || session.expires_at*1000-Date.now()<60_000){
      const refreshed=await supabase.auth.refreshSession();
      if(refreshed.error) throw new Error("No se pudo renovar tu sesión: "+refreshed.error.message);
      session=refreshed.data.session;
    }
    if(!session?.access_token) throw new Error("La sesión venció. Vuelve a iniciar sesión en SEBAS PLAY.");
    const {data,error}=await supabase.functions.invoke("roku-device-sync",{
      body,
      headers:{Authorization:"Bearer "+session.access_token}
    });
    if(error){
      let detail=error.message||"No se pudo conectar con el servicio de dispositivos.";
      const context=(error as {context?:unknown}).context;
      if(context instanceof Response){
        try{const payload=await context.clone().json();if(typeof payload?.error==="string")detail=payload.error}catch{/* Conserva el mensaje original. */}
      }
      throw new Error(detail);
    }
    if(data?.error) throw new Error(String(data.error));
    return data;
  },[]);

  const refresh=useCallback(async(showLoading=true)=>{
    const requestId=++refreshSequence.current;
    if(showLoading)setLoading(true);
    setError("");
    try {
      const data=await call({action:"devices",profile_id:profileId});
      if(requestId===refreshSequence.current)setDevices((data.devices||[]) as PairedDevice[]);
    }
    catch(e){if(requestId===refreshSequence.current)setError(e instanceof Error?e.message:"No se pudieron consultar los dispositivos.");}
    finally{if(showLoading&&requestId===refreshSequence.current)setLoading(false);}
  },[call,profileId]);

  useEffect(()=>{
    profileEpoch.current++;
    refreshSequence.current++;
    setDevices([]);
    setCode(null);
    setNotice("");
    setError("");
    void refresh();
  },[profileId,refresh]);

  // Watch for the Roku to redeem the one-time code. This avoids making the user
  // guess whether the TV completed pairing; stop polling as soon as it appears.
  useEffect(()=>{
    if(!code)return;
    const epoch=profileEpoch.current;
    const baseline=new Set(devicesRef.current.map(device=>device.id));
    const poll=async()=>{
      try{
        const data=await call({action:"devices",profile_id:profileId});
        if(epoch!==profileEpoch.current)return;
        const latest=(data.devices||[]) as PairedDevice[];
        setDevices(latest);
        const paired=latest.find(device=>!device.revoked_at&&!baseline.has(device.id));
        if(paired){
          setNotice("¡"+paired.device_name+" quedó vinculado correctamente!");
          setError("");
          setCode(null);
        }
      }catch(e){
        if(epoch===profileEpoch.current)setError(e instanceof Error?e.message:"No se pudo comprobar la vinculación.");
      }
    };
    const interval=window.setInterval(()=>void poll(),2500);
    const remaining=Math.max(0,new Date(code.expires_at).getTime()-Date.now());
    const expiry=window.setTimeout(()=>{
      setCode(null);
      setNotice("El código venció. Genera uno nuevo para vincular Roku.");
    },remaining);
    return ()=>{window.clearInterval(interval);window.clearTimeout(expiry)};
  },[code,call,profileId]);

  async function copyCode(){
    if(!code)return;
    try{
      if(!navigator.clipboard?.writeText)throw new Error("El navegador no permite copiar automáticamente.");
      await navigator.clipboard.writeText(code.code);
      setNotice("Código copiado.");
      setError("");
    }catch(e){setError(e instanceof Error?e.message:"No se pudo copiar. Selecciona el código y cópialo manualmente.");}
  }

  async function generateCode(){
    const epoch=profileEpoch.current;
    setLoading(true);setError("");setNotice("");setCode(null);
    try {
      const data=await call({action:"pair-code",profile_id:profileId});
      if(epoch!==profileEpoch.current)return;
      const generated=String(data?.code??"").replace(/\\s+/g,"").toUpperCase();
      const expiry=Date.parse(String(data?.expires_at??""));
      if(!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(generated)||!Number.isFinite(expiry)||expiry<=Date.now()){
        throw new Error("El servidor devolvió un código de vinculación incompleto. Inténtalo de nuevo.");
      }
      setCode({code:generated,expires_at:new Date(expiry).toISOString()});
      setNotice("Código listo. Escríbelo en Roku; Android confirmará automáticamente cuando se vincule.");
    }
    catch(e){if(epoch===profileEpoch.current)setError(e instanceof Error?e.message:"No se pudo generar el código.");}
    finally{if(epoch===profileEpoch.current)setLoading(false);}
  }

  async function revoke(device:PairedDevice){
    if(!window.confirm("¿Desvincular "+device.device_name+"?")) return;
    const epoch=profileEpoch.current;
    setLoading(true);setError("");
    try {
      await call({action:"revoke-device",device_id:device.id,profile_id:profileId});
      if(epoch!==profileEpoch.current)return;
      setNotice("Dispositivo desvinculado.");
      await refresh(false);
    }
    catch(e){if(epoch===profileEpoch.current)setError(e instanceof Error?e.message:"No se pudo desvincular.");}
    finally{if(epoch===profileEpoch.current)setLoading(false);}
  }

  const active=devices.filter(d=>!d.revoked_at);
  return <section className="device-sync-panel">
    <div className="device-sync-heading"><div><span className="device-sync-icon"><Link2 size={20}/></span><div><b>Sincronización Android · Roku</b><small>Vincula tu Roku a {profileId ? "este perfil familiar" : "la cuenta principal"} para compartir favoritos y progreso de reproducción.</small></div></div><button type="button" onClick={()=>void refresh()} disabled={loading} aria-label="Actualizar dispositivos"><RefreshCw size={16}/></button></div>
    <button className="device-sync-generate" type="button" onClick={()=>void generateCode()} disabled={loading}><Tv size={17}/>{loading?"Procesando…":"Generar código para vincular Roku"}</button>
    {code&&<div className="device-sync-code"><span>CÓDIGO DE VINCULACIÓN</span><strong>{code.code}</strong><small><Clock3 size={13}/> Vence {new Date(code.expires_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</small><button type="button" onClick={()=>void copyCode()}><Copy size={14}/> Copiar código</button><small>Esperando confirmación de Roku…</small></div>}
    {notice&&<p className="device-sync-notice"><CheckCircle2 size={14}/> {notice}</p>}{error&&<p className="device-sync-error" role="alert">{error}</p>}
    <div className="device-sync-list"><b>Dispositivos vinculados ({active.length})</b>{active.length===0?<p>Aún no hay dispositivos vinculados.</p>:active.map(d=><article key={d.id}><Smartphone size={17}/><span><b>{d.device_name}</b><small>{d.last_seen_at?"Última conexión: "+new Date(d.last_seen_at).toLocaleString("es-MX"):"Aún no se conecta"}</small></span><button type="button" onClick={()=>void revoke(d)} disabled={loading} title="Desvincular"><Unplug size={16}/></button></article>)}</div>
  </section>;
}
