# UI-regels Pura Vida app

Versie 2 · 6 nov 2026 · voor cloud-agent-PR’s en zelfreview vóór Yorick ziet.  
Bron: `docs/STYLING_GUIDE.md`. Naslag: `/design-system#canoniek`. Tokens: `src/index.css`, `tailwind.config.ts`.

Keuzes van Yorick, definitief:

1. Eén primaire (groene) knop per pagina. Rij-acties zijn outline.
2. Sectiekop is 48px (`min-h-12`).
3. Tablet-test op 834px.
4. `DialogTitle` blijft `text-lg`. Dialoog-radius blijft 24 (`rounded-polar-2xl`).

## A. Harde regels

1. **Alleen het systeem.** Bouwstenen uit `components/pura/canoniek.tsx` (Paginakop, Werkkaart, Sectiekop, Lijstrij, Afvinkrij, Telrij, Statusbadge, Dialoog, Formulierveld, LegeStaatBlok) plus de ondersteunende patronen (Sheet/DetailLade, Sonner, Skeleton/LaadRijen, Tabs, Progress `h-1`/`h-2`) en `components/ui`. Geen `#hex`, geen `rounded-[..]`, geen `components/polar`.
2. **Kleurrollen.** `primary` is alleen de ene actie. `success` is “goed”. Verder `muted`, `border`, `input`, `warning`, `destructive`, `info`. Primary nooit als statusvlak.
3. **Afstand.** Alleen 8 / 12 / 16 / 24: `gap-2`, `space-y-2`, `gap-3`/`p-3`, `gap-4`/`p-4`/`space-y-4`/`px-4`, `lg:px-6`/`sm:p-6`/`py-6`. Niet: `gap-1.5`, `p-5`, `px-5`, `space-y-5`, `space-y-6`, `space-y-8`, `space-y-10`.
4. **Rij en sectiekop.** `min-h-12` (48px). Meta altijd op regel 2 via `RijMeta`, of `—`.
5. **Controls.** Werkschermen: `size="touch"` (`h-11`, 44px). Stapper en knop in één rij even hoog. De stapper is `AantalStapper` (één implementatie). Eenheid `text-xs text-muted-foreground`, `items-center leading-none`. Cijfer `text-sm font-semibold tabular-nums`.
6. **Typografie.** Kaarttitel en sectiekop `text-sm font-semibold`. Rijnaam `text-sm font-medium`. Body `text-sm`. Meta `text-xs text-muted-foreground`. Invoer `text-base`. Kengetal alleen in KengetalVerdeling: `text-2xl`. Dialoogtitel: `text-lg` van `DialogTitle`. Geen eigen H1.
7. **Eén primaire knop per pagina.** Herhaalde rij-actie is outline. Gevaar is destructive. Rest: ghost of `RijMenu`.
8. **Status.** Maximaal één `Statusbadge` per rij, met tekst. Mag een vast lucide-icoon ervoor. Kleur nooit alleen. Stip alleen naast zichtbare tekst.
9. **Radius.** `rounded-full` (pill, stip, segment), `rounded-polar-sm` 8, `rounded-polar-md` 12, `rounded-polar-lg` 16 (kaart, knop, veld, stapper), dialoog `rounded-polar-2xl` 24. Genest: binnenradius = buitenradius − padding. Geen `rounded-polar` (14).
10. **Breedtes.** Geen horizontale scroll. Test **390 · 834 · 1280**. Op 390 draagt `RijMeta` wat een tabelkolom zou zijn. Geen kale `Table` met `overflow-auto` op 390.
11. **Iconen.** Alleen lucide, uit de vaste set in de stylinggids. Icoonknop: `aria-label`. Info-uitleg op tik, niet alleen hover.
12. **Staten.** Laden = Skeleton / `LaadRijen`. Leeg (na laden) = `LegeStaatBlok`. Fout = `FoutRegel`. Disabled blijft 44px. Focus-ring zichtbaar.

## B. Visuele reviewchecklist (elke PR, vóór Yorick)

Doe dit zelf op before/after-screenshots, naast `/design-system#canoniek`.

