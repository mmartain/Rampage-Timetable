# Rampage Timetable

English-only festival timetable for **Rampage Open Air 2026**, rebuilt as a Vite PWA for GitHub Pages.

Forked from [Mart1n23/Rampage-tables-du-temps](https://github.com/Mart1n23/Rampage-tables-du-temps).

## Features

- Day schedule with main and secondary stages
- Favorites across stages
- Fullscreen / wallpaper mode
- Offline schedule cache (localStorage + service worker)
- First-run help overlay
- Installable PWA

## Data source

Schedule data is loaded from the original author's public Google Sheet CSV export. If that sheet becomes unavailable, the last cached copy is shown.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Push to `main`.
2. Enable **Settings → Pages → Source: GitHub Actions**.
3. The workflow builds with `base` set to `/your-repo-name/`.

For a user site (`username.github.io`), set `BASE_PATH=/` in the deploy workflow.

## License

See original repository for licensing. Festival branding belongs to Rampage Open Air.
