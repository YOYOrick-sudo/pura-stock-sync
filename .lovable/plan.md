

# Drie kleine fixes Personeel-module

## 1. "Pura Vida" header weghalen
De `SidebarLayout` rendert bovenaan een `PolarHeader` met "Pura Vida". Op de Personeel-pagina staat dat dubbel met de eigen module-header. Fix: in `PersoneelLayout.tsx` de `SidebarLayout` aanroepen met een prop/optie die de header verbergt, óf de `PolarHeader` skippen voor deze route.

Concreet: voeg `hideHeader` prop toe aan `SidebarLayout` (default false), en gebruik `<SidebarLayout hideHeader>` in `PersoneelLayout`. Andere pagina's blijven onveranderd.

## 2. Pincode-gate "0000" voor /personeel
Voor de hele Personeel-module een pincode-prompt toevoegen, identiek aan het patroon van Statistieken (`requiresCode` in `AppSidebar`). Code = `0000`, opgeslagen in `sessionStorage` onder key `personeel_unlocked`.

Implementatie:
- In `allNavigationItems` (`AppSidebar.tsx`) het Personeel-item krijgt `requiresCode: true`
- `handleProtectedClick` uitbreiden zodat het werkt voor meerdere keys: check `sessionStorage[<key>_unlocked]`, anders dialoog openen
- Per item een `codeKey` ('stats' | 'personeel') en juiste verwachte code (`boom` voor stats, `0000` voor personeel)
- `handleCodeSubmit` valideert tegen de juiste code op basis van `pendingUrl`
- Extra: `RequireManager` (of een nieuwe `RequirePersoneelPin`) checkt bij directe URL-toegang ook `sessionStorage['personeel_unlocked']` — anders redirect naar `/dashboard`

## 3. Hernoemen "Personeel" → "Planning"
Alleen de zichtbare label, NIET de routes/bestandsnamen/database (te risicovol, breekt te veel).

Aanpassen:
- `src/lib/personeel-copy.ts` → `module: "Planning"` (was "Personeel")
- `src/components/AppSidebar.tsx` → sidebar-item title: `"Planning"`
- `src/pages/personeel/PersoneelLayout.tsx` → gebruikt `copy.module`, dus automatisch goed via stap 1 hierboven

Routes blijven `/personeel/*`, codebase-namen blijven hetzelfde.

## Omvang
3 bestanden gewijzigd (`SidebarLayout.tsx`, `PersoneelLayout.tsx`, `AppSidebar.tsx`, `personeel-copy.ts`), 0 migraties, 0 nieuwe bestanden.

