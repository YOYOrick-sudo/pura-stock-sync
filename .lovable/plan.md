De drie login-methode knopjes (Daily / Foodbar / Persoonlijk) krijgen dezelfde soft, gelaagde uitstraling als de login card zelf, zodat het geheel visueel consistent wordt.

Wijzigingen in `src/pages/Auth.tsx`:

1. **Geselecteerde knop** — behoudt het groene accent, maar vervangt de harde `border-2 border-primary` door een subtiele groene glow/shadow (`shadow-sm` met groene tint + `ring-1 ring-primary/20`) en een iets zachtere achtergrond. Geen harde lijn meer.

2. **Niet-geselecteerde knopjes** — vervang `bg-muted/40 border-2 border-transparent` door `bg-white/60 border border-border/30` met een zeer lichte schaduw (`0 1px 3px rgba(0,0,0,0.04)`), zodat ze als losse "chips" boven de card lijken te zweven in plaats van platte vlakken.

3. **Hover state** — niet-geselecteerde knopjes krijgen een subtiele verhoging (`translate-y-[-1px]`) en iets meer schaduw bij hover, consistent met de card elevation.

4. **Border-radius** behouden op `rounded-[16px]`.

5. **Actieve/pressed state** — subtiele scale-down (`scale-[0.98]`) voor tactiele feedback.