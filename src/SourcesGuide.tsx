import { BookOpen, Clapperboard, ExternalLink, Film, Globe2, Info, Radio, ShieldCheck } from "lucide-react";

type Source = { name: string; description: string; url: string; tag: string; note: string };

const movieSources: Source[] = [
  { name: "Drama — cine clásico", description: "Películas mudas y primeros largometrajes que el sitio identifica como dominio público en Estados Unidos.", url: "https://drama.sarl/", tag: "Películas", note: "Comprobar el estado de derechos en México y la versión exacta antes de integrarla." },
  { name: "SoapBox Stream — clásicos", description: "Catálogo curado de cine clásico con licencia y fuente indicadas por título.", url: "https://stream.soapbox.community/classics", tag: "Películas", note: "Usar el reproductor del titular o una copia cuya licencia esté documentada." },
  { name: "Internet Archive — guía de video", description: "Explica formatos y reproducción de videos alojados en Internet Archive.", url: "https://archivesupport.zendesk.com/hc/en-us/articles/360017808151-Movies-and-Videos-A-Basic-Guide", tag: "Películas", note: "La presencia de un archivo en Internet Archive no demuestra por sí sola que sea de dominio público." },
];

const seriesSources: Source[] = [
  { name: "Starlite TV — series clásicas", description: "Lista episodios de series antiguas y explica qué episodios considera de dominio público.", url: "https://starlitetv.com/free/public-domain-tv-shows", tag: "Series", note: "Los derechos pueden variar por episodio, música, país y versión. Revisar cada ficha." },
  { name: "Archive Watch — televisión clásica", description: "Catálogo de programas históricos con fuentes y notas de derechos.", url: "https://archivewatch.org/", tag: "Series", note: "Tomarlo como punto de partida; no copiar enlaces sin verificar los derechos y el origen." },
  { name: "PastTimeTV — televisión gratuita", description: "Índice de programas clásicos enlazados a fuentes de Internet Archive.", url: "https://pasttimetv.com/pages/watch-free", tag: "Series", note: "Confirmar la licencia de cada episodio en su página original." },
];

const tvSources: Source[] = [
  { name: "Broadcast Atlas — señales oficiales", description: "Directorio de transmisiones gratuitas que afirma enlazar los streams oficiales de los propios canales.", url: "https://broadcastatlas.com/official", tag: "TV en vivo", note: "Antes de dar de alta una señal, comprobar que el canal permite su reproducción externa y que funciona en México." },
  { name: "MXPlus — medios públicos de México", description: "Servicio oficial gratuito del Sistema Público de Radiodifusión con señales y contenidos bajo su propia aplicación.", url: "https://play.google.com/store/apps/details?id=com.mxplus", tag: "México", note: "Es una referencia oficial para usuarios; no implica permiso para extraer o retransmitir sus streams dentro de SEBAS PLAY." },
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
