import { ExternalLink, Film, Clapperboard, Radio, Tv2 } from "lucide-react";

type Platform = { name: string; detail: string; url: string; kind: "Películas" | "Series" | "TV en vivo" | "Películas y series"; note: string };

const platforms: Platform[] = [
  { name: "Tubi", detail: "Películas y series gratis con anuncios.", url: "https://tubitv.com/es-mx/welcome", kind: "Películas y series", note: "Catálogo oficial disponible en México; la reproducción ocurre en Tubi." },
  { name: "Canela.TV", detail: "Cine, series y telenovelas en español.", url: "https://www.canela.tv/", kind: "Películas y series", note: "Servicio gratuito con anuncios; disponibilidad según región." },
  { name: "Pluto TV", detail: "Canales temáticos en vivo y contenido bajo demanda.", url: "https://plutotv.com.mx/welcome", kind: "TV en vivo", note: "Señales y catálogo se ven en la plataforma oficial." },
  { name: "MXPlus", detail: "Canales y producciones de los medios públicos de México.", url: "https://mxplus.tv/", kind: "TV en vivo", note: "Servicio público gratuito del SPR; incluye programación en vivo y bajo demanda." },
  { name: "Nuestro Cine MX", detail: "Cine mexicano, cortometrajes, series y muestras.", url: "https://www.nuestrocine.mx/", kind: "Películas y series", note: "Tiene catálogo gratuito y también títulos de renta o suscripción; revisa la modalidad de cada obra." },
];

export default function FreePlatforms() {
  return <section className="viewer-section">
    <div className="viewer-section-head"><h2><Tv2 size={19}/>Contenido gratuito y legal</h2><span>Fuentes oficiales</span></div>
    <p className="viewer-platform-intro">Explora películas, series y televisión gratuitas en servicios oficiales. SEBAS PLAY te lleva a la plataforma titular; no copia ni retransmite sus señales.</p>
    <div className="viewer-platform-grid">{platforms.map((p) => <article className="viewer-platform-card" key={p.name}>
      <div className="viewer-platform-icon">{p.kind === "TV en vivo" ? <Radio/> : p.kind === "Películas" ? <Film/> : <Clapperboard/>}</div>
      <span className="viewer-kicker">{p.kind}</span><h3>{p.name}</h3><p>{p.detail}</p><small>{p.note}</small>
      <a href={p.url} target="_blank" rel="noreferrer">Abrir servicio oficial <ExternalLink size={14}/></a>
    </article>)}</div>
  </section>;
}
