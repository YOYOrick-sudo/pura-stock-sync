

# WeatherWidget verwijderen, IdeaBox verplaatsen

## Wat verandert

- **WeatherWidget verwijderen** uit het KPI-grid (bovenste rij)
- **IdeaBox verplaatsen** naar de plek van de WeatherWidget in het bovenste grid
- De onderste rij (Handover + IdeaBox) wordt dan alleen de HandoverCard op volle breedte
- Ongebruikte imports en weather-gerelateerde queries opruimen

## Technisch

**`src/pages/Dashboard.tsx`**:
1. Verwijder `WeatherWidget` import en alle weather-gerelateerde state/queries (`weatherData`, `loadingWeather`, `fetchWeatherData`, `aiSuggestions` etc.)
2. In het grid: vervang `<WeatherWidget ... />` door `<IdeaBox />`
3. Onderste grid: verwijder `<IdeaBox />`, laat `<HandoverCard />` op volle breedte staan

Het resultaat: IdeaBox zit direct naast "Openstaande Taken" in de bovenste rij, en HandoverCard krijgt de volle breedte.

