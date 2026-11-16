# Wavelength — Music Streaming Landing Page

A single-page, responsive landing page for a Spotify-style music streaming
platform. Dark theme, glassmorphism cards, animated sound waves, a working
search/preview demo, and a login/signup flow — all static HTML/CSS/vanilla JS,
no build step, no backend required.

## Files

- `index.html` — page structure (navbar, hero, features, search, social proof, footer)
- `style.css` — design system, layout, animations, responsive breakpoints
- `script.js` — all interactivity (search filtering, audio preview, auth modal, counters, scroll effects, generative artist/album art)
- `vercel.json` — tells Vercel this is a static site (no build command needed)

## 1. Push to GitHub

Open a terminal in this folder and run:

```bash
git init
git add .
git commit -m "Initial commit: Wavelength landing page"
git branch -M main
git remote add origin https://github.com/<your-username>/music_website.git
git push -u origin main
```

Replace `<your-username>` with your GitHub username, and make sure you've
already created an **empty** repository named `music_website` on GitHub first
(no README/license initialized there, so the push doesn't conflict).

## 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Click **Import** next to the `music_website` repo.
3. Framework Preset: choose **Other** (it's a static site — no framework, no build command, no output directory needed).
4. Click **Deploy**.

Vercel will give you a live URL (something like `music-website.vercel.app`)
within about a minute. Every future `git push` to `main` auto-redeploys it.

## Notes

- All interactivity is client-side only — the search results, audio previews,
  and login/signup are a front-end demo (no real backend/database), so
  behavior resets per browser/device.
- Album art and artist portraits are generated on canvas at runtime (seeded,
  so they stay consistent), not pulled from external images — nothing here
  depends on an external image host or API.
