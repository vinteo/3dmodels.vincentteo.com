# 3D Models Customizer & Exporter (3dmodels.vincentteo.com)

[![CI](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/ci.yml/badge.svg)](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/ci.yml)
[![Super-Linter](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/super-linter.yml/badge.svg)](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/super-linter.yml)
[![Frontend Deploy](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/deploy-frontend.yml)
[![Backend Deploy](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/vinteo/3dmodels.vincentteo.com/actions/workflows/deploy-backend.yml)

An interactive, web-based 3D CAD customizer that connects to **Onshape Part Studios** as a parametric source, renders real-time 3D previews in the browser, and exports customized models as **STL** (for 3D printing) and **STEP** (for CNC & CAD) files.

Designed and styled to seamlessly match the signature aesthetic of [vincentteo.com](https://vincentteo.com/) (`#120e25` deep space background, glowing ambient lights, playful button interactions, Outfit & Inter typography, and slate/fuchsia/violet accents).

---

## Key Features

- **Non-Destructive Onshape Integration**: Queries parametric configurations on-the-fly via Onshape REST API. The master CAD document is **never altered or branched**.
- **Real-Time 3D Viewport**: Interactive WebGL rendering powered by **Three.js** featuring OrbitControls, studio lighting with neon rim highlights, wireframe mode, ground grid, camera reset, and fullscreen view.
- **Dynamic Parameter Controls**: Interactive sliders, unit tags (mm/in), enum option pickers, boolean toggles, and dirty-state detection with an optional live auto-update preview.
- **Direct CAD Exports**:
  - **STL**: Binary or ASCII, millimeter or inch (ready for Bambu Studio, PrusaSlicer, Cura, OrcaSlicer).
  - **STEP**: AP242 / AP214 / AP203 boundary representation solids (ready for SolidWorks, Fusion 360, FreeCAD, CAM).
- **Multi-Model Catalog**: Easily configure new Onshape models via `config/models.config.json`.
- **Cloudflare Workers API Proxy**: Securely isolates Onshape API keys, caches repeat queries, and handles translation polling.
- **Offline / Mock Mode Fallback**: Immediate local development and testing even without Onshape credentials.
- **Dev Container & CI/CD**: Ready-to-go VS Code dev container and complete GitHub Actions workflows for linting, unit testing (Vitest), end-to-end testing (Playwright), and automated deployments.

---

## Project Structure

```text
3dmodels.vincentteo.com/
├── .devcontainer/               # VS Code / Codespaces Dev Container
│   └── devcontainer.json
├── .github/
│   └── workflows/
│       ├── ci.yml               # Vitest + Playwright E2E testing
│       ├── deploy-frontend.yml  # Deploy React Vite app to GitHub Pages
│       └── deploy-backend.yml   # Deploy Cloudflare Worker via Wrangler
├── config/
│   └── models.config.json       # Configurable Onshape models catalog
├── packages/
│   ├── backend/                 # Cloudflare Workers API Proxy (Hono + TypeScript)
│   │   ├── src/
│   │   │   ├── config/models.ts # Model registry & configuration encoder
│   │   │   ├── onshape/         # Onshape API client, translations & mock engine
│   │   │   ├── routes/          # /api/models, /preview, /export
│   │   │   └── index.ts         # Worker entrypoint with CORS
│   │   ├── tests/               # Backend unit & endpoint tests
│   │   └── wrangler.jsonc       # Cloudflare Wrangler configuration
│   └── frontend/                # React 18 + Tailwind CSS v4 + Three.js
│       ├── src/
│       │   ├── components/      # Header, Viewer, ParameterControls, ExportModal
│       │   ├── services/        # API client
│       │   ├── App.tsx          # Main customizer UI
│       │   └── index.css        # Tailwind v4 theme & playful-btn styles
│       ├── index.html           # Google Fonts & SEO tags
│       └── vite.config.ts       # Vite configuration with local proxy
├── e2e/                         # Playwright End-to-End test suite
├── playwright.config.ts         # Playwright configuration
├── package.json                 # Monorepo scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm)

### Option 1: Using Dev Container (Recommended)

Open this repository in **VS Code** with the **Dev Containers** extension installed. When prompted, click **Reopen in Container**. The container will automatically install all dependencies, configure Playwright, and forward ports `5173` (Frontend) and `8787` (Backend).

### Option 2: Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/vinteo/3dmodels.vincentteo.com.git
   cd 3dmodels.vincentteo.com
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):

   - Copy `.env.example` to `.env`:

     ```bash
     cp .env.example .env
     ```

   - For local live Onshape connection, create `packages/backend/.dev.vars`:

     ```ini
     ONSHAPE_ACCESS_KEY=your_access_key
     ONSHAPE_SECRET_KEY=your_secret_key
     ```

   _(If omitted, the app automatically runs in Mock Demo Mode with procedural 3D models)._

4. Start the local development server:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - Cloudflare Worker: `http://localhost:8787`

---

## Adding New Models to the Catalog

Add a new entry to `config/models.config.json`:

```json
{
  "id": "my-custom-bracket",
  "name": "Heavy-Duty Corner Bracket",
  "description": "Reinforced structural angle bracket.",
  "documentId": "your_onshape_document_id",
  "workspaceId": "your_onshape_workspace_id",
  "elementId": "your_onshape_element_id",
  "elementType": "partstudio",
  "tags": ["Hardware", "Mechanical"],
  "defaultConfiguration": "Length=80+millimeter;Thickness=4+millimeter",
  "parameters": [
    {
      "id": "Length",
      "name": "Bracket Length",
      "type": "quantity",
      "unit": "millimeter",
      "default": 80,
      "min": 40,
      "max": 160,
      "step": 5
    }
  ]
}
```

---

## Testing & Quality Assurance

### Run Unit & Integration Tests (Vitest)

```bash
npm run test
```

### Run TypeScript Typechecking

```bash
npm run typecheck
```

### Run End-to-End Tests (Playwright)

```bash
# Install browser binaries if running for the first time
npx playwright install --with-deps chromium

# Run all E2E tests
npm run test:e2e
```

---

## Production Deployment

### 1. Backend (Cloudflare Workers)

Configured via `.github/workflows/deploy-backend.yml`. Add the following GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers permission.
- `ONSHAPE_ACCESS_KEY`: Onshape Developer Portal Access Key.
- `ONSHAPE_SECRET_KEY`: Onshape Developer Portal Secret Key.

### 2. Frontend (GitHub Pages)

Configured via `.github/workflows/deploy-frontend.yml`:

- Set repository secret `VITE_API_URL` to your production Cloudflare Worker URL (e.g. `https://3dmodels-backend.<subdomain>.workers.dev`).
- Enable GitHub Pages in repository settings pointing to **GitHub Actions**.
- Configures custom domain `3dmodels.vincentteo.com` with `CNAME` and SPA 404 redirect.

---

## License

MIT © [Vincent Teo](https://vincentteo.com/)
