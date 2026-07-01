## Doel
Recepten integreren in de hoofd-sidebar en dezelfde layout gebruiken als Dashboard.

## Wijzigingen

### 1) Nav-item toevoegen in `src/components/AppSidebar.tsx`
In `allNavigationItems`, direct onder "Taken Bediening":
```ts
{ title: 'Recepten', url: '/kitchen/recipes', icon: BookOpen, locations: ['West', 'Midsland'], managerOnly: false },
```
`BookOpen` toevoegen aan de lucide-import. Actief-detectie werkt automatisch (ook op `/kitchen/recipes/:id` als de bestaande active-logic prefix-match doet — anders `startsWith` check toevoegen).

### 2) Recept-pagina's overzetten naar `SidebarLayout`
Vervang `KitchenLayout` door `SidebarLayout` in:
- `src/pages/kitchen/Recipes.tsx`
- `src/pages/kitchen/RecipeDetail.tsx`
- `src/pages/kitchen/RecipeForm.tsx`

`SidebarLayout` heeft geen `title`/`subtitle`/`backTo` props (`PolarHeader` regelt de titel via route-map). Dus:
- `title`/`subtitle` props laten vallen.
- De titelmap in `SidebarLayout.tsx` uitbreiden met `/kitchen/recipes`, `/kitchen/recipes/nieuw`, `/kitchen/recipes/:id`, `/kitchen/recipes/:id/bewerken` → "Recepten" / "Nieuw recept" / "Recept" / "Recept bewerken".
- In de pagina-body zelf een compacte page-header (titel + acties zoals "Nieuw recept" / "Bewerken" / "Terug") behouden zodat de UX identiek blijft; de "Terug naar Keuken"-knop wordt "Terug naar Recepten" waar relevant, of vervalt want de sidebar heeft nu Recepten.

### 3) Geen wijziging aan routes of data
Routes in `App.tsx` blijven `/kitchen/recipes*`. `KitchenLayout` en `/kitchen`-menu blijven intact voor andere pagina's (KitchenTasks, KitchenMenu, ServiceModule).

## Verificatie
- Sidebar toont "Recepten" onder Taken Bediening op zowel West als Midsland.
- Navigeren naar `/kitchen/recipes` toont dezelfde Pura-sidebar + PolarHeader als `/dashboard`.
- Detail- en formulierpagina's tonen dezelfde layout; back-navigatie werkt.
- Build/typecheck groen.