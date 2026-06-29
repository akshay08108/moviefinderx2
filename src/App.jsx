import { useEffect, useMemo, useRef, useState } from "react";

const rows = [
  { key: "top10", title: "Top 10 recommendations" },
  { key: "top", title: "Trending now" },
  { key: "english", title: "English hits" },
  { key: "hindi", title: "Hindi cinema" },
  { key: "telugu", title: "Telugu favorites" },
  { key: "tamil", title: "Tamil stories" },
  { key: "malayalam", title: "Malayalam gems" },
  { key: "kannada", title: "Kannada picks" },
  { key: "action", title: "Adrenaline rush" },
  { key: "comedy", title: "Easy laughs" },
  { key: "drama", title: "Prestige drama" },
  { key: "romance", title: "Romance lane" },
  { key: "thriller", title: "Thriller nights" },
  { key: "horror", title: "Horror vault" },
  { key: "scifi", title: "Sci-fi worlds" },
];

const demoMovies = [
  { id: "movie:101", title: "The Last Horizon", year: "2026", type: "movie", tone: "violet", language: "English" },
  { id: "movie:102", title: "Midnight Signal", year: "2025", type: "movie", tone: "blue", language: "English" },
  { id: "series:103", title: "The Long Way Home", year: "2026", type: "series", tone: "amber", language: "Hindi, English" },
  { id: "movie:104", title: "After the Monsoon", year: "2025", type: "movie", tone: "green", language: "Malayalam" },
  { id: "movie:105", title: "Neon City", year: "2026", type: "movie", tone: "pink", language: "Tamil, Telugu" },
  { id: "series:106", title: "Parallel Lines", year: "2024", type: "series", tone: "indigo", language: "Kannada" },
  { id: "movie:107", title: "Borderless", year: "2025", type: "movie", tone: "blue", language: "Hindi, Tamil" },
  { id: "movie:108", title: "The Laugh Track", year: "2024", type: "movie", tone: "amber", language: "Telugu" },
  { id: "series:109", title: "Night Market", year: "2026", type: "series", tone: "green", language: "Korean, English" },
  { id: "movie:110", title: "Signal Fire", year: "2025", type: "movie", tone: "pink", language: "English, Hindi" },
];

const categoryFallbacks = {
  english: "English",
  hindi: "Hindi",
  telugu: "Telugu",
  tamil: "Tamil",
  malayalam: "Malayalam",
  kannada: "Kannada",
  action: "English",
  comedy: "Telugu",
  drama: "Hindi",
  romance: "Tamil",
  thriller: "Korean",
  horror: "English",
  scifi: "English",
};

function getDemoMoviesForCategory(key) {
  if (key === "top10") return demoMovies.slice(0, 10);

  const language = categoryFallbacks[key];
  if (!language) return demoMovies;

  const matching = demoMovies.filter((movie) => movie.language?.includes(language));
  const rest = demoMovies.filter((movie) => !movie.language?.includes(language));
  return [...matching, ...rest];
}

const genres = [
  ["", "All genres"], ["28", "Action"], ["12", "Adventure"], ["16", "Animation"],
  ["35", "Comedy"], ["80", "Crime"], ["18", "Drama"], ["14", "Fantasy"],
  ["27", "Horror"], ["10749", "Romance"], ["878", "Sci-Fi"], ["53", "Thriller"],
];

const languages = [
  ["", "All languages"], ["en", "English"], ["hi", "Hindi"], ["te", "Telugu"],
  ["ta", "Tamil"], ["ml", "Malayalam"], ["kn", "Kannada"], ["bn", "Bengali"],
  ["mr", "Marathi"], ["ko", "Korean"], ["ja", "Japanese"],
];

function getStreamingLanguages(movie) {
  const value = movie?.language || movie?.streamLanguages || movie?.originalLanguage || "";
  return String(value)
    .split(",")
    .map((language) => language.trim())
    .filter((language) => language && language !== "N/A" && language !== "—");
}

