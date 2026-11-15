# 02. NASA Data and External APIs

[← Back to Introductory README](../README.md) · [← Architecture and Tech Stack](./01-architecture-and-stack.md)

This document details the **NASA** datasets and external APIs integrated into AgroHelper, including requested parameters, data-cleaning rules, normalization logic, and their exact role in the platform.

---

## 1. NASA POWER Daily API (Core Satellite Climate Engine)

- **Service:** `NasaPowerService` (`src/app/services/nasa-power.service.ts`)
- **Endpoint:** `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Community:** `community=AG` (Agroclimatology)
- **Format:** `JSON`

### Date Window and Satellite Processing Lag
To avoid incomplete or unprocessed recent days, `getDefaultDateRange(daysBack = 365, lagDays = 7)` automatically computes a **365-day window ending 7 days prior to the current UTC date** (`YYYYMMDD`).

### Requested Parameters and Usage in AgroHelper

| NASA POWER Parameter | Physical Description | Unit | Role in AgroHelper |
| :--- | :--- | :--- | :--- |
| `PRECTOTCORR` | Bias-corrected daily precipitation | `mm/day` | Period sum (`totalPrecipitationMm`) and 365-day scaled annual rainfall (`annualizedPrecipitationMm`) for EcoCrop comparison. |
| `T2M` | Daily mean air temperature at 2 m | `°C` | Period mean (`meanTempC`) used for trapezoidal thermal suitability scoring. |
| `T2M_MAX` | Daily maximum air temperature at 2 m | `°C` | Observed peak (`maxTempC`) and heatwave risk classification (`heatwaveRisk`: `high` if $\ge 35\,^\circ\text{C}$, `moderate` if $\ge 30\,^\circ\text{C}$, otherwise `low`). |
| `T2M_MIN` | Daily minimum air temperature at 2 m | `°C` | Observed minimum (`minTempC`) checked against crop lethal frost thresholds (`KTMP` / `KTMPR`). |
| `ALLSKY_SFC_SW_DWN` | All-sky surface shortwave downward irradiance | `MJ/m²/day` | Period mean (`solarRadiationMjM2Day`), passed to the agronomic AI parcel context. |
| `RH2M` | Relative humidity at 2 m | `%` | Period mean (`relativeHumidityPct`), used as atmospheric moisture context. |
| `geometry.coordinates[2]` | Site elevation from NASA POWER DEM | `m a.s.l.` | Stored as `elevationM` (rounded) to enforce EcoCrop maximum altitude limits (`ALTMX`). |

### Data Cleaning (`nasa-cleaner.utils.ts`)
Unprocessed or missing NASA POWER records return `fill_value = -999`. Before computing averages, sums, or extremes:
- `filterNasaFillValues(values)` removes non-finite values and `-999`.
- `meanValidNasaValues(values)` averages only valid observations.
- When valid days (`analyzedDays`) differ from 365, `annualizedPrecipitationMm` scales rainfall to a full-year equivalent:

$$\text{Annualized Rainfall} = \left(\frac{\text{Valid Period Precipitation}}{\text{Valid Days Analyzed}}\right) \times 365$$

---

## 2. Open-Meteo Forecast API (Short-Term Forecast & $\text{ET}_0$)

- **Service:** `OpenMeteoService` (`src/app/services/open-meteo.service.ts`)
- **Utilities:** `forecastToClimateSummary` (`src/app/utils/forecast-summary.utils.ts`) and `calculateWaterBalance` (`src/app/utils/water-balance.utils.ts`)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Horizon:** `forecast_days=16`, `timezone=auto`

### Requested Variables
- **`current`:** `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `precipitation`, `wind_speed_10m`, `weather_code`.
- **`daily`:** `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `precipitation_probability_max`, `et0_fao_evapotranspiration`.

### Processing & Caching
- WMO weather codes are mapped to Spanish descriptions and semantic SVG icons in `WeatherForecastComponent`.
- **7-day net water balance** is computed as:

$$\text{7-Day Water Balance (mm)} = \sum_{d=1}^{7} \text{Precipitation}_d - \sum_{d=1}^{7} \text{ET}_{0,d}$$

- Responses are cached in memory per coordinate rounded to 4 decimal places (`lat.toFixed(4),lon.toFixed(4)`) using `shareReplay(1)` (with an optional `forceRefresh` flag).

---

## 3. FAO EcoCrop Agronomic Catalog (`crops.json`)

- **Source Files:** `src/app/data/EcoCrop_DB.csv` (1.62 MB) and `src/app/data/Ecocrop_variable_lookup.csv`
- **Conversion Script:** `scripts/convert-ecocrop.ts` (run via `npm run parsecrops:csv`)
- **Generated Asset:** `public/data/crops.json` (**1,287 agricultural crops**, ~1.80 MB)

### Curation Pipeline in `convert-ecocrop.ts`
1. Parses `EcoCrop_DB.csv` using `latin1` encoding via `csv-parse/sync`.
2. Filters for agricultural categories: `cereals`, `legumes`, `vegetables`, `roots`, `tubers`, `forage`, `pasture`, `oil`, `fibre`, `fruits`.
3. Requires complete thermal and rainfall thresholds (`tmin`, `topmn`, `topmx`, `tmax`, `rmin`, `ropmn`, `ropmx`, `rmax`).
4. Normalizes legacy botanical family synonyms (e.g., `Leguminosae` / `Papilionaceae` → `Fabaceae`, `Gramineae` → `Poaceae`, `Cruciferae` → `Brassicaceae`, `Compositae` → `Asteraceae`, `Umbelliferae` → `Apiaceae`).
5. Outputs structured `CropProfile` records including temperature, rainfall, pH, latitude, max altitude (`altMax`), light/photoperiod, soil traits (depth, texture, fertility, Al toxicity, salinity, drainage), and agronomy (`GMIN–GMAX` cycle days, abiotic tolerances/susceptibilities).
6. At runtime in the browser, `RotationEngineService.loadCatalog()` fetches `/data/crops.json` once and enriches common names with Spanish aliases (`enrichCatalogWithSpanishNames`).

---

## 4. Mapping and Geocoding (Leaflet, OpenStreetMap, Nominatim, Esri)

- **Components / Services:** `FarmMap` (`src/app/components/farm-map/farm-map.ts`) and `AgronomistQueryResolverService`
- **Leaflet Tile Layers:**
  - **Regional Map (OSM):** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - **Satellite View (Esri):** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Parcel Visualization:** Center marker plus a `15,000 m` (`15 km`) radius circle representing the local climate reference area.
- **Geocoding:**
  - Forward search: `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1`
  - Reverse geocoding: `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10`

---

## 5. Current Status of Soil Data (ISRIC SoilGrids v2.0 & Local Context)

To remain transparent about current implementation status in the repository:
- **Active Local Context:** Farmers can toggle field observations (`compacted`, `sandy`, `low-retention`, `erosion-prone`, `saline`, `healthy`) and enter free-form notes in the assistant UI; these are injected into `FarmEnvironmentProfile` and Gemini's prompt.
- **ISRIC SoilGrids v2.0 (`SoilGridsService`):** `src/app/services/soil-grids.service.ts` defines the endpoint (`https://rest.isric.org/soilgrids/v2.0/properties/query`) and `SoilProfile` contract (`ph`, `organicCarbonGKg`, `nitrogenGKg`, `texture`, `bulkDensityKgDm3`). Currently `getSoilProfile` returns `of({})`, and `FarmAggregatorService` / `Dashboard` apply baseline defaults (`pH 6.5`, `33/34/33` loam texture, `1.3 kg/dm³` bulk density) as placeholders until the direct SoilGrids REST normalization is wired in a subsequent phase.
