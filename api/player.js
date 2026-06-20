export default function handler(req, res) {
  const { type = "movie", id, season = "1", episode = "1" } = req.query;

  if (!id || !/^\d+$/.test(String(id))) {
    return res.status(400).json({ error: "Missing or invalid TMDB ID." });
  }

  const apiKey = process.env.CODESPECTERS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing CODESPECTERS_API_KEY." });
  }

  const baseUrl = "https://api.codespecters.com/embed";
  const safeType = type === "tv" || type === "series" ? "tv" : "movie";

  const embedUrl = safeType === "tv"
    ? `${baseUrl}/tv/${id}/${season}/${episode}?apikey=${encodeURIComponent(apiKey)}`
    : `${baseUrl}/movie/${id}?apikey=${encodeURIComponent(apiKey)}`;

  res.setHeader("Cache-Control", "no-store");
  return res.redirect(302, embedUrl);
}
