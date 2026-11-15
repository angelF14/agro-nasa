# 04. Setup, Development, and Deployment

[← Back to Introductory README](../README.md) · [← Agronomic Engine and SI](./03-agronomic-engine-and-superintelligence.md)

Practical guide to running **AgroHelper** locally, regenerating the crop catalog, running unit tests, and deploying to Vercel.

---

## 1. Prerequisites

- **Node.js:** `v22.x` (configured in `.vercel/project.json`; compatible with Node `20+` supporting `--experimental-strip-types` for TypeScript utility scripts).
- **npm:** bundled with Node.js.
- **Google Gemini API Key (optional for the climate/rotation dashboard, required for the AI assistant):**  
  Available free of charge at [Google AI Studio](https://aistudio.google.com/apikey).

---

## 2. Installation and Environment Variables

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/angelF14/agro-nasa.git
   cd agro-nasa
   npm install
   ```

2. Configure environment variables by copying `.env.example` to `.env` (or `.env.local`):
   ```env
   # Get your free API key at Google AI Studio: https://aistudio.google.com/apikey
   # On Vercel: Project Settings -> Environment Variables -> add GEMINI_API_KEY (Production, Preview, Development)
   GEMINI_API_KEY=your_google_ai_studio_key
   # Default free-tier model (automatic fallback: gemini-3.5-flash-lite)
   GEMINI_MODEL=gemini-3.6-flash
   ```
   > **Note:** The backend also checks `GOOGLE_API_KEY` and `NG_APP_GEMINI_API_KEY` if already set. Without a key, the map, NASA POWER climate analysis, Open-Meteo forecast, and 3-cycle rotation planner still work normally, while `/api/agronomist/status` reports `configured: false`.

---

## 3. Available Scripts (`package.json`)

| Command | Action | Primary Use |
| :--- | :--- | :--- |
| `npm start` (`ng serve`) | Starts the Angular dev server at `http://localhost:4200/` | Fast UI and client-service development (`/api/agronomist/*` requires the SSR server or Vercel dev). |
| `npm run build` (`ng build`) | Builds the Angular browser & SSR bundles into `dist/agro-nasa/` | Production build verification and prerequisite for `serve:ssr:agro-nasa`. |
| `npm run serve:ssr:agro-nasa` | Runs `node dist/agro-nasa/server/server.mjs` (port `PORT` or `4000`) | Runs the full app locally including Express SSR and `/api/agronomist/*` endpoints. |
| `npm run watch` | Builds in watch mode (`--watch --configuration development`) | Continuous compilation during development. |
| `npm test` (`ng test`) | Runs Karma + Jasmine unit tests | Verifies `rotation-engine.service.spec.ts`, `agronomist-ai.service.spec.ts`, `agronomist-query-parser.utils.spec.ts`, `crop-selector.spec.ts`, `agronomist-assistant.spec.ts`, `app.spec.ts`. |
| `npm run parsecrops:csv` | Runs `node --experimental-strip-types scripts/convert-ecocrop.ts` | Regenerates `public/data/crops.json` from `src/app/data/EcoCrop_DB.csv`. |

### Recommended Local Full-Stack Run (Including Gemini Assistant)
```bash
npm run build
npm run serve:ssr:agro-nasa
```
Then open `http://localhost:4000/` in your browser.

---

## 4. Vercel Deployment

The repository is preconfigured for Vercel:
- **Framework / Build:** Angular (`npm run build`), Node.js `22.x`.
- **Route Rewrites (`vercel.json`):**
  - `/api/agronomist/status` → serverless function `api/agronomist/status.mjs`
  - `/api/agronomist/chat` → serverless function `api/agronomist/chat.mjs`
- **Vercel Environment Variables:**
  1. Go to **Project Settings → Environment Variables**.
  2. Add `GEMINI_API_KEY` for *Production*, *Preview*, and *Development*.
  3. (Optional) Set `GEMINI_MODEL` (defaults to `gemini-3.6-flash`).
