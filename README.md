# MovieFinder React

A cinematic React movie and TV discovery experience powered by TMDB, OpenAI, and Supabase.

## Features

- Responsive React interface built with Vite
- Featured movie hero and horizontal discovery shelves
- Netflix-style Top 10 recommendations and full category browsing
- Live TMDB search and suggestions
- Genre, language, and movie/series filters
- AI-powered natural-language recommendations
- Detailed cast, seasons, trailers, and ratings
- Streaming-language visibility before playback
- Country-aware **Where to Watch** streaming providers
- Local favorites collection
- Optional Supabase email-code authentication
- Graceful preview content when APIs are unavailable locally

## Run locally

```bash
npm install
npm run dev
```

The local Vite preview renders the interface, but serverless API routes require Vercel development mode or deployment.

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## Environment variables

Add these to Vercel under **Project Settings → Environment Variables**:

```text
TMDB_API_KEY=your_tmdb_api_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

The Supabase values are optional; guest browsing works without them. Never commit real keys to GitHub.

## Deploy to Vercel

1. Upload the project files to the root of a GitHub repository.
2. Import or reconnect the repository in Vercel.
3. Keep the framework preset as Vite or Other.
4. Vercel uses `npm run build` and publishes `dist/` from `vercel.json`.
5. Add the environment variables above.
6. Deploy.

## Important

MovieFinder does not host or stream copyrighted content. Trailer links open YouTube, and watch-provider availability comes from TMDB.
