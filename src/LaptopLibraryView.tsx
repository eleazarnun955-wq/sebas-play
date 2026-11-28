import { useCallback, useEffect, useMemo, useState } from "react";
import { HardDrive, LoaderCircle, Play, RefreshCw, WifiOff } from "lucide-react";
import { isNativeVlcAvailable, openNativeVlc } from "./lib/vlc-player";

type LaptopItem = { id:string; title:string; file:string; size_bytes:number; mime_type:string; category?:string; stream_url:string };
export default function LaptopLibraryView(){
 const [items,setItems]=useState<LaptopItem[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [connected,setConnected]=useState(false);
 const [playing,setPlaying]=useState<LaptopItem|null>(null);
 const load=useCallback(async()=>{
  const base=(localStorage.getItem("sebas_laptop_url")||"").replace(/\/+$/,"");
  const token=localStorage.getItem("sebas_laptop_token")||"";
  if(!base||!token){setConnected(false);setItems([]);setError("Conecta Mi laptop para mostrar aquí tus películas y videos.");return}
  setBusy(true);setError("");
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const health=await fetch(base+"/health",{cache:"no-store",signal:controller.signal});
   if(!health.ok)throw new Error("La laptop no está disponible. Revisa que el servidor esté encendido.");
   const status=await health.json();if(!status.ok)throw new Error("La dirección no corresponde al servidor SEBAS PLAY.");
   const response=await fetch(base+"/api/catalog",{headers:{Accept:"application/json",Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal});
   if(response.status===401)throw new Error("El token guardado ya no es válido. Abre Mi laptop y vuelve a conectar.");
   if(!response.ok)throw new Error("No se pudo leer la biblioteca (HTTP "+response.status+").");
   const data=await response.json();setItems((data.items||[]) as LaptopItem[]);setConnected(true);
  }catch(e){setConnected(false);setError(e instanceof Error?e.message:"No se pudo conectar con la laptop.");}
  finally{window.clearTimeout(timeout);setBusy(false)}
 },[]);
 useEffect(()=>{void load();const refresh=()=>void load();window.addEventListener("sebas-laptop-updated",refresh);return()=>window.removeEventListener("sebas-laptop-updated",refresh)},[load]);
 const groups=useMemo(()=>items.reduce<Record<string,LaptopItem[]>>((all,item)=>{const key=item.category||"Sin categoría";(all[key]??=[]).push(item);return all},{}),[items]);
 const bytes=(n:number)=>{const units=["B","KB","MB","GB"];let v=n,i=0;while(v>=1024&&i<units.length-1){v/=1024;i++}return v.toFixed(i?1:0)+" "+units[i]};
 return <section style={{maxWidth:1440,margin:"22px auto 60px",padding:"0 22px",color:"#f5f7fb"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:18}}>
   <div><small style={{color:"#65d8d1",letterSpacing:1,fontWeight:800}}>TU BIBLIOTECA PERSONAL</small><h2 style={{margin:"5px 0",fontSize:26}}>Contenido de mi laptop</h2><p style={{margin:0,color:"#a9b7ca"}}>{connected?items.length+" archivos encontrados en tus carpetas":"Solo se muestra contenido guardado en tu laptop."}</p></div>
   <button type="button" onClick={()=>void load()} disabled={busy} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 16px",borderRadius:10,border:"1px solid #65d8d1",background:"#142b37",color:"#eaffff",fontWeight:800}}>{busy?<LoaderCircle size={17}/>:<RefreshCw size={17}/>} Actualizar biblioteca</button>
  </div>
  {error&&<div style={{padding:18,borderRadius:14,background:"#17243a",border:"1px solid #34445c",color:"#dbe6f4",display:"flex",alignItems:"center",gap:10}}><WifiOff size={18}/>{error}</div>}
  {connected&&items.length===0&&<div style={{padding:24,borderRadius:14,background:"#17243a",color:"#a9b7ca"}}>No se encontraron archivos de video compatibles en las carpetas de la laptop.</div>}
  {Object.entries(groups).map(([category,list])=><section key={category} style={{marginTop:24}}>
   <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:12}}><h3 style={{margin:0,fontSize:20}}>{category}</h3><small style={{color:"#9eacc0"}}>{list.length} videos</small></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:13}}>
    {list.map(item=><article key={item.id} style={{background:"#17243a",border:"1px solid #2b3d58",borderRadius:14,padding:13}}>
     <div style={{height:108,borderRadius:10,background:"linear-gradient(135deg,#263b58,#101a2b)",display:"grid",placeItems:"center",color:"#65d8d1"}}><HardDrive size={31}/></div>
     <b style={{display:"block",marginTop:10,overflowWrap:"anywhere"}}>{item.title}</b>
     <small style={{display:"block",color:"#9eacc0",margin:"5px 0 11px"}}>{bytes(item.size_bytes)} · {item.mime_type}</small>
     <button type="button" onClick={()=>setPlaying(item)} style={{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:7,padding:10,border:0,borderRadius:9,background:"#20a4a0",color:"white",fontWeight:800}}><Play size={15} fill="currentColor"/> Reproducir</button>
    </article>)}
   </div>
  </section>)}
  {playing&&<div style={{position:"fixed",inset:0,zIndex:12000,background:"#050912ee",display:"grid",placeItems:"center",padding:20}}><div style={{width:"min(900px,100%)",background:"#17243a",borderRadius:16,padding:18}}><div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:12}}><b>{playing.title}</b><button onClick={()=>setPlaying(null)} style={{border:0,borderRadius:8,padding:"8px 12px"}}>Cerrar</button></div>{isNativeVlcAvailable()?<button onClick={()=>void openNativeVlc(playing.stream_url,playing.title)} style={{padding:12,border:0,borderRadius:9,background:"#20a4a0",color:"#fff",fontWeight:800}}>Reproducir con VLC</button>:<video src={playing.stream_url} controls autoPlay playsInline style={{width:"100%",maxHeight:"70vh",background:"#000"}}/>}</div></div>}
 </section>
}
