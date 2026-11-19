import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity, Clapperboard, Film, LayoutDashboard, LogOut, Plus, Radio, Globe2,
  Search, ShieldCheck, Tv2, X, LoaderCircle, CheckCircle2, AlertCircle,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import EpisodesManager from "./EpisodesManager";
import SourcesGuide from "./SourcesGuide";

type Section = "overview" | "movies" | "series" | "channels" | "episodes" | "sources";
type Movie = { id: string; title: string; release_year: number | null; is_published: boolean; source_type: string; poster_url: string | null };
type Series = { id: string; title: string; release_year: number | null; is_published: boolean; source_type: string };
type Channel = { id: string; name: string; category: string | null; is_published: boolean; country_code: string | null };

const sourceLabels: Record<string, string> = {
  owned_upload: "Contenido propio",
  public_domain: "Dominio público",
  licensed_external: "Licenciado",
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"movie" | "series" | "channel" | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [movieForm, setMovieForm] = useState({ title: "", synopsis: "", year: "", poster: "", video: "", source: "owned_upload", rights: "" });
  const [seriesForm, setSeriesForm] = useState({ title: "", synopsis: "", year: "", poster: "", source: "owned_upload", rights: "" });
  const [channelForm, setChannelForm] = useState({ name: "", stream: "", logo: "", category: "", country: "MX", rights: "" });

  const isAdmin = session?.user.app_metadata?.role === "admin";

  const notify = (type: "ok" | "error", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  };

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    const [movieResult, seriesResult, channelResult] = await Promise.all([
      supabase.from("movies").select("id,title,release_year,is_published,source_type,poster_url").order("created_at", { ascending: false }),
      supabase.from("series").select("id,title,release_year,is_published,source_type").order("created_at", { ascending: false }),
      supabase.from("live_channels").select("id,name,category,is_published,country_code").order("created_at", { ascending: false }),
    ]);
    const firstError = movieResult.error || seriesResult.error || channelResult.error;
    if (firstError) notify("error", firstError.message);
    setMovies((movieResult.data ?? []) as Movie[]);
    setSeries((seriesResult.data ?? []) as Series[]);
    setChannels((channelResult.data ?? []) as Channel[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) void loadCatalog();
  }, [isAdmin, loadCatalog]);

  const stats = useMemo(() => ({
    movies: movies.length,
    series: series.length,
    channels: channels.length,
    published: [...movies, ...series, ...channels].filter((item) => item.is_published).length,
  }), [movies, series, channels]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setAuthLoading(false);
    if (error) notify("error", error.message);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }

  async function uploadPoster(file: File, target: "movie" | "series") {
    if (!supabase) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      notify("error", "Formato no permitido. Usa JPG, PNG, WEBP o AVIF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify("error", "La portada debe pesar máximo 10 MB.");
      return;
    }
    setSaving(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("sebas-play-posters").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    setSaving(false);
    if (error) { notify("error", `No se pudo subir la portada: ${error.message}`); return; }
    const { data } = supabase.storage.from("sebas-play-posters").getPublicUrl(path);
    if (target === "movie") setMovieForm((current) => ({ ...current, poster: data.publicUrl }));
    else setSeriesForm((current) => ({ ...current, poster: data.publicUrl }));
    notify("ok", "Portada subida correctamente.");
  }

  async function addMovie(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("movies").insert({
      title: movieForm.title.trim(),
      synopsis: movieForm.synopsis.trim() || null,
      release_year: movieForm.year ? Number(movieForm.year) : null,
      poster_url: movieForm.poster.trim() || null,
      video_url: movieForm.video.trim() || null,
      source_type: movieForm.source,
      rights_note: movieForm.rights.trim() || null,
      is_published: false,
    });
    setSaving(false);
    if (error) { notify("error", error.message); return; }
    setMovieForm({ title: "", synopsis: "", year: "", poster: "", video: "", source: "owned_upload", rights: "" });
    setModal(null); notify("ok", "Película guardada como borrador."); await loadCatalog();
  }

  async function addSeries(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("series").insert({
      title: seriesForm.title.trim(),
      synopsis: seriesForm.synopsis.trim() || null,
      release_year: seriesForm.year ? Number(seriesForm.year) : null,
      poster_url: seriesForm.poster.trim() || null,
      source_type: seriesForm.source,
      rights_note: seriesForm.rights.trim() || null,
      is_published: false,
    });
    setSaving(false);
    if (error) { notify("error", error.message); return; }
    setSeriesForm({ title: "", synopsis: "", year: "", poster: "", source: "owned_upload", rights: "" });
    setModal(null); notify("ok", "Serie guardada como borrador."); await loadCatalog();
  }

  async function addChannel(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("live_channels").insert({
      name: channelForm.name.trim(),
      stream_url: channelForm.stream.trim(),
      logo_url: channelForm.logo.trim() || null,
      category: channelForm.category.trim() || null,
      country_code: channelForm.country.trim().toUpperCase() || null,
      rights_note: channelForm.rights.trim() || null,
      is_published: false,
    });
    setSaving(false);
    if (error) { notify("error", error.message); return; }
    setChannelForm({ name: "", stream: "", logo: "", category: "", country: "MX", rights: "" });
    setModal(null); notify("ok", "Canal guardado como borrador."); await loadCatalog();
  }

  async function togglePublished(table: "movies" | "series" | "live_channels", id: string, published: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from(table).update({ is_published: !published }).eq("id", id);
    if (error) { notify("error", error.message); return; }
    notify("ok", published ? "Contenido retirado del catálogo público." : "Contenido publicado.");
    await loadCatalog();
  }

  async function deleteItem(table: "movies" | "series" | "live_channels", id: string) {
    if (!supabase || !window.confirm("¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { notify("error", error.message); return; }
    notify("ok", "Registro eliminado."); await loadCatalog();
  }

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (authLoading) return <div className="screen-center"><LoaderCircle className="spin" size={30} /><span>Conectando con SEBAS PLAY…</span></div>;

  if (!session) return (
    <main className="login-screen">
      <div className="login-glow" />
      <section className="login-card">
        <div className="brand-mark"><Tv2 size={26} /></div>
        <div className="eyebrow">CENTRO DE CONTROL</div>
        <h1>SEBAS <span>PLAY</span></h1>
        <p className="muted">Inicia sesión para administrar tu plataforma.</p>
        <form onSubmit={signIn} className="stack-form">
          <label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@tudominio.com" /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" /></label>
          <button className="primary-btn full" disabled={authLoading}>Entrar al panel <span>→</span></button>
        </form>
        <div className="secure-note"><ShieldCheck size={15} /> Acceso protegido por Supabase Auth</div>
      </section>
      {notice && <Toast notice={notice} />}
    </main>
  );

  if (!isAdmin) return (
    <div className="screen-center">
      <div className="denied-card"><ShieldCheck size={34} /><h2>Cuenta sin permisos de administrador</h2><p>Tu sesión es válida, pero esta cuenta no tiene el rol administrativo de SEBAS PLAY.</p><button className="secondary-btn" onClick={signOut}>Cerrar sesión</button></div>
      {notice && <Toast notice={notice} />}
    </div>
  );

  const nav = [
    { id: "overview" as const, label: "Resumen", icon: LayoutDashboard },
    { id: "movies" as const, label: "Películas", icon: Film, count: stats.movies },
    { id: "series" as const, label: "Series", icon: Clapperboard, count: stats.series },
    { id: "channels" as const, label: "TV en vivo", icon: Radio, count: stats.channels },
    { id: "episodes" as const, label: "Temporadas y episodios", icon: Clapperboard },
    { id: "sources" as const, label: "Fuentes gratuitas", icon: Globe2 },
  ];

  const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  const filteredSeries = series.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  const filteredChannels = channels.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand"><div className="brand-mark small"><Tv2 size={20} /></div><div><b>SEBAS <span>PLAY</span></b><small>ADMIN STUDIO</small></div></div>
        <div className="side-label">MENÚ PRINCIPAL</div>
        <nav>{nav.map((item) => <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => { setSection(item.id); setSearch(""); }}><item.icon size={18} /><span>{item.label}</span>{item.count !== undefined && <small>{item.count}</small>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="online-dot" /> Catálogo conectado<div className="user-mini"><div className="avatar">{(session.user.email ?? "A").slice(0, 1).toUpperCase()}</div><div className="user-copy"><b>Administrador</b><small>{session.user.email}</small></div><button title="Cerrar sesión" onClick={signOut}><LogOut size={17} /></button></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><div className="eyebrow">SEBAS PLAY / ADMINISTRACIÓN</div><h2>{nav.find((n) => n.id === section)?.label}</h2></div><div className="top-actions"><div className="status-pill"><span /> Sistema conectado</div><button className="icon-btn" title="Actualizar catálogo" onClick={() => void loadCatalog()}><Activity size={18} /></button></div></header>

        {section === "episodes" && <EpisodesManager />}
        {section === "sources" && <SourcesGuide />}
        {section === "overview" && <section className="content">
          <div className="welcome-banner"><div><div className="eyebrow">TU PLATAFORMA, TU CONTENIDO</div><h1>Bienvenido a <span>SEBAS PLAY</span></h1><p>Administra el contenido que se mostrará en tus aplicaciones.</p></div><div className="banner-icon"><Tv2 size={58} /></div></div>
          <div className="stat-grid">
            <Stat icon={Film} label="Películas" value={stats.movies} />
            <Stat icon={Clapperboard} label="Series" value={stats.series} />
            <Stat icon={Radio} label="Canales" value={stats.channels} />
            <Stat icon={CheckCircle2} label="Publicados" value={stats.published} />
          </div>
          <div className="section-heading"><div><h3>Accesos rápidos</h3><p>Agrega contenido al catálogo compartido.</p></div></div>
          <div className="quick-grid">
            <Quick icon={Film} title="Agregar película" text="Registra una película nueva" onClick={() => setModal("movie")} />
            <Quick icon={Clapperboard} title="Agregar serie" text="Crea la ficha de una serie" onClick={() => setModal("series")} />
            <Quick icon={Radio} title="Agregar canal" text="Registra una señal autorizada" onClick={() => setModal("channel")} />
          </div>
          <div className="info-strip"><ShieldCheck size={19} /><div><b>Publicación protegida</b><p>Todo contenido nuevo se guarda como borrador. Revisa sus derechos y datos antes de publicarlo.</p></div></div>
        </section>}

        {section !== "overview" && section !== "episodes" && <section className="content">
          <div className="list-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en el catálogo…" /></div><button className="primary-btn" onClick={() => setModal(section === "movies" ? "movie" : section === "series" ? "series" : "channel")}><Plus size={17} /> Agregar {section === "movies" ? "película" : section === "series" ? "serie" : "canal"}</button></div>
          {loading ? <div className="empty-state"><LoaderCircle className="spin" /> Cargando catálogo…</div> :
            section === "movies" ? <ContentTable title="Películas" rows={filteredMovies.map((m) => ({ id: m.id, title: m.title, detail: [m.release_year, sourceLabels[m.source_type] ?? m.source_type].filter(Boolean).join(" · "), published: m.is_published, table: "movies" as const }))} onToggle={togglePublished} onDelete={deleteItem} /> :
            section === "series" ? <ContentTable title="Series" rows={filteredSeries.map((m) => ({ id: m.id, title: m.title, detail: [m.release_year, sourceLabels[m.source_type] ?? m.source_type].filter(Boolean).join(" · "), published: m.is_published, table: "series" as const }))} onToggle={togglePublished} onDelete={deleteItem} /> :
            <ContentTable title="Canales de TV" rows={filteredChannels.map((m) => ({ id: m.id, title: m.name, detail: [m.category, m.country_code].filter(Boolean).join(" · "), published: m.is_published, table: "live_channels" as const }))} onToggle={togglePublished} onDelete={deleteItem} />}
        </section>}
      </main>
      {modal && <Modal title={modal === "movie" ? "Nueva película" : modal === "series" ? "Nueva serie" : "Nuevo canal de TV"} onClose={() => setModal(null)}>
        {modal === "movie" && <form className="modal-form" onSubmit={addMovie}>
          <Field label="Título" required><input required value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} placeholder="Nombre de la película" /></Field>
          <Field label="Sinopsis"><textarea value={movieForm.synopsis} onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })} placeholder="Descripción breve" rows={3} /></Field>
          <div className="form-row"><Field label="Año"><input type="number" min="1888" max="2100" value={movieForm.year} onChange={(e) => setMovieForm({ ...movieForm, year: e.target.value })} placeholder="2026" /></Field><Field label="Tipo de fuente"><select value={movieForm.source} onChange={(e) => setMovieForm({ ...movieForm, source: e.target.value })}><option value="owned_upload">Contenido propio</option><option value="public_domain">Dominio público</option><option value="licensed_external">Licenciado</option></select></Field></div>
          <Field label="Subir portada (JPG, PNG, WEBP o AVIF · máx. 10 MB)"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={saving} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadPoster(file, "movie"); e.target.value = ""; }} /></Field>
          <Field label="O pega la URL del póster"><input type="url" value={movieForm.poster} onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })} placeholder="https://…" /></Field>
          <Field label="URL del video autorizado"><input type="url" value={movieForm.video} onChange={(e) => setMovieForm({ ...movieForm, video: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Nota de derechos / autorización"><input value={movieForm.rights} onChange={(e) => setMovieForm({ ...movieForm, rights: e.target.value })} placeholder="Origen, licencia o autorización" /></Field>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving ? "Guardando…" : "Guardar borrador"}</button></div>
        </form>}
        {modal === "series" && <form className="modal-form" onSubmit={addSeries}>
          <Field label="Título" required><input required value={seriesForm.title} onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })} placeholder="Nombre de la serie" /></Field>
          <Field label="Sinopsis"><textarea rows={3} value={seriesForm.synopsis} onChange={(e) => setSeriesForm({ ...seriesForm, synopsis: e.target.value })} placeholder="Descripción breve" /></Field>
          <div className="form-row"><Field label="Año"><input type="number" min="1888" max="2100" value={seriesForm.year} onChange={(e) => setSeriesForm({ ...seriesForm, year: e.target.value })} placeholder="2026" /></Field><Field label="Tipo de fuente"><select value={seriesForm.source} onChange={(e) => setSeriesForm({ ...seriesForm, source: e.target.value })}><option value="owned_upload">Contenido propio</option><option value="public_domain">Dominio público</option><option value="licensed_external">Licenciado</option></select></Field></div>
          <Field label="Subir portada (JPG, PNG, WEBP o AVIF · máx. 10 MB)"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={saving} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadPoster(file, "series"); e.target.value = ""; }} /></Field>
          <Field label="O pega la URL del póster"><input type="url" value={seriesForm.poster} onChange={(e) => setSeriesForm({ ...seriesForm, poster: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Nota de derechos / autorización"><input value={seriesForm.rights} onChange={(e) => setSeriesForm({ ...seriesForm, rights: e.target.value })} placeholder="Origen, licencia o autorización" /></Field>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving ? "Guardando…" : "Guardar borrador"}</button></div>
        </form>}
        {modal === "channel" && <form className="modal-form" onSubmit={addChannel}>
          <Field label="Nombre del canal" required><input required value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} placeholder="Nombre de la señal" /></Field>
          <Field label="URL de transmisión autorizada" required><input required type="url" value={channelForm.stream} onChange={(e) => setChannelForm({ ...channelForm, stream: e.target.value })} placeholder="https://…" /></Field>
          <Field label="URL del logotipo"><input type="url" value={channelForm.logo} onChange={(e) => setChannelForm({ ...channelForm, logo: e.target.value })} placeholder="https://…" /></Field>
          <div className="form-row"><Field label="Categoría"><input value={channelForm.category} onChange={(e) => setChannelForm({ ...channelForm, category: e.target.value })} placeholder="Noticias, música…" /></Field><Field label="País"><input maxLength={2} value={channelForm.country} onChange={(e) => setChannelForm({ ...channelForm, country: e.target.value })} /></Field></div>
          <Field label="Nota de derechos / autorización"><input value={channelForm.rights} onChange={(e) => setChannelForm({ ...channelForm, rights: e.target.value })} placeholder="Origen, licencia o autorización" /></Field>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving ? "Guardando…" : "Guardar borrador"}</button></div>
        </form>}
      </Modal>}
      {notice && <Toast notice={notice} />}
    </div>
  );
}

