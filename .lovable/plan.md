## SnelPrinten in standaard app-layout

**Wijziging** — `src/pages/kitchen/SnelPrinten.tsx`:
- `KitchenLayout` vervangen door `SidebarLayout` (zoals `Recipes.tsx` en `Ingredienten.tsx`).
- Titel + subtitle als eigen `<h1>`/`<p>` bovenaan de content-area, in dezelfde stijl als `Ingredienten.tsx` ("Snel printen" / "Ontdooi-, bereid- en vrije stickers").
- Bestaande grid (stap-kaarten links, voorbeeld rechts) blijft intact — alleen ingepakt in `<div className="max-w-5xl mx-auto space-y-4">` voor consistentie met Ingrediënten-pagina.

**Sidebar** — geen wijziging nodig. Menu-item "Snel printen" (Printer-icoon) staat al direct onder "Recepten" in `AppSidebar.tsx` en `isActive('/kitchen/snel-printen')` markeert 'm al automatisch.

**Andere pagina's met dezelfde afwijkende `KitchenLayout`** (alleen melden, niet aanpassen):
- `src/pages/kitchen/KitchenTasks.tsx`
- `src/pages/kitchen/MepPlanning.tsx`
- `src/pages/service/ServiceModule.tsx`

**Verificatie**: /kitchen/snel-printen toont Pura Vida sidebar links, "Snel printen" is actief gemarkeerd, header verdwenen, cards en print-flow werken identiek.
