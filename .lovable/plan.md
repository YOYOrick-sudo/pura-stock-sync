De PolarHeader in SidebarLayout toont al de pagina-titel bovenaan elke pagina (zoals Dashboard en Taken doen). Op andere pagina's staat die titel echter ook nog eens als `<h1>` in de pagina-content zelf, wat dubbelop is.

Doel: alle pagina's die `SidebarLayout` gebruiken krijgen hun titel alleen via de PolarHeader, consistent met Dashboard en Taken. Dubbele `<h1>` titels in de content worden verwijderd.

---

## Aanpak

### Stap 1: Dubbele titels verwijderen uit keuken-pagina's
- **Ingredienten.tsx** — verwijder `<h1>Ingrediënten</h1>` (de info-tooltip blijft als los element zonder kop)
- **Recipes.tsx** — verwijder `<h1>Recepten</h1>` die zojuist is toegevoegd
- **SnelPrinten.tsx** — verwijder `<h1>Snel printen</h1>`
- **KitchenMenu.tsx** — verwijder `<h1>Keuken</h1>`

### Stap 2: Dubbele titels verwijderen uit overige hoofdmodules
- **Voorraad.tsx** — `<h1>` titel verwijderen
- **Settings.tsx** — `<h1>Instellingen</h1>` verwijderen
- **KasControle.tsx** — `<h1>Kas-controle</h1>` verwijderen
- **FohAnalytics.tsx** — statische `<h1>Taken Analyse</h1>` verwijderen (de "Laden..." variant is een laadstatus, die kan eventueel blijven of vervangen worden door een skeleton)

### Stap 3: HR-module en personeel-module
- **HrInbox.tsx**, **HousingPlanner.tsx** — statische module-titels verwijderen
- **PersoneelLayout.tsx** — statische module-titel verwijderen (detailpagina's zoals WonenDetail en ApplicantDetail tonen een specifieke naam en blijven ongewijzigd — dat is geen dubbele pagina-titel)

### Stap 4: Uitzonderingen (ongewijzigd)
Pagina's zonder `SidebarLayout` of met een specifieke content-titel blijven buiten scope:
- DesignSystem, StyleGuide, DesignPreview, NotFound, Unsubscribe (geen SidebarLayout of aparte flows)
- RecipeDetail, ApplicantDetail, HousingForm, ApplicantForm, WonenDetail (tonen een specifieke naam als content-titel, geen dubbele pagina-titel)

### Stap 5: Validatie
- TypeScript build check na alle wijzigingen
- Visuele controle op preview of titels correct in PolarHeader staan en geen dubbele koppen meer in de content staan