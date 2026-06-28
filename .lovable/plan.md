## Doel
De horizontale ruimte links (naast de sidebar) en rechts van de pagina-inhoud vergroten, zodat cards en tekst niet meer tegen de randen aanplakken.

## Aanpak
1. **SidebarLayout.tsx**: De `px-` waarde van zowel de `<main>` container als de `<PolarHeader>` aanpassen naar een grotere, consistente padding op desktop en tablet.
2. **Controle**: Nakijken of andere pagina's (bijv. Dashboard, FohTasks, Kassatelling) eigen interne marges hebben die dit tegen zouden werken, en indien nodig bijstellen.

## Resultaat
Content op álle pagina's krijgt gelijke, ruimere ademruimte tussen sidebar en rechterrand.