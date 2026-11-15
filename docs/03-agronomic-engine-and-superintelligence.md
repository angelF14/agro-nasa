# 03. Agronomic Engine and Superintelligence

[← Back to Introductory README](../README.md) · [← NASA Data and External APIs](./02-nasa-data-and-apis.md)

This document explains the mathematical and agronomic logic in `RotationEngineService` and the architecture of the Google Gemini-powered **Agronomic Superintelligence**.

---

## 1. Crop Evaluation and Rotation Engine (`RotationEngineService`)

Location: `src/app/services/rotation-engine.service.ts`

### 1.1 Trapezoidal Suitability Scoring (`trapezoidScore`)
To score how well an observed environmental value $v$ (mean temperature, annualized rainfall, or pH) fits FAO EcoCrop thresholds ($\text{min}$, $\text{optMin}$, $\text{optMax}$, $\text{max}$), the engine applies a continuous $0$–$100$ trapezoidal membership function:

$$
S(v) = \begin{cases}
0 & \text{if } v < \text{min} \text{ or } v > \text{max} \\
100 & \text{if } \text{optMin} \le v \le \text{optMax} \\
\dfrac{v - \text{min}}{\text{optMin} - \text{min}} \times 100 & \text{if } \text{min} \le v < \text{optMin} \\
\dfrac{\text{max} - v}{\text{max} - \text{optMax}} \times 100 & \text{if } \text{optMax} < v \le \text{max}
\end{cases}
$$

- In `findSuitableCrops(criteria)`, `suitabilityScore` is the rounded average of applicable trapezoidal scores (temperature, rainfall, and pH when provided), after applying hard filters (maximum elevation, lethal frost, cycle days, botanical category, and soil/light traits).

### 1.2 Detailed Crop Evaluation (`evaluateCrop`)
When evaluating a selected crop against NASA POWER's `ClimateSummary`, the engine builds a `CropEvaluation` across five checks:
1. **Mean Temperature (`T2M`):** Trapezoidal score against `temp.min..optMin..optMax..max`. A `0` score triggers `hardFailure`.
2. **Annualized Rainfall (`PRECTOTCORR` annualized):** Trapezoidal score against `rain.min..optMin..optMax..max`. A `0` score triggers `hardFailure`.
3. **Minimum Temperature / Frost Risk (`T2M_MIN` vs `KTMP`/`KTMPR`):**
   - If the crop defines a killing temperature (`killingEarlyGrowth` or `killingRest`): `minTempC <= killTemp` scores `0` and triggers `hardFailure`. Otherwise it scores `100` when the safety margin is $\ge 4\,^\circ\text{C}$, or scales proportionally via `margin / 4`.
   - If no killing temperature is recorded, compares `minTempC >= crop.temp.min` (`100` optimal, `60` acceptable).
4. **Parcel Elevation (NASA DEM vs `ALTMX`):** Scores `100` if `elevationM <= crop.geography.altMax`, or `0` with `hardFailure` if exceeded.
5. **Cycle Window (`analyzedDays` vs `GMIN–GMAX`):** Informational check marking `optimal` when `analyzedDays >= cycleDays.min`.

The `overallScore` averages weighted check scores (capped at `35` if any `hardFailure` occurred). A crop is marked `isViable = true` when `!hardFailure && overallScore >= 50`.

### 1.3 3-Cycle Rotation Planner (`generatePlan`)
Given a `FarmEnvironmentProfile` and an optional base crop (`selectedCrop`), `generatePlan` constructs a diversified 3-cycle sequence (`RotationPlan`):

- **Cycle 1 (Base crop):** Uses the farmer-selected crop (or the highest-scoring climate candidate if none is selected).
- **Cycle 2 (Nitrogen recovery & pest break):**
  - Excludes Cycle 1's botanical family (`avoidFamily`).
  - If Cycle 1 is **not** a legume (`!isLegume`), prioritizes a nitrogen-fixing legume (`Fabaceae`, `legum*`, `pulse`) with `suitabilityScore >= 60`.
  - If Cycle 1 is already a legume, prioritizes a compatible non-legume crop (`suitabilityScore >= 60`).
