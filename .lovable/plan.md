
# Plan: CSS Design Tokens Vervangen

De huidige `src/index.css` wordt vervangen door de aangeleverde CSS design tokens, gecombineerd met de bestaande Tailwind directives en shadcn variabelen.

## Wat wordt gedaan

Het volledige bestand `src/index.css` wordt herschreven met:

1. **Font import** - Uitgebreid met Geist Mono (was alleen Inter + Instrument Sans)
2. **Tailwind directives** - Blijven behouden (`@tailwind base/components/utilities`)
3. **Alle `--pv-*` CSS custom properties** uit de aangeleverde tokens:
   - Primary scale (50-900)
   - Gray/Midnight Slate scale (0-900)
   - Semantic kleuren (success, warning, error, info + light varianten)
   - Font tokens
   - Radius tokens (sm-full)
   - Shadow tokens (xs-xl + ring)
   - Sidebar tokens (bg, border, width, active states)
4. **Shadcn HSL variabelen** - Blijven behouden (--primary, --background, etc.) voor compatibiliteit met shadcn/ui componenten
5. **Dark mode** - Via `[data-theme="dark"]` selector uit de aangeleverde tokens
6. **Animaties** - `pv-pulse`, `pv-spin`, `pv-slide-up`, `pv-progress`
7. **Responsive sidebar** - Media queries voor mobile (0px) en tablet (64px)
8. **Typography classes** - Bestaande `.text-display`, `.text-h1` etc. blijven behouden
9. **Focus ring** en overige utility classes blijven behouden

## Technisch

- De `.dark` class selector wordt aangevuld met `[data-theme="dark"]` voor de nieuwe tokens
- Bestaande shadcn variabelen (--primary, --border, etc.) blijven intact zodat alle shadcn/ui componenten blijven werken
- De nieuwe `--pv-*` tokens zijn beschikbaar voor directe gebruik in componenten via `var(--pv-primary-500)` etc.
