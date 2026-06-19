import { useEffect, useMemo, useState } from "react";

const rows = [
  { key: "top", title: "Trending this week" },
  { key: "hindi", title: "Hindi cinema" },
  { key: "telugu", title: "Telugu favorites" },
  { key: "tamil", title: "Tamil stories" },
  { key: "action", title: "Adrenaline rush" },
  { key: "comedy", title: "Easy laughs" },
];

const demoMovies = [
  { id: "movie:101", title: "The Last Horizon", year: "2026", type: "movie", tone: "violet" },
  { id: "movie:102", title: "Midnight Signal", year: "2025", type: "movie", tone: "blue" },
  { id: "series:103", title: "The Long Way Home", year: "2026", type: "series", tone: "amber" },
  { id: "movie:104", title: "After the Monsoon", year: "2025", type: "movie", tone: "green" },
  { id: "movie:105", title: "Neon City", year: "2026", type: "movie", tone: "pink" },
  { id: "series:106", title: "Parallel Lines", year: "2024", type: "series", tone: "indigo" },
];

const genres = [
  ["", "All genres"], ["28", "Action"], ["12", "Adventure"], ["16", "Animation"],
  ["35", "Comedy"], ["80", "Crime"], ["18", "Drama"], ["14", "Fantasy"],
  ["27", "Horror"], ["10749", "Romance"], ["878", "Sci-Fi"], ["53", "Thriller"],
];

const languages = [
  ["", "All languages"], ["en", "English"], ["hi", "Hindi"], ["te", "Telugu"],
  ["ta", "Tamil"], ["ml", "Malayalam"], ["ko", "Korean"], ["ja", "Japanese"],
];

