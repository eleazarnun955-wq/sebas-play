import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clapperboard, Film, Radio, Search, Play, Tv2, X, LoaderCircle, AlertCircle } from "lucide-react";
import { supabase } from "./lib/supabase";

type Movie = { id:string; title:string; synopsis:string|null; poster_url:string|null; release_year:number|null; duration_minutes:number|null; age_rating:string|null; genres:string[]; video_url:string|null };
type Series = { id:string; title:string; synopsis:string|null; poster_url:string|null; release_year:number|null; age_rating:string|null; genres:string[] };
type Channel = { id:string; name:string; logo_url:string|null; category:string|null; country_code:string|null; stream_url:string };
type Selected = { kind:"movie"; item:Movie } | { kind:"series"; item:Series } | { kind:"channel"; item:Channel };

export default function ViewerApp() {
 const [movies,setMovies]=useState<Movie[]>([]),[series,setSeries]=useState<Series[]>([]),[channels,setChannels]=useState<Channel[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[search,setSearch]=useState(""),[selected,setSelected]=useState<Selected|null>(null);
 useEffect(()=>{ let alive=true; async function load(){ if(!supabase){setError("SEBAS PLAY todavía no está conectado al catálogo.");setLoading(false);return;}
  const [m,s,c]=await Promise.all([
   supabase.from("movies").select("id,title,synopsis,poster_url,release_year,duration_minutes,age_rating,genres,video_url").eq("is_published",true).order("created_at",{ascending:false}),
   supabase.from("series").select("id,title,synopsis,poster_url,release_year,age_rating,genres").eq("is_published",true).order("created_at",{ascending:false}),
   supabase.from("live_channels").select("id,name,logo_url,category,country_code,stream_url").eq("is_published",true).order("created_at",{ascending:false})
  ]);
  if(!alive)return; const e=m.error||s.error||c.error;if(e)setError(e.message);setMovies((m.data||[]) as Movie[]);setSeries((s.data||[]) as Series[]);setChannels((c.data||[]) as Channel[]);setLoading(false);
 } void load();return()=>{alive=false};},[]);
 const q=search.trim().toLocaleLowerCase();
 const filteredMovies=useMemo(()=>movies.filter(x=>!q||[x.title,x.synopsis||"",...(x.genres||[])].join(" ").toLocaleLowerCase().includes(q)),[movies,q]);
 const filteredSeries=useMemo(()=>series.filter(x=>!q||[x.title,x.synopsis||"",...(x.genres||[])].join(" ").toLocaleLowerCase().includes(q)),[series,q]);
 const filteredChannels=useMemo(()=>channels.filter(x=>!q||[x.name,x.category||"",x.country_code||""].join(" ").toLocaleLowerCase().includes(q)),[channels,q]);
 return <div className="viewer-shell">
  <header className="viewer-top"><a className="viewer-brand" href="/"><span className="viewer-logo"><Play size={19} fill="currentColor"/></span><span>SEBAS <b>PLAY</b><small>ENTRETENIMIENTO</small></span></a><div className="viewer-search"><Search size={18}/><input aria-label="Buscar contenido" placeholder="Buscar películas, series o canales…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")} aria-label="Limpiar búsqueda"><X size={16}/></button>}</div><a className="viewer-admin" href="/">Panel</a></header>
  <main className="viewer-main">
   <section className="viewer-hero"><div><span className="viewer-kicker">TU ENTRETENIMIENTO, EN UN SOLO LUGAR</span><h1>Bienvenido a <em>SEBAS PLAY</em></h1><p>Explora películas, series y televisión en vivo disponibles en nuestro catálogo.</p><div className="viewer-counts"><span><Film size={15}/>{movies.length} películas</span><span><Clapperboard size={15}/>{series.length} series</span><span><Radio size={15}/>{channels.length} canales</span></div></div><div className="viewer-hero-art"><Tv2 size={88}/><i/><i/><i/></div></section>
   {error&&<div className="viewer-alert"><AlertCircle size={17}/>{error}</div>}
   {loading?<div className="viewer-loading"><LoaderCircle className="spin" size={25}/> Cargando catálogo…</div>:<>
    <CatalogSection title="Películas" icon={<Film size={19}/>} count={filteredMovies.length} empty="Todavía no hay películas publicadas." >
     <div className="viewer-grid">{filteredMovies.map(x=><button className="viewer-card" key={x.id} onClick={()=>setSelected({kind:"movie",item:x})}><Poster src={x.poster_url} title={x.title}/><span className="viewer-card-title">{x.title}</span><small>{x.release_year||"Película"}{x.age_rating? " · "+x.age_rating:""}</small></button>)}</div>
    </CatalogSection>
    <CatalogSection title="Series" icon={<Clapperboard size={19}/>} count={filteredSeries.length} empty="Todavía no hay series publicadas.">
     <div className="viewer-grid">{filteredSeries.map(x=><button className="viewer-card" key={x.id} onClick={()=>setSelected({kind:"series",item:x})}><Poster src={x.poster_url} title={x.title}/><span className="viewer-card-title">{x.title}</span><small>{x.release_year||"Serie"}{x.age_rating? " · "+x.age_rating:""}</small></button>)}</div>
    </CatalogSection>
    <CatalogSection title="Televisión en vivo" icon={<Radio size={19}/>} count={filteredChannels.length} empty="Todavía no hay canales autorizados publicados.">
     <div className="viewer-grid channel-grid">{filteredChannels.map(x=><button className="viewer-card channel-card" key={x.id} onClick={()=>setSelected({kind:"channel",item:x})}><Poster src={x.logo_url} title={x.name}/><span className="viewer-card-title">{x.name}</span><small>{x.category||x.country_code||"TV en vivo"}</small></button>)}</div>
    </CatalogSection>
   </>}
   <footer className="viewer-footer">SEBAS PLAY · Contenido disponible según publicación y derechos de reproducción.</footer>
  </main>
  {selected&&<div className="viewer-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="viewer-detail"><button className="viewer-close" onClick={()=>setSelected(null)} aria-label="Cerrar"><X/></button><div className="viewer-detail-poster"><Poster src={selected.item.poster_url||("logo_url" in selected.item?selected.item.logo_url:null)} title={"title" in selected.item?selected.item.title:selected.item.name}/></div><div className="viewer-detail-copy"><span className="viewer-kicker">{selected.kind==="movie"?"PELÍCULA":selected.kind==="series"?"SERIE":"TELEVISIÓN EN VIVO"}</span><h2>{"title" in selected.item?selected.item.title:selected.item.name}</h2><p>{selected.item.synopsis||("category" in selected.item?selected.item.category:"Consulta los episodios disponibles en el catálogo.")||"Información próximamente."}</p>{"release_year" in selected.item&&selected.item.release_year&&<small>{selected.item.release_year}</small>}
  {selected.kind==="movie"&&selected.item.video_url?<video className="viewer-video" controls playsInline preload="metadata" src={selected.item.video_url}>Tu navegador no puede reproducir este formato.</video>:selected.kind==="channel"?<a className="viewer-play" href={selected.item.stream_url} target="_blank" rel="noreferrer"><Play size={17} fill="currentColor"/> Abrir transmisión autorizada</a>:selected.kind==="movie"?<p className="viewer-unavailable">La ficha está publicada, pero todavía no tiene una transmisión de video configurada.</p>:<p className="viewer-unavailable">Los episodios se mostrarán aquí cuando estén publicados.</p>}</div></section></div>}
 </div>;
}
function Poster({src,title}:{src:string|null;title:string}){return <div className="viewer-poster">{src?<img src={src} alt={title} loading="lazy"/>:<div className="viewer-poster-fallback"><Film size={35}/><b>{title}</b></div>}</div>}
function CatalogSection({title,icon,count,empty,children}:{title:string;icon:React.ReactNode;count:number;empty:string;children:React.ReactNode}){return <section className="viewer-section"><div className="viewer-section-head"><h2>{icon}{title}</h2><span>{count}</span></div>{count?children:<div className="viewer-empty">{empty}</div>}</section>}
