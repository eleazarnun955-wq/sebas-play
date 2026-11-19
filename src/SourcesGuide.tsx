import { BookOpen, Clapperboard, ExternalLink, Film, Globe2, Info, Radio, ShieldCheck } from "lucide-react";

type Source = { name: string; description: string; url: string; tag: string; note: string };

const movieSources: Source[] = [
  { name: "Tubi — películas y series", description: "Plataforma gratuita con anuncios y catálogo de estudios; disponible oficialmente en México.", url: "https://tubitv.com/es-mx/welcome", tag: "Películas y series", note: "La reproducción se realiza en Tubi. No copiar ni incrustar sus streams; abrir el servicio oficial." },
  { name: "Canela.TV — cine en español", description: "Películas, series, telenovelas y contenido original gratuito en español.", url: "https://www.canela.tv/", tag: "Películas", note: "Servicio con anuncios. Su FAQ confirma disponibilidad en la mayoría de países de Latinoamérica." },
  { name: "Nuestro Cine MX — IMCINE", description: "Cine mexicano, cortometrajes, series y colecciones; cuenta con una sección gratuita.", url: "https://www.nuestrocine.mx/", tag: "Cine mexicano", note: "Cada título puede ser gratuito, de renta o suscripción. Revisar la modalidad antes de recomendarlo." },
  { name: "Internet Archive — guía de video", description: "Explica formatos y reproducción de videos alojados en Internet Archive.", url: "https://archivesupport.zendesk.com/hc/en-us/articles/360017808151-Movies-and-Videos-A-Basic-Guide", tag: "Dominio público", note: "La presencia de un archivo no demuestra por sí sola que sea de dominio público en México." },
];

const seriesSources: Source[] = [
  { name: "Tubi — series", description: "Series de televisión gratuitas con anuncios y catálogo que cambia por región.", url: "https://tubitv.com/es-mx/welcome", tag: "Series", note: "Abrir el título en Tubi; no extraer enlaces privados ni reproducir fuera de su plataforma." },
  { name: "Canela.TV — series y telenovelas", description: "Series, novelas y producciones originales en español, sin costo para el usuario.", url: "https://www.canela.tv/", tag: "Series", note: "Confirmar la disponibilidad regional y abrir el reproductor oficial." },
  { name: "Nuestro Cine MX — series", description: "Catálogo del IMCINE con películas, cortometrajes y series; incluye obras gratuitas.", url: "https://www.nuestrocine.mx/fqs", tag: "Series", note: "La plataforma distingue contenido gratuito, renta y suscripción. No todo el catálogo es gratuito." },
];

const tvSources: Source[] = [
  { name: "Pluto TV — canales en vivo", description: "Canales temáticos gratuitos y contenido bajo demanda en México.", url: "https://plutotv.com.mx/welcome", tag: "TV en vivo", note: "El usuario ve la señal en Pluto TV; no redistribuir ni extraer sus streams." },
  { name: "MXPlus — medios públicos de México", description: "Plataforma gratuita del SPR con señales públicas y contenido bajo demanda.", url: "https://mxplus.tv/", tag: "México", note: "Es una plataforma oficial independiente. Su disponibilidad gratuita no concede permiso para retransmitir señales dentro de SEBAS PLAY." },
  { name: "SPR — plataformas oficiales", description: "Directorio institucional de las plataformas públicas de televisión y radio.", url: "https://spr.gob.mx/plataformas.html", tag: "Fuentes oficiales", note: "Consultar condiciones del SPR antes de integrar cualquier señal directamente." },
];

const metadataSources: Source[] = [
  { name: "TMDB — API y metadatos", description: "Datos de películas, series, sinopsis y material gráfico para enriquecer las fichas.", url: "https://developer.themoviedb.org/docs/faq", tag: "Metadatos", note: "No proporciona derechos de reproducción. La API gratuita exige atribución y se limita a usos no comerciales; revisar licencia si SEBAS PLAY será comercial." },
];

function SourceCard({ source }: { source: Source }) {
  return <article className="table-card" style={{ padding: 18, display: "grid", gap: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <span className="badge published">{source.tag}</span>
      <ExternalLink size={16} />
    </div>
    <h3 style={{ margin: 0, fontSize: 14 }}>{source.name}</h3>
    <p className="muted" style={{ margin: 0 }}>{source.description}</p>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#e6c27a", fontSize: 11, lineHeight: 1.5 }}>
      <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />{source.note}
    </div>
    <a href={source.url} target="_blank" rel="noreferrer" className="text-action" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}>Abrir fuente <ExternalLink size={13} /></a>
  </article>;
}

export default function SourcesGuide() {
  return <section className="content">
    <div className="section-heading">
      <h3>Fuentes para llenar SEBAS PLAY</h3>
      <p>Directorios de referencia para encontrar contenido gratuito o con licencia. Esta guía no agrega ni retransmite contenido automáticamente.</p>
    </div>
    <div className="info-strip" style={{ marginTop: 0, marginBottom: 22 }}>
      <ShieldCheck size={19} />
      <div><b>Regla de publicación</b><p>Solo publicar títulos o señales cuando tengamos permiso de reproducción, una licencia abierta válida o una verificación sólida de dominio público aplicable al territorio. No basta con que un video sea visible gratis en internet.</p></div>
    </div>
    <div className="section-heading"><h3><Film size={17} style={{ display: "inline", verticalAlign: "middle" }} /> Películas</h3></div>
    <div className="quick-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginBottom: 24 }}>{movieSources.map(s => <SourceCard key={s.name} source={s} />)}</div>
    <div className="section-heading"><h3><Clapperboard size={17} style={{ display: "inline", verticalAlign: "middle" }} /> Series y episodios</h3></div>
    <div className="quick-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginBottom: 24 }}>{seriesSources.map(s => <SourceCard key={s.name} source={s} />)}</div>
    <div className="section-heading"><h3><Radio size={17} style={{ display: "inline", verticalAlign: "middle" }} /> Televisión en vivo</h3></div>
    <div className="quick-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginBottom: 24 }}>{tvSources.map(s => <SourceCard key={s.name} source={s} />)}</div>
    <div className="section-heading"><h3><BookOpen size={17} style={{ display: "inline", verticalAlign: "middle" }} /> Portadas y descripciones</h3></div>
    <div className="quick-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>{metadataSources.map(s => <SourceCard key={s.name} source={s} />)}</div>
    <div className="info-strip"><Globe2 size={19} /><div><b>Siguiente paso de integración</b><p>Cuando elijamos un título o canal concreto, registrar su ficha, fuente original, nota de derechos y enlace de reproducción autorizado. Las fuentes de metadatos como TMDB solo completan la ficha; no sustituyen los permisos de video.</p></div></div>
  </section>;
}
