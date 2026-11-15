# AgroHelper — Plant with Your Eyes on the Earth

> **Grow today with satellite intelligence, protect your soil for tomorrow's harvests.**  
> An agricultural decision-support platform that turns open NASA Earth observation data, weather forecasts, and global agronomic knowledge into practical crop rotation plans and contextual field guidance.

---

## Documentation Index

This repository separates a **general, non-technical introduction** designed for presentation, evaluation, and general audiences from detailed **technical documentation** for developers and reviewers:

### General Documentation (in this README)

1. [Team and Final Project](#1-team-and-final-project)
2. [Challenge, Inspiration, and Relevance](#2-challenge-inspiration-and-relevance)
3. [What AgroHelper Does and How It Works](#3-what-agrohelper-does-and-how-it-works)
4. [NASA Open Data and Partner Sources](#4-nasa-open-data-and-partner-sources)
5. [Benefits, Impact, and Future Vision](#5-benefits-impact-and-future-vision)
6. [Use of Superintelligence (SI)](#6-use-of-superintelligence-si)
7. [Summary of Tools and References](#7-summary-of-tools-and-references)

### Technical Documentation (`docs/`)

| Document                                                                                          | Contents                                                                                                                                      |
| :------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| [01. Architecture and Tech Stack](./docs/01-architecture-and-stack.md)                            | Full tech stack (Angular 20, Express SSR, Vercel), repository layout, data-flow diagram, and API endpoints.                                   |
| [02. NASA Data and External APIs](./docs/02-nasa-data-and-apis.md)                                | Specification of **NASA POWER**, **Open-Meteo**, **FAO EcoCrop** catalog (1,287 crops), **Nominatim / Esri**, and **ISRIC SoilGrids** status. |
| [03. Agronomic Engine and Superintelligence](./docs/03-agronomic-engine-and-superintelligence.md) | Trapezoidal climate suitability scoring, 3-cycle rotation planner, alerts, live query resolution, and Gemini multimodal vision.               |
| [04. Setup, Development, and Deployment](./docs/04-setup-development-and-deployment.md)           | Prerequisites, environment variables, `npm` scripts, testing, and Vercel deployment.                                                          |
| [05. References, Resources, and Licenses](./docs/05-references-and-licenses.md)                   | Complete inventory of data sources, open-source libraries, visual assets, and attributions.                                                   |

---

## 1. Team and Final Project

### Team Identity _(Visual Presentation · 01)_

- **Team Name:** `[To be completed: Official NASA Space Apps team name]`
- **Repository Contributors:**
  - `Luis Angel` (`angelF14`)
  - `Karina Alvarez`
  - `Kevin Peralta`
  - `JoeAdkins`
- **Challenge:** NASA Space Apps Challenge 2026 — _"Change of Course: Adapting Farms with NASA Data"_

### Public Link to Final Project _(Final Project)_

- **Official Code Repository (GitHub):** [https://github.com/angelF14/agro-nasa](https://github.com/angelF14/agro-nasa)
- **Live Web Application (Vercel):** `[To be completed: Public Vercel deployment URL]`
- **Demo Video / Presentation:** `[To be completed: Public YouTube / Google Drive link if applicable]`

---

## 2. Challenge, Inspiration, and Relevance

### What challenge does it address and what inspired us? _(Visual Presentation · 02)_

AgroHelper addresses the challenge **"Change of Course: Adapting Farms with NASA Data"**.

In many agricultural regions, people who work the land make critical decisions—what to plant, when to sow, and what crop to grow next—based largely on climate memory from past decades. However, rising temperatures, heatwaves, shifting rainfall patterns, unseasonal frosts, and progressive soil degradation have made relying purely on intuition or continuous monoculture increasingly risky.

We were inspired by a clear question: **how can we put NASA Earth science directly into the hands of a farmer or field technician without requiring them to interpret complex scientific datasets or spreadsheets?**

### Relevance and Alignment _(Criterion 04 · Relevance)_

In AgroHelper, NASA data is **not a decorative add-on or an isolated chart**: it is the core of the entire decision engine. Every agronomic recommendation—from a crop's suitability score to heat or water alerts and the 3-cycle rotation sequence—is calculated directly from real satellite-derived historical observations for the exact coordinates chosen by the user.

---

## 3. What AgroHelper Does and How It Works

### What does it do?

AgroHelper is an **interactive web platform for agronomic planning and diagnosis**. Starting from a parcel's location anywhere in the world and local field conditions reported by the farmer, the platform:

1. Analyzes real climate behavior over the past year (temperature, rainfall, solar radiation, humidity, elevation, and heat risk) using NASA satellite observations.
2. Evaluates compatibility across **1,287 agricultural crops** documented by the FAO.
3. Fetches short-term weather forecasts and water balance for the upcoming days.
4. Designs a **3-cycle crop rotation plan** that alternates botanical families and prioritizes nitrogen-fixing legumes to protect soil fertility and break pest cycles.
5. Provides a conversational **Agronomic Superintelligence** able to answer natural-language questions and analyze photos of leaves, plants, pests, or soil.

### User Experience Step by Step _(Visual Presentation · 04)_

The interface is organized into four intuitive steps:

1. **Step 01 — Map (Where do you want to farm?)**  
   Users search for a city, municipality, or region by name, use their current GPS location, or click directly on the interactive map (switching between regional view and satellite imagery) to pin their parcel.
2. **Step 02 — Crops (Choose or discover what to plant)**  
   Users can browse the agricultural catalog in Spanish or switch to **suggested crops**, where the system automatically filters and ranks the most climatically compatible species for that exact point on Earth.
3. **Step 03 — Recommendations and Forecast**  
   Displays:
   - The **suitability score** (0–100%) for the selected crop, broken down by mean temperature, annualized rainfall, lethal frost risk, elevation, and cycle window.
   - A **3-cycle rotation timeline** (Cycle 1 → Cycle 2 → Cycle 3) with agronomic rationale and early alerts.
   - A **7- and 16-day weather forecast**, including FAO reference evapotranspiration ($\text{ET}_0$) and net water balance (Rainfall − $\text{ET}_0$).
4. **Step 04 — Agronomic Superintelligence (Full tab and floating drawer)**  
   Users can chat in natural language (for example, _"I want to plant corn in Comayagua, Honduras"_), toggle local soil observations (_compacted, sandy, low retention, erosion-prone, saline_) and farming priorities (_water conservation, soil regeneration, heat resilience, nitrogen recovery, yield stability_), or upload a photo for a preliminary visual diagnosis grounded in their parcel's live data.

---

## 4. NASA Open Data and Partner Sources

AgroHelper combines open NASA datasets with international agronomic and geospatial sources:

- **NASA POWER (_Prediction Of Worldwide Energy Resources_):**  
  Provides daily georeferenced time series for any coordinate on Earth: bias-corrected precipitation (`PRECTOTCORR`), mean, maximum, and minimum 2 m air temperature (`T2M`, `T2M_MAX`, `T2M_MIN`), incoming surface solar radiation (`ALLSKY_SFC_SW_DWN`), relative humidity (`RH2M`), and site elevation from digital elevation models (DEM).
- **FAO EcoCrop:**  
  Agronomic database from the Food and Agriculture Organization of the United Nations, from which AgroHelper structures **1,287 agricultural crops** with optimal and absolute thresholds for temperature, rainfall, elevation, cycle duration, and botanical family.
- **Open-Meteo:**  
  Supplies the 16-day operational weather forecast and FAO reference evapotranspiration ($\text{ET}_0$) to evaluate short-term water surplus or deficit.
- **OpenStreetMap / Nominatim and Esri World Imagery:**  
  Power place-name search, reverse geocoding, and both regional map and satellite imagery views.

> For exact endpoints, query parameters, `-999` fill-value filtering, and normalization formulas, see [02. NASA Data and External APIs](./docs/02-nasa-data-and-apis.md).

---

## 5. Benefits, Impact, and Future Vision

### Current Benefits

- **Evidence-based decisions:** Reduces uncertainty when planting in regions facing climate variability.
- **Water management and conservation:** Combines annualized historical rainfall with short-term water balance (Rainfall − $\text{ET}_0$) to anticipate water stress.
- **Long-term soil health:** Encourages diversified crop rotations that alternate botanical families and introduce nitrogen-fixing legumes instead of depleting soil with repeated monocultures.
- **Accessibility:** Translates scientific names and climate thresholds into clear, practical guidance usable on both desktop and mobile devices in the field.

### Paint a Picture! What Do We Hope to Achieve? _(Visual Presentation · 05)_

We envision a future where **no farmer—regardless of farm size or location—has to plant blindly in a changing climate**.

With AgroHelper, we aim to lay the foundation for accessible, climate-resilient, regenerative agriculture directly in the browser:

- **For people:** Equipping small and medium-scale producers with decision tools previously limited to large agribusinesses or specialized consultants.
- **For the planet:** Slowing soil degradation, making every millimeter of rainfall count, and reducing overreliance on synthetic fertilizers and pesticides through smart rotations.
- **Beyond:** Expanding future phases with automated global soil properties (ISRIC SoilGrids), long-term climate projections (CMIP6), and live NASA GIBS satellite layers (such as NDVI vegetation index and SMAP surface soil moisture) to build an open standard for climate adaptation in agriculture.

---

## 6. Use of Superintelligence (SI)

> Response to the **Superintelligence** criterion: _Did you use any Superintelligence (SI) tools or software to prepare your solution? If so, how did you use them?_

1. **Superintelligence integrated into the solution (in-product):**  
   AgroHelper integrates the **Google Gemini API** (`gemini-3.6-flash` primary model with automatic fallback to `gemini-3.5-flash-lite`) as **AgroHelper Superintelligence**. Rather than operating as a disconnected generic chat:
   - A client-side query resolver automatically detects locations and crops mentioned in user messages, fetches live data from Nominatim, NASA POWER, Open-Meteo, and FAO EcoCrop, and injects those real metrics into the conversation.
   - System instructions enforce grounding strictly in observed parcel data, clear explanations of 3-cycle rotations, and preliminary visual observations when users upload photos of leaves, pests, or soil.
2. **Use during project preparation:**  
   `[To be completed by the team: specify whether AI/SI assistants were used for coding, writing, design, debugging, or documentation during the hackathon and how they were used.]`

---

## 7. Summary of Tools and References

- **Web App & Server:** Angular 20, TypeScript, Angular SSR + Express 5, Node.js 22, Vercel.
- **Maps & Visualization:** Leaflet, OpenStreetMap, Nominatim, Esri World Imagery.
- **Scientific & Climate Data:** NASA POWER Daily API, Open-Meteo Forecast API, FAO EcoCrop.
- **Superintelligence:** Google Gemini API (`@google/genai`).

> For the complete technical inventory, local setup steps, and third-party licenses, see:
>
> - [01. Architecture and Tech Stack](./docs/01-architecture-and-stack.md)
> - [04. Setup, Development, and Deployment](./docs/04-setup-development-and-deployment.md)
> - [05. References, Resources, and Licenses](./docs/05-references-and-licenses.md)