| # | Check | Fail als |
|---|--------|----------|
| 1 | Bouwstenen uit pura/ui | Eigen div-knop, eigen badge, eigen kaart |
| 2 | Alleen tokens | hex, `rounded-[10px]`, losse px buiten de schaal |
| 3 | 8/12/16/24 | gemeten gap wijkt af; `space-y-6` of `space-y-8` |
| 4 | Rij en sectiekop 48px | hoogtes springen; meta wisselt van plek |
| 5 | Controls 44px | stapper ≠ knop; `h-8`/`h-9`/`size="sm"` op een werkscherm |
| 6 | Eenheid in de stapper | "bak" zweeft; eenheid groter of vetter dan het cijfer |
| 7 | Eén groene knop per pagina | tweede filled primary; rij-actie is groen |
| 8 | Status met tekst of icoon+tekst | alleen een kleur; primary als badge-vlak |
| 9 | 390 / 834 / 1280 | overflow, afgekapte labels, lege gaten |
| 10 | Naast canoniek | andere padding, radius of knopmaat dan `/design-system#canoniek` |

Bewijs: drie after-shots (390, 834, 1280) plus één before of de canonieke referentie.

### Afgevinkt — Intern uit Midsland, 6 nov 2026

Klassen overgenomen uit `Telrij` / `AantalStapper`. Gemeten op 390, 834 en 1280, naast BordTabel. (PR #23.)

- [x] **1. Componenten.** LijstKaart, KaartKop, RijMeta, Button, Badge en AantalStapper. Geen eigen kaart, knop of badge.
- [x] **2. Tokens.** Geen `#hex`, geen `rounded-[..]`. `designregels.test.ts` slaagt.
- [x] **3. 8px-raster.** `gap-2` (8), `gap-x-3` (12), `py-2` (8), `px-4` / `lg:px-6` (16/24), `min-h-12` (48). De oude `pb-1` (4px) is weg.
- [x] **4. Rijbaselines.** Elke productrij: naam (+ hooguit één badge) op regel 1, RijMeta altijd op regel 2 (`—` als de inhoud ontbreekt).
- [x] **5. Controlhoogtes.** Stapper en Bestellen allebei 44px (`h-11` / `size="touch"`).
- [x] **6. Eenheid.** `text-xs text-muted-foreground`, `items-center` + `leading-none`.
- [x] **7. Eén primaire knop.** Bestellen is `outline`. De kaart heeft geen groene knop.
- [x] **8. Status met tekst.** Eén badge met het woord. Extra toestanden staan als woorden op de meta-regel.
- [x] **9. 390 / 834 / 1280.** Geen horizontale scroll. Op 390 staat Bestellen volledig, niet afgekapt.
- [x] **10. Naast BordTabel.** Zelfde kaart, zijmarge 16/24, naam `text-sm font-medium`, meta `text-xs`.

## C. Blok voor elke cloud-agent-buildprompt

```
UI (verplicht):
- Volg docs/STYLING_GUIDE.md en /design-system#canoniek. Bouw met components/pura (Paginakop, Werkkaart, Sectiekop, Lijstrij, Afvinkrij, Telrij, Statusbadge, Dialoog, Formulierveld, LegeStaatBlok, AantalStapper) + components/ui. Geen #hex, geen rounded-[..], geen components/polar.
- Afstand alleen 8/12/16/24. Rij en Sectiekop min-h-12. Meta via RijMeta. Controls size="touch" (h-11). Stapper = AantalStapper: eenheid text-xs, items-center leading-none.
- Eén groene knop per pagina; rij-acties outline. Max één Statusbadge per rij, met tekst. primary is actie, success is goed.
- Dialoog volgt DialogContent (rounded-polar-2xl, DialogTitle text-lg). Voortgang h-1 of h-2. Geen kale Table met scroll op 390.
- Lever before/after op 390, 834 en 1280, naast /design-system#canoniek. Checklist docs/UI-REGELS.md sectie B afvinken vóór "klaar".
```

## D. Wat nog scheef staat

Intern uit Midsland is gelijkgetrokken in PR #23. De rest van de schermen staat in `docs/design-audit-2026-11.md` en volgt per kleine PR. Deze regels veranderen die schermen niet.