async function api(path, options) {
  const response = await fetch(path, options);
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      "Email, AI, and live movie data use Vercel serverless APIs. Test this feature on the deployed site.",
    );
  }

  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function App() {
  const [homeRows, setHomeRows] = useState({});
  const [featuredMovies, setFeaturedMovies] = useState(demoMovies.slice(0, 5));
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("movieFavorites") || "[]"));
  const [showFavorites, setShowFavorites] = useState(false);
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [mediaType, setMediaType] = useState("movie");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("movieFinderUser") || "null"));

  useEffect(() => {
    Promise.all(rows.map(async ({ key }) => {
      try {
        const data = await api(`/api/tmdb?mode=row&row=${key}`);
        return [key, data.results?.slice(0, 12) || []];
      } catch {
        return [key, demoMovies];
      }
    })).then((entries) => setHomeRows(Object.fromEntries(entries)));

    api("/api/tmdb?mode=recent")
      .then((data) => {
        if (data.results?.length) setFeaturedMovies(data.results.slice(0, 5));
      })
      .catch(() => setFeaturedMovies(demoMovies.slice(0, 5)));
  }, []);

  useEffect(() => {
    if (featuredMovies.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredMovies.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [featuredMovies]);

  useEffect(() => {
    if (query.trim().length < 2) return setSuggestions([]);
    const timer = setTimeout(() => {
      api(`/api/tmdb?mode=search&query=${encodeURIComponent(query)}`)
        .then((data) => setSuggestions(data.results?.slice(0, 5) || []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);
  const featured = featuredMovies[featuredIndex] || demoMovies[0];

  async function search(event) {
    event?.preventDefault();
    if (!query.trim()) return;
    setSuggestions([]);
    setLoading(true);
    setStatus(`Searching for “${query}”`);
    try {
      const data = await api(`/api/tmdb?mode=search&query=${encodeURIComponent(query)}`);
      setResults(data.results || []);
      setStatus(`${data.results?.length || 0} titles found`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function discover(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("Building your collection…");
    const params = new URLSearchParams({ mode: "discover", type: mediaType });
    if (genre) params.set("genre", genre);
    if (language) params.set("language", language);
    try {
      const data = await api(`/api/tmdb?${params}`);
      setResults(data.results || []);
      setStatus(`${data.results?.length || 0} handpicked matches`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function askAi(event) {
    event.preventDefault();
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setStatus("AI is curating your watchlist…");
    try {
      const data = await api("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      setResults(data.results || []);
      setStatus(data.message || "Here are your AI picks.");
      setAiOpen(false);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(movie) {
    setSelected(movie);
    setDetails(null);
    try {
      const data = await api(`/api/tmdb?mode=details&id=${encodeURIComponent(movie.id)}&region=IN`);
      setDetails(data);
    } catch {
      setDetails(movie);
    }
  }

  function toggleFavorite(movie) {
    const next = favoriteIds.has(movie.id)
      ? favorites.filter((item) => item.id !== movie.id)
      : [movie, ...favorites];
    setFavorites(next);
    localStorage.setItem("movieFavorites", JSON.stringify(next));
  }

  const visibleSections = results.length
    ? [{ key: "results", title: status || "Your results", movies: results }]
    : rows.map((row) => ({ ...row, movies: homeRows[row.key] || demoMovies }));

  return (
    <div className="site-shell">
      <div className={`progress ${loading ? "active" : ""}`} />
      <Header
        query={query} setQuery={setQuery} suggestions={suggestions} onSearch={search}
        onSelectSuggestion={(movie) => { setQuery(movie.title); setSuggestions([]); openDetails(movie); }}
        favorites={favorites.length} onFavorites={() => setShowFavorites(true)}
        onAi={() => setAiOpen(true)} onAuth={() => setAuthOpen(true)} user={user}
      />

      <main>
        <Hero
          key={featured.id}
          movie={featured}
          index={featuredIndex}
          count={featuredMovies.length}
          onSelect={setFeaturedIndex}
          onDetails={openDetails}
          onFavorite={toggleFavorite}
          saved={favoriteIds.has(featured.id)}
        />

        <section className="control-dock">
          <div>
            <span className="kicker">DISCOVER YOUR WAY</span>
            <h2>What are you in the mood for?</h2>
          </div>
          <form className="filters" onSubmit={discover}>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Genre">
              {genres.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
              {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} aria-label="Type">
              <option value="movie">Movies</option><option value="series">Series</option>
            </select>
            <button className="primary" type="submit">Explore</button>
          </form>
        </section>

        {status && <div className="status-line"><span />{status}</div>}

        <div className="shelves">
          {visibleSections.map((section) => (
            <MovieShelf
              key={section.key} title={section.title} movies={section.movies}
              favorites={favoriteIds} onDetails={openDetails} onFavorite={toggleFavorite}
            />
          ))}
        </div>
      </main>

      <footer><div className="logo"><b>M</b> MovieFinder</div><p>Find the story that stays with you.</p><span>Powered by TMDB</span></footer>

      {selected && <DetailsModal movie={{ ...selected, ...details }} loading={!details} onClose={() => setSelected(null)} onFavorite={toggleFavorite} saved={favoriteIds.has(selected.id)} />}
      {showFavorites && <FavoritesModal movies={favorites} onClose={() => setShowFavorites(false)} onDetails={openDetails} onFavorite={toggleFavorite} favorites={favoriteIds} />}
      {aiOpen && <AiModal prompt={aiPrompt} setPrompt={setAiPrompt} onSubmit={askAi} onClose={() => setAiOpen(false)} loading={loading} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onUser={(next) => { setUser(next); localStorage.setItem("movieFinderUser", JSON.stringify(next)); }} />}
    </div>
  );
}

function Header({ query, setQuery, suggestions, onSearch, onSelectSuggestion, favorites, onFavorites, onAi, onAuth, user }) {
  return <header className="topbar">
    <a className="logo" href="#top"><b>M</b><span>MovieFinder</span></a>
    <nav><a href="#discover">Discover</a><button onClick={onAi}>AI Concierge</button><button onClick={onFavorites}>My list <i>{favorites}</i></button></nav>
    <form className="nav-search" onSubmit={onSearch}>
      <span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles…" aria-label="Search movies" />
      {suggestions.length > 0 && <div className="suggestion-popover">
        {suggestions.map((movie) => <button type="button" key={movie.id} onClick={() => onSelectSuggestion(movie)}><span>{movie.title}</span><small>{movie.year}</small></button>)}
      </div>}
    </form>
    <button className="avatar" onClick={onAuth} title={user?.email || "Sign in"}>{user?.email?.[0]?.toUpperCase() || "A"}</button>
  </header>;
}

function Hero({ movie, index, count, onSelect, onDetails, onFavorite, saved }) {
  return <section id="top" className="hero" style={movie.backdrop ? { "--hero-image": `url(${movie.backdrop})` } : {}}>
    <div className="hero-content">
      <div className="hero-badge"><span /> FEATURED PREMIERE</div>
      <h1>{movie.title}</h1>
      <div className="hero-meta"><strong>98% Match</strong><span>{movie.year}</span><em>{movie.type}</em><span>4K</span></div>
      <p>{movie.plot || "Some stories entertain you. Others follow you home. Discover remarkable films and series selected for your next movie night."}</p>
      <div className="hero-actions">
        <button className="primary" onClick={() => onDetails(movie)}>▶ View details</button>
        <button className="glass" onClick={() => onFavorite(movie)}>{saved ? "✓ In my list" : "+ My list"}</button>
      </div>
      <div className="hero-dots" aria-label="Featured titles">
        {Array.from({ length: count }, (_, dotIndex) => (
          <button
            key={dotIndex}
            className={dotIndex === index ? "active" : ""}
            onClick={() => onSelect(dotIndex)}
            aria-label={`Show featured title ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
    <div className="hero-index">{String(index + 1).padStart(2, "0")} <span>/ {String(count).padStart(2, "0")}</span></div>
  </section>;
}

function MovieShelf({ title, movies, favorites, onDetails, onFavorite }) {
  return <section className="shelf" id="discover">
    <div className="shelf-heading"><h2>{title}</h2><button>View all <span>→</span></button></div>
    <div className="movie-row">
      {movies.map((movie, index) => <MovieCard key={`${movie.id}-${index}`} movie={movie} saved={favorites.has(movie.id)} onDetails={onDetails} onFavorite={onFavorite} />)}
    </div>
  </section>;
}

function MovieCard({ movie, saved, onDetails, onFavorite }) {
  return <article className={`movie-card tone-${movie.tone || "blue"}`}>
    <button className="poster-button" onClick={() => onDetails(movie)} aria-label={`View ${movie.title}`}>
      {movie.poster && movie.poster !== "N/A" ? <img src={movie.poster} alt="" loading="lazy" /> : <div className="poster-fallback"><b>{movie.title}</b><span>MovieFinder original</span></div>}
      <div className="card-overlay"><span className="play">▶</span><p>{movie.year} · {movie.type}</p></div>
    </button>
    <div className="card-caption"><div><h3>{movie.title}</h3><p>{movie.year} · {movie.type}</p></div><button className={saved ? "saved" : ""} onClick={() => onFavorite(movie)}>{saved ? "✓" : "+"}</button></div>
  </article>;
}

function DetailsModal({ movie, loading, onClose, onFavorite, saved }) {
  const providers = movie.watchProviders || {};
  const allProviders = [...(providers.stream || []), ...(providers.rent || []), ...(providers.buy || [])]
    .filter((provider, index, array) => array.findIndex((item) => item.id === provider.id) === index);
  return <div className="modal-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="details-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="details-backdrop" style={movie.backdrop ? { backgroundImage: `linear-gradient(0deg,#111 0%,transparent 80%),url(${movie.backdrop})` } : {}}>
        <div><span className="kicker">{movie.type}</span><h2>{movie.title}</h2><p>{movie.year} · {movie.genre || "Featured"} · TMDB {movie.imdbRating || "—"}</p></div>
      </div>
      <div className="details-body">
        {loading ? <div className="modal-loading">Loading the full story…</div> : <>
          <div className="details-copy"><p>{movie.plot || "Story details are coming soon."}</p><div className="detail-actions">
            <a className="primary button-link" href={movie.trailerUrl || `https://youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}`} target="_blank" rel="noreferrer">▶ Trailer</a>
            <button className="glass" onClick={() => onFavorite(movie)}>{saved ? "✓ Saved" : "+ My list"}</button>
          </div><dl><div><dt>Cast</dt><dd>{movie.actors || "Details unavailable"}</dd></div><div><dt>Director / Creator</dt><dd>{movie.director || "Details unavailable"}</dd></div></dl></div>
          <aside className="watch-panel"><span className="kicker">WHERE TO WATCH · INDIA</span><h3>Available on</h3>
            {allProviders.length ? <div className="providers">{allProviders.map((provider) => <div key={provider.id}>{provider.logo ? <img src={provider.logo} alt="" /> : <b>{provider.name[0]}</b>}<span>{provider.name}</span></div>)}</div> : <p className="provider-empty">Streaming availability isn’t listed for this title yet.</p>}
            {providers.link && <a href={providers.link} target="_blank" rel="noreferrer">See all viewing options ↗</a>}
          </aside>
        </>}
      </div>
    </section>
  </div>;
}

function FavoritesModal({ movies, onClose, onDetails, onFavorite, favorites }) {
  return <div className="modal-layer"><section className="list-modal"><button className="modal-close" onClick={onClose}>×</button><span className="kicker">YOUR COLLECTION</span><h2>My list</h2>
    {movies.length ? <div className="favorite-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} saved={favorites.has(movie.id)} onDetails={(item) => { onClose(); onDetails(item); }} onFavorite={onFavorite} />)}</div> : <div className="empty-list">Your list is waiting for its first great story.</div>}
  </section></div>;
}

function AiModal({ prompt, setPrompt, onSubmit, onClose, loading }) {
  return <div className="modal-layer"><section className="ai-modal"><button className="modal-close" onClick={onClose}>×</button><div className="ai-orb">✦</div><span className="kicker">AI CONCIERGE</span><h2>Tell us the vibe.</h2><p>Describe a mood, language, occasion, or the kind of story you want tonight.</p>
    <form onSubmit={onSubmit}><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A clever Hindi thriller for a rainy night…" maxLength="400" autoFocus /><button className="primary" disabled={loading}>{loading ? "Curating…" : "Find my movie ✦"}</button></form>
  </section></div>;
}

function AuthModal({ onClose, onUser }) {
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [step, setStep] = useState("email"); const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault(); setMessage(step === "email" ? "Sending your code…" : "Verifying…");
    try {
      const data = await api("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(step === "email" ? { action: "request", mode: "signup", email } : { action: "verify", email, token: code }) });
      if (step === "email") { setStep("code"); setMessage(data.message); } else { onUser(data.user); setMessage("You’re in."); setTimeout(onClose, 500); }
    } catch (error) { setMessage(error.message); }
  }
  return <div className="modal-layer"><section className="auth-modal"><button className="modal-close" onClick={onClose}>×</button><div className="logo"><b>M</b></div><span className="kicker">WELCOME TO MOVIEFINDER</span><h2>Keep every great find.</h2><p>Sign in with a secure email code, or keep exploring as a guest.</p><form onSubmit={submit}>
    {step === "email" ? <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus /> : <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="Your verification code" minLength="6" maxLength="10" required autoFocus />}
    <button className="primary">{step === "email" ? "Send code" : "Verify & continue"}</button></form><small role="status">{message}</small><button className="guest" onClick={onClose}>Continue as guest</button>
  </section></div>;
}

export default App;
