# Fusible Beads Studio

**English** · [简体中文](./README.zh-CN.md)

Turn any image into a fusible‑bead (Perler / Hama / Artkal) pattern — entirely in your browser.
Upload a picture, convert it to a bead grid, fine‑tune each bead, then export a high‑res PNG or a
print‑ready PDF with a numbered material list.

[Live demo](https://yourlin.github.io/Fusible-Beads-Studio/)

## Features

- **Supported image formats** — PNG, JPG/JPEG, WebP, GIF, BMP, and SVG (SVG is rasterized locally).
- **Local conversion** — `createImageBitmap` → offscreen Canvas (nearest‑neighbour, aspect‑preserving)
  → per‑pixel nearest color via **CIEDE2000** matching. No network requests.
- **Optional dithering** — Floyd–Steinberg error diffusion for smoother gradients.
- **Background removal** — drop near‑white / transparent pixels as empty beads.
- **Interactive editor** — brush, eraser (restore original), paint bucket (iterative flood fill),
  eyedropper and a pan/hand tool. Undo/redo (depth 50).
- **Canvas viewer** — anchored wheel zoom, drag & two‑finger pan, viewport culling,
  devicePixelRatio aware, multi‑board divider lines, hover tooltip, zoom slider with a 100% detent.
- **Color numbering** — used colors get legend numbers shown on the palette, on every bead,
  in the material list, and in exports (all consistent).
- **Exports** — high‑res PNG (with legend) and single‑page PDF (vector dots + numbers + material list).
- **i18n** — English / 中文, persisted locally.
- **Board presets** — single 29×29, quad 58×58, horizontal 87×29.
- **Palettes** — Generic 48, Perler, Artkal.

## Tech stack

- **Frontend:** Vue 3 + Vuetify 3 + Vite + TypeScript + Pinia + vue-router + vue-i18n
- **Shared logic:** `@pindou/shared` — palettes + CIEDE2000 color matching (framework‑agnostic)
- **PDF:** jsPDF (vector); **PNG:** offscreen Canvas
- **Infra:** AWS CDK (S3 + CloudFront, private bucket + OAC) — optional, for AWS hosting
- **Tests:** Vitest (unit) + Playwright (e2e)
- **Monorepo:** pnpm workspaces

## Project structure

```
.
├── packages/
│   ├── shared/     # types, palettes, color/{convert,ciede2000,match}
│   ├── frontend/   # Vue app: stores, composables, components, views, utils
│   └── infra/      # AWS CDK stack (optional alternative to GitHub Pages)
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
└── pnpm-workspace.yaml
```

## Getting started

Requires Node 20+ and pnpm 10+.

```bash
pnpm install

# dev server (http://localhost:5173)
pnpm dev:frontend

# unit tests (shared + frontend + infra)
pnpm test

# lint
pnpm lint

# production build (all packages)
pnpm build
```

### End‑to‑end tests

```bash
pnpm --filter @pindou/frontend exec playwright install chromium
pnpm --filter @pindou/frontend exec playwright test
```

## Deployment

### GitHub Pages (automatic)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the frontend with the
project base path `/Fusible-Beads-Studio/` and publishes `packages/frontend/dist` to GitHub Pages.

One‑time setup in the GitHub repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The app is a SPA; the workflow copies `index.html` to `404.html` so deep links resolve correctly.

### AWS (optional)

```bash
pnpm --filter @pindou/infra synth      # synthesize CloudFormation
pnpm --filter @pindou/infra exec cdk deploy
```

Provisions a private S3 bucket served through CloudFront with Origin Access Control and SPA routing.

## License

MIT
