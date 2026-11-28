import { useState } from "react";
import { registerPlugin } from "@capacitor/core";
import { Radio, Tv, LoaderCircle, CheckCircle2 } from "lucide-react";
import "./roku-direct-connect.css";

type RokuDevice={ip:string;name:string;channelId:string;sebasPlayInstalled:boolean};
type RokuBridge={discover:()=>Promise<{devices:RokuDevice[]}>;launch:(args:{ip:string;channelId:string})=>Promise<{launched:boolean}>};
const RokuDiscovery=registerPlugin<RokuBridge>("RokuDiscovery");

export default function RokuDirectConnect(){
 const [devices,setDevices]=useState<RokuDevice[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function scan(){
  setBusy(true);setError("");setMessage("Buscando SEBAS PLAY en tu red Wi-Fi…");
  try{
   const result=await RokuDiscovery.discover();
   const list=result.devices||[];setDevices(list);
   const installed=list.filter(x=>x.sebasPlayInstalled);
   setMessage(installed.length? "Selecciona tu Roku para abrir SEBAS PLAY.":"No se encontró SEBAS PLAY instalado. Comprueba que Roku esté encendido y en la misma Wi-Fi.");
  }catch(e){setError(e instanceof Error?e.message:"La búsqueda automática no está disponible en este dispositivo.");setMessage("")}
  finally{setBusy(false)}
 }
 async function connect(device:RokuDevice){
  if(!device.sebasPlayInstalled||!device.channelId)return;
  setBusy(true);setError("");
  try{await RokuDiscovery.launch({ip:device.ip,channelId:device.channelId});setMessage("SEBAS PLAY se está abriendo en "+device.name+".")}
  catch(e){setError(e instanceof Error?e.message:"No se pudo abrir SEBAS PLAY en Roku.")}
  finally{setBusy(false)}
 }
 return <section className="roku-direct-panel">
  <button type="button" onClick={()=>void scan()} disabled={busy} className="roku-direct-trigger"><Radio size={17}/>{busy?<><LoaderCircle size={16}/> Buscando…</>:"Conectar directamente a Roku"}</button>
  {message&&<p>{message}</p>}{error&&<p role="alert" className="roku-direct-error">{error}</p>}
  {devices.filter(d=>d.sebasPlayInstalled).map(d=><button key={d.ip} type="button" className="roku-direct-device" disabled={busy} onClick={()=>void connect(d)}><Tv size={19}/><span><b>{d.name}</b><small>{d.ip} · SEBAS PLAY instalado</small></span><CheckCircle2 size={17}/></button>)}
  {devices.length>0&&devices.every(d=>!d.sebasPlayInstalled)&&<small>Se detectaron {devices.length} Roku, pero ninguno reportó SEBAS PLAY instalado.</small>}
 </section>
}