function formatStreamingLanguages(movie) {
  const languageList = getStreamingLanguages(movie);
  return languageList.length ? languageList.join(", ") : "Language details unavailable";
}

function getTmdbId(movie) {
  return movie?.tmdbId || String(movie?.id || "").split(":").pop();
}

function hasValidTmdbId(movie) {
  return /^\d+$/.test(String(getTmdbId(movie) || ""));
}

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
  const [playerUrl, setPlayerUrl] = useState(null);
  const [playerTitle, setPlayerTitle] = useState("");
  const [playerLanguages, setPlayerLanguages] = useState("");
  const [pendingPlayback, setPendingPlayback] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [activeCategoryKey, setActiveCategoryKey] = useState(rows[0].key);
  const [browseMovies, setBrowseMovies] = useState({});
  const [browseLoadingKey, setBrowseLoadingKey] = useState("");

  useEffect(() => {
    Promise.all(rows.map(async ({ key }) => {
      try {
        const limit = key === "top10" ? 10 : 16;
        const data = await api(`/api/tmdb?mode=row&row=${key}&limit=${limit}`);
        return [key, data.results?.slice(0, limit) || []];
      } catch {
        return [key, getDemoMoviesForCategory(key)];
      }
    })).then((entries) => setHomeRows(Object.fromEntries(entries)));

    const now = new Date();
    const dailyKey = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");

    api(`/api/tmdb?mode=recent&day=${dailyKey}`)
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

  async function watchNow(movie, playback = {}) {
    if (getStreamingLanguages(movie).length || !hasValidTmdbId(movie)) {
      setPendingPlayback({ movie, playback });
      return;
    }

    setLoading(true);
    setStatus(`Checking streaming languages for ${movie.title}…`);

    try {
      const data = await api(`/api/tmdb?mode=details&id=${encodeURIComponent(movie.id)}&region=IN`);
      setPendingPlayback({ movie: { ...movie, ...data }, playback });
      setStatus("");
    } catch {
      setPendingPlayback({ movie, playback });
      setStatus("Language details are unavailable for this title right now.");
    } finally {
      setLoading(false);
    }
  }

  async function startPlayback() {
    if (!pendingPlayback) return;
    const { movie, playback } = pendingPlayback;
    setPendingPlayback(null);
    setLoading(true);
    setStatus(`Starting ${movie.title}…`);

    try {
      const tmdbId = getTmdbId(movie);

      if (!tmdbId || !/^\d+$/.test(String(tmdbId))) {
        throw new Error("This title does not have a valid TMDB ID yet. Search a live movie and try again.");
      }

      const type = movie.type === "series" || movie.type === "tv" ? "tv" : "movie";
      const params = new URLSearchParams({ type, id: String(tmdbId) });

      if (type === "tv") {
        params.set("season", String(playback.season || 1));
        params.set("episode", String(playback.episode || 1));
      }

      const episodeLabel = type === "tv"
        ? ` · S${playback.season || 1} E${playback.episode || 1}`
        : "";
      setPlayerTitle(`${movie.title}${episodeLabel}`);
      setPlayerLanguages(formatStreamingLanguages(movie));
      setPlayerUrl(`/api/player?${params.toString()}`);
      setStatus(`Playing ${movie.title}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setQuery("");
    setSuggestions([]);
    setResults([]);
    setStatus("");
    setGenre("");
    setLanguage("");
    setMediaType("movie");
    setFeaturedIndex(0);
  }

  async function openCategoryBrowser(key) {
    setBrowseOpen(true);
    setActiveCategoryKey(key);
    setBrowseMovies((current) => ({
      ...current,
      [key]: current[key] || homeRows[key] || getDemoMoviesForCategory(key),
    }));

    const limit = key === "top10" ? 10 : 40;
    setBrowseLoadingKey(key);

    try {
      const data = await api(`/api/tmdb?mode=row&row=${key}&limit=${limit}`);
      setBrowseMovies((current) => ({
        ...current,
        [key]: data.results?.length ? data.results : current[key] || [],
      }));
    } catch {
      setBrowseMovies((current) => ({
        ...current,
        [key]: current[key] || homeRows[key] || getDemoMoviesForCategory(key),
      }));
    } finally {
      setBrowseLoadingKey("");
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
    : rows.map((row) => ({
      ...row,
      movies: homeRows[row.key] || getDemoMoviesForCategory(row.key),
    }));

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
          onWatch={watchNow}
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
            <button className="clear-all" type="button" onClick={clearAll}>Clear all</button>
          </form>
        </section>

        {status && <div className="status-line"><span />{status}</div>}

        <div className="shelves">
          {visibleSections.map((section) => (
            <MovieShelf
              key={section.key} section={section} movies={section.movies}
              favorites={favoriteIds} onDetails={openDetails} onFavorite={toggleFavorite} onWatch={watchNow}
              onViewAll={section.key === "results" ? null : openCategoryBrowser}
            />
          ))}
        </div>

        <AboutSection />
      </main>

      <footer><div className="logo"><b>M</b> MovieFinder</div><p>Find the story that stays with you.</p><span>Akshay@Codex</span></footer>

      {selected && <DetailsModal movie={{ ...selected, ...details }} loading={!details} onClose={() => setSelected(null)} onFavorite={toggleFavorite} onWatch={watchNow} saved={favoriteIds.has(selected.id)} />}
      {showFavorites && <FavoritesModal movies={favorites} onClose={() => setShowFavorites(false)} onDetails={openDetails} onFavorite={toggleFavorite} onWatch={watchNow} favorites={favoriteIds} />}
      {aiOpen && <AiModal prompt={aiPrompt} setPrompt={setAiPrompt} onSubmit={askAi} onClose={() => setAiOpen(false)} loading={loading} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onUser={(next) => { setUser(next); localStorage.setItem("movieFinderUser", JSON.stringify(next)); }} />}
      {browseOpen && <AllCategoriesModal
        rows={rows}
        homeRows={homeRows}
        moviesByCategory={browseMovies}
        activeKey={activeCategoryKey}
        loadingKey={browseLoadingKey}
        favorites={favoriteIds}
        onCategoryChange={openCategoryBrowser}
        onClose={() => setBrowseOpen(false)}
        onDetails={openDetails}
        onFavorite={toggleFavorite}
        onWatch={watchNow}
      />}
      {pendingPlayback && <StreamDisclaimer movie={pendingPlayback.movie} onCancel={() => setPendingPlayback(null)} onContinue={startPlayback} />}
      {playerUrl && <PlayerModal
        title={playerTitle}
        languages={playerLanguages}
        url={playerUrl}
        onClose={() => {
          setPlayerUrl(null);
          setPlayerTitle("");
          setPlayerLanguages("");
        }}
      />}
    </div>
  );
}

function Header({ query, setQuery, suggestions, onSearch, onSelectSuggestion, favorites, onFavorites, onAi, onAuth, user }) {
  return <header className="topbar">
    <a className="logo" href="#top"><b>M</b><span>MovieFinder</span></a>
    <nav><a href="#discover">Discover</a><a href="#about">About us</a><button onClick={onAi}>AI Concierge</button><button onClick={onFavorites}>My list <i>{favorites}</i></button></nav>
    <form className="nav-search" onSubmit={onSearch}>
      <span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles…" aria-label="Search movies" />
      {suggestions.length > 0 && <div className="suggestion-popover">
        {suggestions.map((movie) => <button type="button" key={movie.id} onClick={() => onSelectSuggestion(movie)}><span>{movie.title}</span><small>{movie.year}</small></button>)}
      </div>}
    </form>
    <button className="avatar" onClick={onAuth} title={user?.email || "Sign in"}>{user?.email?.[0]?.toUpperCase() || "A"}</button>
  </header>;
}

function Hero({ movie, index, count, onSelect, onWatch, onDetails, onFavorite, saved }) {
  return <section id="top" className="hero" style={movie.backdrop ? { "--hero-image": `url(${movie.backdrop})` } : {}}>
    <div className="hero-content">
      <div className="hero-badge"><span /> DAILY PREMIERE · UPDATED TODAY</div>
      <h1>{movie.title}</h1>
      <div className="hero-meta"><strong>98% Match</strong><span>{movie.year}</span><em>{movie.type}</em><span>4K</span></div>
      <p>{movie.plot || "Some stories entertain you. Others follow you home. Discover remarkable films and series selected for your next movie night."}</p>
      <div className="hero-actions">
        <button className="primary" onClick={() => onWatch(movie)}>▶ Watch now</button>
        <button className="glass" onClick={() => onDetails(movie)}>More info</button>
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

function MovieShelf({ section, movies, favorites, onDetails, onFavorite, onWatch, onViewAll }) {
  const isTrending = section.key === "top";
  const isTopTen = section.key === "top10";

  return <section className="shelf" id={section.key === "top10" ? "discover" : `category-${section.key}`}>
    <div className="shelf-heading">
      <h2>{section.title}{isTrending && <span className="live-pill">LIVE</span>}{isTopTen && <span className="live-pill top10-pill">TOP 10</span>}</h2>
      {onViewAll && <button type="button" onClick={() => onViewAll(section.key)}>View all <span>→</span></button>}
    </div>
    <div className={`movie-row ${isTopTen ? "top-ten-row" : ""}`}>
      {movies.map((movie, index) => <MovieCard
        key={`${movie.id}-${index}`}
        movie={movie}
        rank={isTrending || isTopTen ? index + 1 : null}
        topTen={isTopTen}
        saved={favorites.has(movie.id)}
        onDetails={onDetails}
        onFavorite={onFavorite}
        onWatch={onWatch}
      />)}
    </div>
  </section>;
}

function MovieCard({ movie, rank, topTen = false, saved, onDetails, onFavorite, onWatch }) {
  const [primaryLanguage] = getStreamingLanguages(movie);

  return <article className={`movie-card tone-${movie.tone || "blue"} ${topTen ? "top-ten-card" : ""}`}>
    {topTen && rank && <span className="top-ten-number">{rank}</span>}
    <div className="poster-wrap">
      {rank && !topTen && <span className="trend-rank">#{rank} Trending</span>}
      <button className="poster-button" onClick={() => onDetails(movie)} aria-label={`View ${movie.title}`}>
        {movie.poster && movie.poster !== "N/A" ? <img src={movie.poster} alt="" loading="lazy" /> : <div className="poster-fallback"><b>{movie.title}</b><span>MovieFinder original</span></div>}
        <div className="card-overlay"><span className="play">▶</span><p>{movie.year} · {movie.type}</p></div>
      </button>
      <button className="card-watch-now" onClick={() => onWatch(movie)} type="button">▶ Watch Now</button>
    </div>
    <div className="card-caption"><div><h3>{movie.title}</h3><p>{movie.year} · {movie.type}{primaryLanguage ? ` · ${primaryLanguage}` : ""}</p></div><button className={saved ? "saved" : ""} onClick={() => onFavorite(movie)}>{saved ? "✓" : "+"}</button></div>
  </article>;
}

function DetailsModal({ movie, loading, onClose, onFavorite, onWatch, saved }) {
  const providers = movie.watchProviders || {};
  const allProviders = [...(providers.stream || []), ...(providers.rent || []), ...(providers.buy || [])]
    .filter((provider, index, array) => array.findIndex((item) => item.id === provider.id) === index);
  const streamingLanguages = getStreamingLanguages(movie);

  return <div className="modal-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="details-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="details-backdrop" style={movie.backdrop ? { backgroundImage: `linear-gradient(0deg,#111 0%,transparent 80%),url(${movie.backdrop})` } : {}}>
        <div><span className="kicker">{movie.type}</span><h2>{movie.title}</h2><p>{movie.year} · {movie.genre || "Featured"} · TMDB {movie.imdbRating || "—"}</p></div>
      </div>
      <div className="details-body">
        {loading ? <div className="modal-loading">Loading the full story…</div> : <>
          {movie.trailerKey && <section className="embedded-trailer" aria-label={`${movie.title} official trailer`}>
            <div className="trailer-heading"><span className="kicker">OFFICIAL TRAILER</span><a href={movie.trailerUrl} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div>
            <div className="trailer-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?rel=0`}
                title={`${movie.title} official trailer`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>}
          <div className="details-copy"><p>{movie.plot || "Story details are coming soon."}</p><div className="detail-actions">
            <button className="primary" onClick={() => onWatch(movie)}>▶ Watch Now</button>
            {!movie.trailerKey && <a className="primary button-link" href={`https://youtube.com/results?search_query=${encodeURIComponent(movie.title + " official trailer")}`} target="_blank" rel="noreferrer">▶ Find trailer</a>}
            <button className="glass" onClick={() => onFavorite(movie)}>{saved ? "✓ Saved" : "+ My list"}</button>
          </div><dl><div><dt>Cast</dt><dd>{movie.actors || "Details unavailable"}</dd></div><div><dt>Director / Creator</dt><dd>{movie.director || "Details unavailable"}</dd></div></dl></div>
          <aside className="watch-panel"><span className="kicker">WHERE TO WATCH · INDIA</span><h3>Available on</h3>
            {allProviders.length ? <div className="providers">{allProviders.map((provider) => <div key={provider.id}>{provider.logo ? <img src={provider.logo} alt="" /> : <b>{provider.name[0]}</b>}<span>{provider.name}</span></div>)}</div> : <p className="provider-empty">Streaming availability isn’t listed for this title yet.</p>}
            <div className="language-panel">
              <span>Streaming languages</span>
              <strong>{streamingLanguages.length ? streamingLanguages.join(", ") : "Not listed yet"}</strong>
            </div>
            {providers.link && <a className="provider-watch" href={providers.link} target="_blank" rel="noreferrer">Watch now on a provider ↗</a>}
          </aside>
          {movie.type === "series" && Array.isArray(movie.seasons) && movie.seasons.length > 0 && <SeriesBrowser movie={movie} onWatch={onWatch} />}
        </>}
      </div>
    </section>
  </div>;
}

function SeriesBrowser({ movie, onWatch }) {
  const firstSeason = String(movie.seasons?.[0]?.season || "1");
  const [season, setSeason] = useState(firstSeason);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonStatus, setSeasonStatus] = useState("Loading episodes…");

  useEffect(() => {
    const available = (movie.seasons || []).map((item) => String(item.season));
    if (!available.includes(season)) setSeason(available[0] || "1");
  }, [movie.id, movie.seasons, season]);

  useEffect(() => {
    let active = true;
    setSeasonData(null);
    setSeasonStatus("Loading episodes…");

    api(`/api/tmdb?mode=season&id=${encodeURIComponent(movie.id)}&season=${encodeURIComponent(season)}`)
      .then((data) => {
        if (!active) return;
        setSeasonData(data);
        setSeasonStatus(data.episodes?.length ? "" : "No episode information is available.");
      })
      .catch((error) => {
        if (active) setSeasonStatus(error.message || "Could not load this season.");
      });

    return () => { active = false; };
  }, [movie.id, season]);

  return <section className="series-browser">
    <div className="series-heading">
      <div><span className="kicker">EPISODE GUIDE</span><h3>{movie.totalSeasons || movie.seasons.length} seasons</h3></div>
      <label>Season
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          {movie.seasons.map((item) => <option key={item.season} value={item.season}>{item.title || `Season ${item.season}`}</option>)}
        </select>
      </label>
    </div>
    {seasonStatus && <div className="season-status">{seasonStatus}</div>}
    {seasonData?.overview && <p className="season-overview">{seasonData.overview}</p>}
    {seasonData?.episodes?.length > 0 && <div className="episode-list">
      {seasonData.episodes.map((episode) => <article className="episode-card" key={episode.number}>
        <div className="episode-still">
          {episode.still ? <img src={episode.still} alt="" loading="lazy" /> : <span>Episode {episode.number}</span>}
          <b>{String(episode.number).padStart(2, "0")}</b>
        </div>
        <div className="episode-copy">
          <div className="episode-title"><h4>{episode.title}</h4><span>TMDB {episode.rating}</span></div>
          <p>{episode.overview || "Episode description is unavailable."}</p>
          <div className="episode-footer">
            <small>{episode.released} · {episode.runtime}</small>
            <button
              className="episode-play"
              type="button"
              onClick={() => onWatch(movie, { season: Number(season), episode: episode.number })}
              aria-label={`Watch ${movie.title}, season ${season}, episode ${episode.number}`}
            >
              ▶ Watch now
            </button>
          </div>
        </div>
      </article>)}
    </div>}
  </section>;
}

function FavoritesModal({ movies, onClose, onDetails, onFavorite, onWatch, favorites }) {
  return <div className="modal-layer"><section className="list-modal"><button className="modal-close" onClick={onClose}>×</button><span className="kicker">YOUR COLLECTION</span><h2>My list</h2>
    {movies.length ? <div className="favorite-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} saved={favorites.has(movie.id)} onDetails={(item) => { onClose(); onDetails(item); }} onFavorite={onFavorite} onWatch={onWatch} />)}</div> : <div className="empty-list">Your list is waiting for its first great story.</div>}
  </section></div>;
}

function AllCategoriesModal({ rows, homeRows, moviesByCategory, activeKey, loadingKey, favorites, onCategoryChange, onClose, onDetails, onFavorite, onWatch }) {
  const activeRow = rows.find((row) => row.key === activeKey) || rows[0];
  const movies = moviesByCategory[activeRow.key] || homeRows[activeRow.key] || getDemoMoviesForCategory(activeRow.key);
  const isTopTen = activeRow.key === "top10";

  return <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="category-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <div className="category-modal-header">
        <span className="kicker">ALL CATEGORIES</span>
        <h2>{activeRow.title}</h2>
        <p>{isTopTen ? "The ten strongest picks for instant movie-night browsing." : "Browse a full card grid for this category."}</p>
      </div>
      <div className="category-tabs" aria-label="Movie categories">
        {rows.map((row) => <button
          key={row.key}
          type="button"
          className={row.key === activeRow.key ? "active" : ""}
          onClick={() => onCategoryChange(row.key)}
        >
          {row.title}
        </button>)}
      </div>
      {loadingKey === activeRow.key && <div className="category-loading">Loading more cards…</div>}
      <div className={`category-grid ${isTopTen ? "category-grid-top10" : ""}`}>
        {movies.map((movie, index) => <MovieCard
          key={`${activeRow.key}-${movie.id}-${index}`}
          movie={movie}
          rank={isTopTen ? index + 1 : null}
          topTen={isTopTen}
          saved={favorites.has(movie.id)}
          onDetails={onDetails}
          onFavorite={onFavorite}
          onWatch={onWatch}
        />)}
      </div>
    </section>
  </div>;
}

function AboutSection() {
  return <section id="about" className="about-us">
    <div>
      <span className="kicker">ABOUT US</span>
      <h2>MovieFinder is built for fast, confident watch decisions.</h2>
    </div>
    <p>We combine live movie data, AI discovery, regional categories, provider availability, trailers, favorites, and streaming-language details so every title feels easier to choose before you press play.</p>
    <div className="about-stats">
      <span><strong>Top 10</strong> daily picks</span>
      <span><strong>15</strong> browse categories</span>
      <span><strong>Languages</strong> before streaming</span>
    </div>
  </section>;
}

function AiModal({ prompt, setPrompt, onSubmit, onClose, loading }) {
  return <div className="modal-layer"><section className="ai-modal"><button className="modal-close" onClick={onClose}>×</button><div className="ai-orb">✦</div><span className="kicker">AI CONCIERGE</span><h2>Tell us the vibe.</h2><p>Describe a mood, language, occasion, or the kind of story you want tonight.</p>
    <form onSubmit={onSubmit}><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A clever Hindi thriller for a rainy night…" maxLength="400" autoFocus /><button className="primary" disabled={loading}>{loading ? "Curating…" : "Find my movie ✦"}</button></form>
  </section></div>;
}

function StreamDisclaimer({ movie, onCancel, onContinue }) {
  const languages = formatStreamingLanguages(movie);

  return <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="stream-disclaimer" role="dialog" aria-modal="true" aria-labelledby="stream-disclaimer-title">
      <div className="notice-icon">!</div>
      <span className="kicker">BEFORE YOU WATCH</span>
      <h2 id="stream-disclaimer-title">Safer, smoother playback</h2>
      <p className="stream-disclaimer-intro">This third-party player may display ads. These steps help reduce interruptions:</p>
      <ol className="stream-tutorial">
        <li><strong>Keep protection on.</strong><span>Enable your browser’s popup blocker and a trusted content blocker before continuing.</span></li>
        <li><strong>Use the real player controls.</strong><span>Ignore banners, download buttons, and prompts that appear outside the video controls.</span></li>
        <li><strong>Close unwanted tabs.</strong><span>If another page opens, close it and return to the MovieFinder player.</span></li>
        <li><strong>Go fullscreen after playback starts.</strong><span>Press <kbd>F</kbd> on a computer or use the Full screen button on mobile.</span></li>
      </ol>
      <div className="stream-language-card">
        <span>Streaming languages</span>
        <strong>{languages}</strong>
        <small>Provider audio and subtitle menus can vary by region.</small>
      </div>
      <small>You’re about to open <strong>{movie.title}</strong>.</small>
      <div className="notice-actions">
        <button className="glass" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary" type="button" onClick={onContinue}>Continue to stream ▶</button>
      </div>
    </section>
  </div>;
}

function PlayerModal({ title, languages, url, onClose }) {
  const playerRef = useRef(null);

  async function toggleFullscreen() {
    const player = playerRef.current;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (player?.requestFullscreen) {
        await player.requestFullscreen();
      } else if (player?.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      }
    } catch {
      // Mobile Safari may only allow the provider's own video fullscreen button.
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (event.key.toLowerCase() !== "f" || event.repeat || ["input", "textarea", "select"].includes(tagName)) return;
      event.preventDefault();
      toggleFullscreen();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function closePlayer() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    onClose();
  }

  return <div className="modal-layer player-layer" onMouseDown={(event) => event.target === event.currentTarget && closePlayer()}>
    <section className="player-modal" ref={playerRef}>
      <button className="modal-close" type="button" onClick={closePlayer}>×</button>
      <div className="player-header">
        <div>
          <span className="kicker">NOW PLAYING</span>
          <h2>{title || "Movie player"}</h2>
          <p className="player-languages">Languages: {languages || "Not listed"}</p>
        </div>
        <button className="player-fullscreen" type="button" onClick={toggleFullscreen}>⛶ Full screen <kbd>F</kbd></button>
      </div>
      <div className="player-frame">
        <iframe
          src={url}
          title={title || "Movie player"}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
        />
      </div>
    </section>
  </div>;
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
