import { useCallback, useEffect, useState } from "react";
import { Link2, RefreshCw, Smartphone, Tv, Unplug, Copy, Clock3 } from "lucide-react";
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

  const call=useCallback(async(body:Record<string,unknown>)=>{
    if(!supabase) throw new Error("Supabase no está conectado.");
    const {data,error}=await supabase.functions.invoke("roku-device-sync",{body});
    if(error) throw new Error(error.message||"No se pudo conectar con el servicio de dispositivos.");
    if(data?.error) throw new Error(String(data.error));
    return data;
  },[]);

  const refresh=useCallback(async()=>{
    setLoading(true);setError("");
    try { const data=await call({action:"devices"});setDevices((data.devices||[]) as PairedDevice[]); }
    catch(e){setError(e instanceof Error?e.message:"No se pudieron consultar los dispositivos.");}
    finally{setLoading(false);}
  },[call]);

  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{setCode(null);setNotice("");setError("");},[profileId]);

  async function generateCode(){
    setLoading(true);setError("");setNotice("");
    try {const data=await call({action:"pair-code",profile_id:profileId});setCode({code:data.code,expires_at:data.expires_at});setNotice("Código de un solo uso generado. Dura cinco minutos.");}
    catch(e){setError(e instanceof Error?e.message:"No se pudo generar el código.");}
    finally{setLoading(false);}
  }

  async function revoke(device:PairedDevice){
    if(!window.confirm("¿Desvincular "+device.device_name+"?")) return;
    setLoading(true);setError("");
    try {await call({action:"revoke-device",device_id:device.id});setNotice("Dispositivo desvinculado.");await refresh();}
    catch(e){setError(e instanceof Error?e.message:"No se pudo desvincular.");}
    finally{setLoading(false);}
  }

  const active=devices.filter(d=>!d.revoked_at);
  return <section className="device-sync-panel">
    <div className="device-sync-heading"><div><span className="device-sync-icon"><Link2 size={20}/></span><div><b>Sincronización Android · Roku</b><small>Vincula tu Roku a {profileId ? "este perfil familiar" : "la cuenta principal"} para compartir favoritos y progreso de reproducción.</small></div></div><button type="button" onClick={()=>void refresh()} disabled={loading} aria-label="Actualizar dispositivos"><RefreshCw size={16}/></button></div>
    <button className="device-sync-generate" type="button" onClick={()=>void generateCode()} disabled={loading}><Tv size={17}/>{loading?"Procesando…":"Generar código para vincular Roku"}</button>
    {code&&<div className="device-sync-code"><span>CÓDIGO DE VINCULACIÓN</span><strong>{code.code}</strong><small><Clock3 size={13}/> Vence {new Date(code.expires_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</small><button type="button" onClick={()=>{void navigator.clipboard?.writeText(code.code);setNotice("Código copiado.");}}><Copy size={14}/> Copiar código</button></div>}
    {notice&&<p className="device-sync-notice">{notice}</p>}{error&&<p className="device-sync-error">{error}</p>}
    <div className="device-sync-list"><b>Dispositivos vinculados ({active.length})</b>{active.length===0?<p>Aún no hay dispositivos vinculados.</p>:active.map(d=><article key={d.id}><Smartphone size={17}/><span><b>{d.device_name}</b><small>{d.last_seen_at?"Última conexión: "+new Date(d.last_seen_at).toLocaleString("es-MX"):"Aún no se conecta"}</small></span><button type="button" onClick={()=>void revoke(d)} disabled={loading} title="Desvincular"><Unplug size={16}/></button></article>)}</div>
  </section>;
}