- **Cycle 3 (Complementary closure):**
  - Excludes Cycle 2's family and, secondarily, Cycle 1's family (`secondaryAvoidFamily`) to maintain botanical diversity, interrupt pathogen cycles, and leverage fixed nutrients.
- **Agronomic notes per cycle:** Adds guidance on incorporating legume crop residues, avoiding back-to-back planting of the same family, and applying mulch/irrigation or drainage depending on whether rainfall falls below `rain.optMin` or exceeds `rain.optMax`.

### 1.4 Automated Environmental Alerts (`buildEnvironmentAlerts`)
- `heat-high` (`critical`): triggered when `heatwaveRisk === 'high'` (max temp $\ge 35\,^\circ\text{C}$).
- `heat-moderate` (`warning`): triggered when `heatwaveRisk === 'moderate'` (max temp $\ge 30\,^\circ\text{C}$).
- `water-low` (`warning`): triggered when annualized rainfall is $> 0$ and $< 500\text{ mm/year}$.
- `frost-kill` (`critical`): triggered when observed `minTempC` reaches or drops below the selected crop's lethal temperature (`KTMP` / `KTMPR`).

---

## 2. Agronomic Superintelligence (Google Gemini)

Location:
- Client & resolver: `src/app/services/agronomist-ai.service.ts`, `src/app/services/agronomist-query-resolver.service.ts`, `src/app/utils/agronomist-query-parser.utils.ts`
- Server: `api/_agronomist-core.mjs` and `src/server/agronomist.ts`

### 2.1 Models and Automatic Fallback
- **Default primary model:** `gemini-3.6-flash` (configurable via `GEMINI_MODEL`, `temperature: 0.45`, `maxOutputTokens: 4096`, `thinkingBudget: 512`, `25000 ms` HTTP timeout).
- **Automatic fallback model:** `gemini-3.5-flash-lite`.
- On rate limits (`429`), server/service errors (`503`, `500`, `404`), timeouts, or empty responses, the backend transparently retries with `gemini-3.5-flash-lite` and returns `usedFallback: true`.

### 2.2 Live Natural-Language Query Resolution (`AgronomistQueryResolverService`)
Before calling Gemini, the client runs an automatic entity-resolution pipeline on the user's message:
1. **Location & crop parsing (`parseAgronomistQuery`):**
   - Extracts explicit coordinates (`lat, lon`), city/region/country names, and crops via an extensive Spanish common-name alias dictionary (`SPANISH_CROP_ALIASES`, e.g., *maíz, elote, jitomate, frijol, papa, café, cacao, sorgo, soya, trigo, arroz*) plus catalog search across all 1,287 EcoCrop species.
   - Supports multi-turn memory across recent messages when the location and crop are provided in separate turns.
2. **Live service enrichment:**
   - Geocodes the place via **Nominatim** and queries **NASA POWER** + **Open-Meteo** in parallel.
   - Immediately syncs the `Dashboard` state (map, climate summary, active crop) so UI panels update in real time.
   - Computes `comparedEvaluations` when multiple crops are mentioned, or a `topSuitableCrops` ranking when the user asks for seed recommendations.
3. **Post-response entity sync:**
   - System instructions ask the model to append `[[AGRONASA_DETECTED: lugar="..." | semilla="..."]]` at the end of its response. The client strips this tag before rendering and uses it as a fallback trigger if any entity wasn't resolved pre-flight.

### 2.3 Multimodal Visual Diagnosis & Grounding Guardrails
- **Client-side compression (`image-compress.utils.ts`):** Attached images (up to 15 MB input) are resized on an offscreen `<canvas>` to a maximum dimension of `1280 px` and encoded as JPEG (`0.84` quality) or WebP before Base64 transmission.
- **Server-side validation (`_agronomist-core.mjs` / `agronomist.ts`):**
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
  - JSON payload limit: `10 MB`; Base64 string limit per image: `6,000,000` characters (~4 MB binary).
  - Conversation window: last `16` messages and up to `2` recent full images in context (older images are summarized as text labels).
  - **Prompt guardrails:** Forbids inventing lab metrics, measured soil pH, or satellite values absent from `AgronomistParcelContext`; requires 2–3 ranked visual hypotheses noting they do not replace laboratory testing; and includes safety notes for fertilizer or phytosanitary recommendations.
