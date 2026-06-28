Je hebt gelijk — wat er nu staat is een opgepoetste versie van hetzelfde, niet écht strak. En het feit dat sidebar en app-achtergrond identiek zijn maakt dat de sidebar visueel "verdwijnt" in plaats van een eigen, rustig anker te zijn.

## Aanpak

In plaats van weer blind te schroeven, doe ik dit keer een echte redesign-ronde:

1. **Capture huidige sidebar** — element-screenshot van de sidebar in z'n huidige staat als referentie.
2. **3 rendered design directions** via `design--create_directions`, met locked constraints:
   - Bestaande huisstijl (primary green `#16A34A`, soft gray bg, HSL tokens)
   - Zelfde nav-items en collapse-gedrag
   - Geen iconen-soep, geen kleurexplosie, geen belletje
   - Sidebar moet **visueel duidelijk los staan** van de app-achtergrond (eigen surface, subtiele scheiding of contrast)
3. **Drie écht verschillende richtingen** (geen drie kleine variaties van hetzelfde):
   - **A — Witte rustige rail**: sidebar op pure white surface, app op `#F3F4F6`, geen border maar duidelijk contrast via surface. Active state als zachte groene pill, ruime typografie, alles ademt.
   - **B — Donkere ankerbalk**: sidebar in donker neutraal (charcoal/slate), iconen en tekst licht, primary green alleen voor active. Sterke verticale anker, premium SaaS-gevoel (denk Linear / Vercel).
   - **C — Floating card**: sidebar als zwevende afgeronde card (20px radius, lichte schaduw) met marge eromheen, los van de app-rand. Speels-strak, modern, past bij de bestaande border-radius-hiërarchie.
4. **Jij kiest** via een prototype-vraag (rendered previews naast elkaar). Pas dán implementeer ik.
5. **Implementatie** van de gekozen richting in `src/components/polar/Sidebar.tsx` en bijbehorende tokens, met behoud van alle bestaande functionaliteit (collapse, tooltips, ThemeToggle, code-protected items, NavLink-routing).

## Wat ik niet aanraak

- Logica in `AppSidebar.tsx` (auth, role-check, code dialogs, navigatie-items)
- `ThemeToggle`, `PincodeNumpad`
- Routes en URLs
- Dark mode-gedrag (Night Shift blijft werken)

## Akkoord?

Zeg "ga" en ik start met capture + 3 directions. Heb je vooraf al een sterke voorkeur voor donker (B) of zwevende card (C)? Dan focus ik die richting scherper. Anders krijg je alle drie eerlijk uitgewerkt.