function SetupScreen() {
  return <div className="screen-center"><div className="denied-card"><AlertCircle size={34} /><h2>Falta conectar Supabase</h2><p>Crea un archivo <code>.env</code> con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. No agregues claves secretas al navegador.</p></div></div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof Film; label: string; value: number }) {
  return <div className="stat-card"><div className="stat-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong></div></div>;
}
function Quick({ icon: Icon, title, text, onClick }: { icon: typeof Film; title: string; text: string; onClick: () => void }) {
  return <button className="quick-card" onClick={onClick}><div className="quick-icon"><Icon size={21} /></div><b>{title}</b><span>{text}</span><i>Agregar <Plus size={14} /></i></button>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="field-label">{label}{required && <em> *</em>}{children}</label>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-card"><header><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={19} /></button></header>{children}</section></div>;
}
function ContentTable({ title, rows, onToggle, onDelete }: { title: string; rows: { id: string; title: string; detail: string; published: boolean; table: "movies" | "series" | "live_channels" }[]; onToggle: (table: "movies" | "series" | "live_channels", id: string, published: boolean) => void; onDelete: (table: "movies" | "series" | "live_channels", id: string) => void }) {
  return <div className="table-card"><div className="table-title"><h3>{title}</h3><span>{rows.length} registros</span></div>{rows.length === 0 ? <div className="empty-state">Todavía no hay contenido aquí. Agrega el primer registro.</div> : <div className="table-wrap"><table><thead><tr><th>Contenido</th><th>Detalles</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><b>{row.title}</b></td><td className="muted-cell">{row.detail || "—"}</td><td><span className={row.published ? "badge published" : "badge draft"}>{row.published ? "Publicado" : "Borrador"}</span></td><td><div className="row-actions"><button className="text-action" onClick={() => onToggle(row.table, row.id, row.published)}>{row.published ? "Retirar" : "Publicar"}</button><button className="delete-action" onClick={() => onDelete(row.table, row.id)}>Eliminar</button></div></td></tr>)}</tbody></table></div>}</div>;
}
function Toast({ notice }: { notice: { type: "ok" | "error"; text: string } }) {
  return <div className={notice.type === "ok" ? "toast success" : "toast error"}>{notice.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{notice.text}</div>;
}
