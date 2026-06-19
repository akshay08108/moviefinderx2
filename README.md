# Movie Finder

A Netflix-inspired movie and TV discovery web app powered by the TMDB API. The app lets users search movies and shows, view trending and curated rows, inspect cast/details, browse series seasons, save favorites locally, and open official trailer links on YouTube.

## Features

- Dark Netflix-style interface
- Live search recommendations while typing
- Trending/top movie row
- Recently released movies in the hero panel
- Movies by language: Hindi, Telugu, Tamil
- Movies by genre: Action, Drama, Comedy
- Details modal with plot, rating, runtime, release date, language, creator/director, and cast
- Series season overview
- Favorites saved in the browser with `localStorage`
- Trailer button opens a TMDB-provided YouTube trailer when available
- API key stays server-side in Vercel environment variables
- AI movie concierge converts natural-language requests into real TMDB recommendations
- Featured movie banner with rotating now-playing titles
- Genre, language, and movie/series discovery filters
- Optional passwordless email sign-in through Supabase

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Vercel Serverless Functions
- TMDB API

## Local Setup

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your TMDB key:

```text
TMDB_API_KEY=your_tmdb_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

For Vercel deployment, local server setup is not required. If you want to preview the static files only, you can use any simple static server.

The TMDB API route runs on Vercel as `/api/tmdb`.

## Deploy To Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Keep the Vercel framework preset as **Other**.
4. Use `npm run build` as the build command (Vercel also reads this from `vercel.json`).
5. Use `public` as the output directory (also configured in `vercel.json`).
6. In Vercel, open **Project Settings > Environment Variables**.
7. Add:

```text
TMDB_API_KEY=your_tmdb_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

8. Deploy.

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are optional. Without them, the app remains fully usable in guest mode. To use 6-digit email codes, enable email OTP in your Supabase authentication settings and configure the email template to include the token.

## Project Description

Movie Finder is a streaming-style discovery interface for movies and TV shows. It uses TMDB data to provide modern browsing rows, search suggestions, detailed title pages, cast information, series season data, favorites, and trailer links in a clean Netflix-inspired design.

## Notes

- This app does not host or stream copyrighted movies/shows.
- Trailer buttons open YouTube trailer links.
- `.env.local` is ignored by Git and should never be committed.
