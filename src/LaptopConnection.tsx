import { useEffect, useState } from "react";
import { HardDrive, Link2, RefreshCw, Play, X, Wifi, WifiOff } from "lucide-react";
import { isNativeVlcAvailable, openNativeVlc } from "./lib/vlc-player";

type LaptopItem = { id:string; title:string; file:string; size_bytes:number; mime_type:string; stream_url:string };

const card:React.CSSProperties={background:"#17243a",border:"1px solid #2b3d58",borderRadius:16,padding:16,color:"#f4f7fb"};
const field:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #42536d",background:"#0d1728",color:"#fff",fontSize:15,marginTop:7};
const action:React.CSSProperties={border:0,borderRadius:10,padding:"12px 15px",background:"#20a4a0",color:"#fff",fontWeight:700,fontSize:14,display:"inline-flex",alignItems:"center",gap:8};

export default function LaptopConnection({onClose}:{onClose:()=>void}){
 const [url,setUrl]=useState(()=>localStorage.getItem("sebas_laptop_url")||"");
 const [token,setToken]=useState(()=>localStorage.getItem("sebas_laptop_token")||"");
 const [items,setItems]=useState<LaptopItem[]>([]);
 const [busy,setBusy]=useState(false);
 const [connected,setConnected]=useState(false);
 const [error,setError]=useState("");
 const [playing,setPlaying]=useState<LaptopItem|null>(null);

 async function connect(){
  let base=url.trim().replace(/\/+$/,"");
  if(!/^https?:\/\//i.test(base)||!token.trim()){setError("Escribe una dirección http:// o https:// y el token privado de tu laptop.");return}
  base=base.replace(/\/(api\/catalog|health)$/i,"");
  setBusy(true);setError("");
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),15000);
  try{
   const health=await fetch(base+"/health",{method:"GET",headers:{Accept:"application/json"},cache:"no-store",mode:"cors",credentials:"omit",signal:controller.signal});
   if(!health.ok)throw new Error("La dirección respondió con HTTP "+health.status+". Comprueba que sea la dirección base del servidor SEBAS PLAY.");
   const healthData=await health.json();
   if(!healthData.ok)throw new Error("El servidor respondió, pero no se identificó como SEBAS PLAY.");
   const response=await fetch(base+"/api/catalog",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+token.trim()},cache:"no-store",mode:"cors",credentials:"omit",signal:controller.signal});
   const raw=await response.text();
   let data:any={};try{data=raw?JSON.parse(raw):{}}catch{throw new Error("El servidor no devolvió una respuesta JSON válida.")}
   if(response.status===401)throw new Error("TOKEN INCORRECTO: usa el contenido exacto de SEBAS-PLAY-ACCESS-TOKEN.txt de esa laptop.");
   if(response.status===404)throw new Error("RUTA NO ENCONTRADA: escribe la dirección base del servidor, sin /health ni /api/catalog.");
   if(!response.ok)throw new Error(data.error||("Error HTTP "+response.status));
   const list=(data.items||[]) as LaptopItem[];
   setItems(list);setConnected(true);
   localStorage.setItem("sebas_laptop_url",base);
   localStorage.setItem("sebas_laptop_token",token.trim());
   setUrl(base);setError("");
  }catch(e){
   setConnected(false);
   if(e instanceof Error&&e.name==="AbortError")setError("La laptop no respondió en 15 segundos. Revisa el túnel HTTPS o la conexión Wi-Fi.");
   else if(e instanceof TypeError)setError("Android no pudo abrir la dirección. Usa la IP local y el mismo Wi-Fi, o una URL HTTPS de Cloudflare. Esta APK habilitará HTTP local.");
   else setError(e instanceof Error?e.message:"No se pudo conectar con la laptop.");
  }finally{window.clearTimeout(timeout);setBusy(false)}
 }
 function disconnect(){setConnected(false);setItems([]);setPlaying(null);setToken("");localStorage.removeItem("sebas_laptop_token");setError("")}
 function bytes(n:number){if(!Number.isFinite(n))return "";const u=["B","KB","MB","GB"];let v=n,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return v.toFixed(i?1:0)+" "+u[i]}
 useEffect(()=>{const savedUrl=localStorage.getItem("sebas_laptop_url");const savedToken=localStorage.getItem("sebas_laptop_token");if(savedUrl&&savedToken)void (async()=>{const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);try{const health=await fetch(savedUrl+"/health",{headers:{Accept:"application/json"},cache:"no-store",signal:controller.signal});if(!health.ok)return;const status=await health.json();if(!status.ok)return;const r=await fetch(savedUrl+"/api/catalog",{headers:{Accept:"application/json",Authorization:"Bearer "+savedToken},cache:"no-store",signal:controller.signal});if(!r.ok)return;const d=await r.json();setUrl(savedUrl);setToken(savedToken);setItems((d.items||[]) as LaptopItem[]);setConnected(true)}catch{/* El servidor puede estar apagado o fuera de línea; se puede reconectar manualmente. */}finally{window.clearTimeout(timeout)}})()},[]);
 return <section style={{position:"fixed",inset:0,zIndex:10000,background:"#080e19f5",color:"#f4f7fb",overflowY:"auto",padding:"max(18px,env(safe-area-inset-top)) 16px 28px"}}>
  <div style={{maxWidth:760,margin:"0 auto"}}>
   <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:18}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{...card,padding:12,color:"#65d8d1"}}><HardDrive size={24}/></span><div><small style={{color:"#65d8d1",letterSpacing:1}}>BIBLIOTECA PERSONAL</small><h2 style={{margin:"3px 0",fontSize:22}}>Conectar laptop</h2></div></div>
    <button onClick={onClose} aria-label="Cerrar" style={{...action,background:"#26354b",padding:10}}><X size={20}/></button>
   </header>
   <div style={card}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,color:connected?"#6ee7a8":"#a9b7ca"}}>{connected?<Wifi size={18}/>:<WifiOff size={18}/>}<b>{connected?"Laptop conectada":"Conecta tu servidor SEBAS PLAY"}</b></div>
    <label style={{display:"block",fontSize:13,color:"#c1cddd"}}>Dirección de la laptop (Wi-Fi o enlace HTTPS remoto)
     <input style={field} value={url} onChange={e=>setUrl(e.target.value)} placeholder="http://192.168.1.15:8787 o https://....trycloudflare.com" autoCapitalize="none" autoCorrect="off"/>
    </label>
    <label style={{display:"block",fontSize:13,color:"#c1cddd",marginTop:13}}>Token privado de la laptop
     <input style={field} type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="Pégalo desde SEBAS-PLAY-ACCESS-TOKEN.txt" autoComplete="off"/>
    </label>
    <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:16}}>
     <button style={action} onClick={()=>void connect()} disabled={busy}>{busy?<RefreshCw size={16}/>:<Link2 size={16}/>} {busy?"Conectando…":connected?"Actualizar biblioteca":"Conectar con laptop"}</button>
     {connected&&<button style={{...action,background:"#34445c"}} onClick={disconnect}>Desconectar</button>}
    </div>
    <p style={{color:"#9eacc0",fontSize:12,lineHeight:1.5,marginBottom:0}}>En casa usa la dirección local que muestra la laptop. Fuera de casa usa la dirección HTTPS que genera el acceso remoto. El token se guarda solamente en este dispositivo; no lo envíes por chat.</p>
   </div>
   {error&&<div style={{...card,marginTop:12,borderColor:"#9b4545",color:"#ffb4b4"}}>{error}</div>}
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"22px 2px 12px"}}><h3 style={{margin:0}}>Mis películas y videos</h3><span style={{color:"#9eacc0",fontSize:13}}>{items.length} archivos</span></div>
   {!connected?<div style={{...card,textAlign:"center",color:"#a9b7ca"}}>Conecta la laptop para ver aquí tu biblioteca.</div>:items.length===0?<div style={{...card,textAlign:"center",color:"#a9b7ca"}}>No se encontraron videos compatibles. Revisa la carpeta seleccionada en la laptop.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>{items.map(item=><article key={item.id} style={card}><div style={{height:105,borderRadius:10,background:"linear-gradient(135deg,#263b58,#101a2b)",display:"grid",placeItems:"center",color:"#65d8d1"}}><Play size={34}/></div><b style={{display:"block",marginTop:11,overflowWrap:"anywhere"}}>{item.title}</b><small style={{display:"block",color:"#9eacc0",margin:"5px 0 12px"}}>{bytes(item.size_bytes)} · {item.mime_type}</small><button style={{...action,width:"100%",justifyContent:"center"}} onClick={()=>setPlaying(item)}><Play size={16} fill="currentColor"/> Reproducir</button></article>)}</div>}
   {playing&&<div style={{...card,marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:10}}><b>{playing.title}</b><button onClick={()=>setPlaying(null)} style={{...action,background:"#34445c",padding:8}}><X size={17}/></button></div>{isNativeVlcAvailable()?<button style={{...action,width:"100%",justifyContent:"center"}} onClick={()=>void openNativeVlc(playing.stream_url,playing.title).catch(e=>setError(e instanceof Error?e.message:"No se pudo abrir VLC."))}><Play size={16} fill="currentColor"/> Abrir reproductor VLC</button>:<video key={playing.stream_url} src={playing.stream_url} controls autoPlay playsInline style={{width:"100%",maxHeight:"65vh",background:"#000",borderRadius:10}} onError={()=>setError("Este formato no es compatible con el navegador de este dispositivo.")}>Tu dispositivo no puede reproducir este video.</video>}</div>}
  </div>
 </section>
}
