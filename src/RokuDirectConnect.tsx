import { useState } from "react";
import { registerPlugin } from "@capacitor/core";
import { Radio, Tv, LoaderCircle, CheckCircle2 } from "lucide-react";
import "./roku-direct-connect.css";

type RokuDevice={ip:string;name:string;channelId:string;sebasPlayInstalled:boolean};
type RokuBridge={
 discover:()=>Promise<{devices:RokuDevice[]}>;
 launch:(args:{ip:string;channelId:string;laptopUrl?:string;laptopToken?:string})=>Promise<{launched:boolean}>
};
const RokuDiscovery=registerPlugin<RokuBridge>("RokuDiscovery");

export default function RokuDirectConnect(){
 const [devices,setDevices]=useState<RokuDevice[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function scan(){
  setBusy(true);setError("");setMessage("Buscando televisores Roku en tu red Wi-Fi…");
  try{
   const result=await RokuDiscovery.discover();
   const list=result.devices||[];setDevices(list);
   const installed=list.filter(x=>x.sebasPlayInstalled);
   if(installed.length) setMessage("SEBAS PLAY está detectado. Selecciona tu Roku para conectarlo.");
   else if(list.length) setMessage("Se detectó tu Roku. Se comprobará el canal SEBAS PLAY al intentar abrirlo.");
   else setMessage("No se detectó ningún Roku. Comprueba que esté encendido y conectado a la misma Wi-Fi.");
  }catch(e){setError(e instanceof Error?e.message:"La búsqueda automática no está disponible en este dispositivo.");setMessage("")}
  finally{setBusy(false)}
 }
 async function connect(device:RokuDevice){
  setBusy(true);setError("");
  try{
   const laptopUrl=localStorage.getItem("sebas_laptop_url")||"";
   const laptopToken=localStorage.getItem("sebas_laptop_token")||"";
   const launchResult=await RokuDiscovery.launch({ip:device.ip,channelId:device.channelId||"dev",laptopUrl,laptopToken});
   if(!launchResult?.launched)throw new Error("Roku no confirmó la apertura de SEBAS PLAY. Comprueba que el canal esté instalado y vuelve a intentarlo.");
   setMessage(laptopUrl&&laptopToken
    ?"Roku confirmó la apertura de SEBAS PLAY en "+device.name+". Envié la conexión de tu laptop y la biblioteca se actualizará en Roku."
     :"Roku confirmó la apertura de SEBAS PLAY en "+device.name+". Conecta primero «Mi laptop» en Android para compartir tu biblioteca.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo abrir SEBAS PLAY en Roku.");}
  finally{setBusy(false)}
 }
 return <section className="roku-direct-panel">
  <button type="button" onClick={()=>void scan()} disabled={busy} className="roku-direct-trigger"><Radio size={17}/>{busy?<><LoaderCircle size={16}/> Buscando…</>:"Conectar directamente a Roku"}</button>
  {message&&<p>{message}</p>}{error&&<p role="alert" className="roku-direct-error">{error}</p>}
  {devices.map(d=><button key={d.ip} type="button" className="roku-direct-device" disabled={busy} onClick={()=>void connect(d)}><Tv size={19}/><span><b>{d.name}</b><small>{d.ip} · {d.sebasPlayInstalled?"SEBAS PLAY detectado":"Comprobar canal SEBAS PLAY"}</small></span><CheckCircle2 size={17}/></button>)}
 </section>
}
