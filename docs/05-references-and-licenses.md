# 05. References, Resources, and Licenses

[← Back to Introductory README](../README.md) · [← Setup, Development, and Deployment](./04-setup-development-and-deployment.md)

This document lists **all datasets, APIs, code, text, fonts, and cartographic resources** used to build **AgroHelper**, fulfilling the project attribution and references requirement.

---

## 1. NASA Data and International Scientific Sources

| Resource | Provider | Access / License | Usage in Project |
| :--- | :--- | :--- | :--- |
| **NASA POWER (*Prediction Of Worldwide Energy Resources*) Daily API** | NASA Langley Research Center (LaRC) | Open & free NASA data ([power.larc.nasa.gov](https://power.larc.nasa.gov/)) | Daily climate time series (`PRECTOTCORR`, `T2M`, `T2M_MAX`, `T2M_MIN`, `ALLSKY_SFC_SW_DWN`, `RH2M`) and DEM site elevation by coordinate. |
| **FAO EcoCrop Database (`EcoCrop_DB.csv`, `Ecocrop_variable_lookup.csv`)** | Food and Agriculture Organization of the United Nations (FAO) | Public ecological crop requirements dataset | Source dataset for `public/data/crops.json` (1,287 agricultural crops with temperature, rainfall, pH, elevation, soil, and cycle ranges). |
| **Open-Meteo Forecast API** | Open-Meteo | Free open weather API for non-commercial / open use ([open-meteo.com](https://open-meteo.com/)) | 16-day weather forecast, current conditions, and FAO reference evapotranspiration (`et0_fao_evapotranspiration`). |
| **ISRIC SoilGrids v2.0** *(architectural reference)* | ISRIC — World Soil Information | Open data CC BY 4.0 ([soilgrids.org](https://soilgrids.org/)) | Referenced in `SoilGridsService` for the planned global soil properties integration phase. |

---

## 2. Mapping, Tiles, and Geocoding Services

| Resource | Provider / Attribution | Usage in Project |
| :--- | :--- | :--- |
| **OpenStreetMap & Nominatim** | © OpenStreetMap contributors | Regional map layer (`Mapa Regional (OSM)`) and forward/reverse geocoding service. |
| **Esri World Imagery** | Tiles © Esri | Satellite imagery layer in the Leaflet layer switcher (`Vista Satelital (Esri)`). |
| **Leaflet** (`^1.9.4`) | BSD-2-Clause License | Interactive browser map engine (`src/app/components/farm-map/`). |

---

## 3. Superintelligence Models

| Resource | Provider | Usage in Project |
| :--- | :--- | :--- |
| **Google Gemini API (`@google/genai` `^3.3.0`)** | Google AI / Google DeepMind | Conversational and multimodal engine (`gemini-3.6-flash` with fallback `gemini-3.5-flash-lite`) powering **AgroHelper Superintelligence**. |

---

## 4. Open-Source Frameworks and Libraries (`package.json`)

### Production Dependencies
- `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-server`, `@angular/router`, `@angular/ssr` (`^20.3.x`) — MIT License.
- `@google/genai` (`^3.3.0`) — Apache-2.0 License.
- `express` (`^5.1.0`) — MIT License.
- `leaflet` (`^1.9.4`) and `@types/leaflet` (`^1.9.22`) — BSD-2-Clause / MIT Licenses.
- `csv-parse` (`^7.0.3`) — MIT License.
- `rxjs` (`~7.8.0`) — Apache-2.0 License.
- `tslib` (`^2.3.0`) — 0BSD License.

### Development & Testing Dependencies
- `@angular/build`, `@angular/cli` (`^20.3.11`), `@angular/compiler-cli` (`^20.3.0`) — MIT License.
- `typescript` (`~5.9.2`) — Apache-2.0 License.
- `jasmine-core` (`~5.9.0`), `karma` (`~6.4.0`), `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter` — MIT License.
- `@types/express`, `@types/jasmine`, `@types/node` — MIT License.

---

## 5. Visual Assets, Icons, and Typography

- **Typography:** `Outfit` (weights `400`, `500`, `600`, `700`) loaded via Google Fonts (`fonts.googleapis.com`, Open Font License).
- **Icons and Images:**
  - Custom inline SVG icons authored directly inside component templates (no proprietary external icon packs).
  - Standard Unicode weather symbols (`☀️`, `⛅`, `☁️`, `🌦️`, `🌧️`, `❄️`) paired alongside semantic SVGs.
  - Custom application favicon (`public/favicon.ico`, `public/favicon.svg`).

---

## 6. Original Copy and Agronomic Rules

- UI copy, category labels, the Spanish crop alias dictionary (`SPANISH_CROP_ALIASES` in `src/app/utils/agronomist-query-parser.utils.ts`), 3-cycle rotation heuristics, environmental alert messages, and **AgroHelper Superintelligence** system prompts were authored specifically by the team for this project.
