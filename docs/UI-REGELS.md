# UI-regels Pura Vida app

Versie 1 · 6 nov 2026 · voor cloud-agent-PR’s en zelfreview vóór Yorick ziet.  
Bronnen in de repo (niet opnieuw verzinnen): `docs/STYLING_GUIDE.md`, `/design-system` (`Regelboek.tsx`), `src/components/pura/*`, tokens in `src/index.css` + `tailwind.config.ts`.

## A. Harde regels

1. **Alleen bestaand systeem.** Bouwblokken uit `components/pura` (LijstKaart, KaartKop, RijMeta, StatusLabel/StatusBadge, PaginaBalk, …) + `components/ui` (shadcn). Bestelbord-rijen: CompacteTabel / BordTabel-ritme. Geen nieuwe kleuren, radii of fontgroottes. Geen `#hex`, geen `rounded-[..]`, geen `components/polar` (legacy).
2. **Tokens.** Kleuren: `primary`, `muted`, `border`, `success`/`warning`/`destructive`/`info`. Radius: `rounded-polar-sm|md|lg|xl`. Shadows: `shadow-card` e.d. Transitions: `duration-fast|200|slow`.
3. **Afstandsschaal (8px).** Alleen `gap-2` (8), `gap-3`/`p-3` (12), `gap-4`/`p-4`/`space-y-4` (16), `p-6`/`lg:px-6` (24). In kaarten: zijmarge 16, desktop 24 (`kaartRandKlasse` / `px-4 lg:px-6`). Tussen blokken 16. Geen `space-y-5`, `p-5`, `gap-3` door elkaar mengen.
4. **Rijhoogte bord.** Rij `min-h-11` (44px) of `min-h-12`. Alle rijen in één kaart even hoog; meta (eenheid/gewicht) altijd op dezelfde plek (onder de naam als RijMeta), nooit de ene rij met badge-op-naam en de andere met tweede regel.
5. **Controls.** Werkschermen (keuken/tablet): knoppen `size="touch"` of minstens `h-11` (44px). Stepper en knop in één rij **exact dezelfde hoogte**. Compacte stapper (`AantalStapper compact`) alleen naast andere h-9-controls; meng nooit h-9 met `size="sm"` of h-11.
6. **Aantal + eenheid.** Getal `font-semibold tabular-nums`, eenheid `text-xs text-muted-foreground` op **dezelfde baseline** (`items-center` + `leading-none`, geen losse `items-baseline` op `<input>`). Eenheid nooit groter/vetter dan het getal.
7. **Typografie.** Max. vier niveaus: kaarttitel (`text-sm font-semibold`), rijnaam (`font-medium`), meta (`text-xs text-muted-foreground`), body (`text-sm`). Geen eigen H1 (titel zit in de app-header).
8. **Eén primaire knop** (groen) per kaart of per pagina. Overige acties: outline/ghost of RijMenu `…`.
9. **Status.** Max. één statuslabel per rij, altijd met tekst (`StatusLabel` of `StatusBadge`). Kleur nooit alleen.
10. **Mobiel / tablet / desktop.** Geen horizontale scroll. Testbreedtes: **390 · 834 · 1280**. Op 390: tweede regel (RijMeta) draagt wat verborgen kolommen tonen. Touchdoelen ≥ 44px, geen hover-only uitleg.
11. **Dichtheid keuken.** Informatie dicht; geen marketing-lege ruimte rechts van acties. Controls rechts uitlijnen in één vaste kolom (zoals CompacteTabel).

## B. Visuele reviewchecklist (elke PR, vóór Yorick)

Doe dit zelf op **before/after-screenshots**, naast een **referentiescherm** (bijv. bestelbord CompacteTabel of `/design-system`).

| # | Check | Fail als |
|---|--------|----------|
| 1 | Componenten uit pura/ui, geen look-alikes | Eigen div-knop, eigen badge, eigen kaart |
| 2 | Alleen tokens | hex, `rounded-[10px]`, losse px buiten schaal |
| 3 | 8px-raster | gemeten gap/padding wijkt >4px van 8/12/16/24 |
| 4 | Rijbaselines | namen/controls springen tussen rijen |
| 5 | Controlhoogtes gelijk | stapper ≠ knophoogte |
| 6 | Eenheid in stapper | "bak"/"emmer" zweeft t.o.v. cijfer |
| 7 | Eén primaire knop | twee groene knoppen in één kaart |
| 8 | Status met tekst | alleen kleurstip |
| 9 | Breedtes 390 / 834 / 1280 | overflow, afgekapte labels, lege gaten |
| 10 | Side-by-side vs referentie | andere padding, typo of knopmaat dan burenscherm |

Bewijs in PR-review: drie after-shots (mobiel/tablet/desktop) + één before of referentie.

### Afgevinkt — Intern uit Midsland, 6 nov 2026

Klassen overgenomen uit `Telrij` / `TelStapper` op `cursor/design-audit-canoniek-7ea2` (PR #22). Die branch is niet de basis: hij neemt migraties en andere schermen mee. Gemeten in de browser op 390, 834 en 1280, naast BordTabel.

- [x] **1. Componenten.** LijstKaart, KaartKop, RijMeta, Button, Badge en AantalStapper. Geen eigen kaart, knop of badge.
- [x] **2. Tokens.** Geen `#hex`, geen `rounded-[..]`. `designregels.test.ts` slaagt.
- [x] **3. 8px-raster.** `gap-2` (8), `gap-x-3` (12), `py-2` (8), `px-4` / `lg:px-6` (16/24), `min-h-12` (48). De oude `pb-1` (4px) is weg.
- [x] **4. Rijbaselines.** Elke productrij: naam (+ hooguit één badge) op regel 1, RijMeta altijd op regel 2 (`—` als de inhoud ontbreekt). Inhoudshoogte gelijk; het streepje onder de laatste rij is de enige 1px.
- [x] **5. Controlhoogtes.** Stapper en Bestellen allebei 44px (`h-11` / `size="touch"`), gemeten.
- [x] **6. Eenheid.** `text-xs text-muted-foreground`, `items-center` + `leading-none`. Cijfer en eenheid delen het midden van de regel.
- [x] **7. Eén primaire knop.** Bestellen is `outline`. De kaart heeft geen groene knop. Telrij schrijft de herhaalde rij-actie als outline; het Regelboek houdt het groen voor de ene paginaknop.
- [x] **8. Status met tekst.** Eén Badge met het woord ("1 onderweg" / "open"). Extra toestanden staan als woorden op de meta-regel.
- [x] **9. 390 / 834 / 1280.** Geen horizontale scroll. Op 390 staat Bestellen volledig (96px), niet afgekapt tot "Be": de naam valt op een eigen regel, de knop is `shrink-0` en de controls wrappen.
- [x] **10. Naast BordTabel.** Zelfde kaart, zijmarge 16/24, naam `text-sm font-medium`, meta `text-xs`. De rijknop is 44px, zoals de touch-knoppen op het bord.

## C. Blok voor elke cloud-agent-buildprompt

Zie ook `prompt-blok.md` (zelfde tekst, alleen dit blok).

```
UI (verplicht):
- Volg docs/STYLING_GUIDE.md en /design-system (Regelboek). Bouw alleen met components/pura + components/ui + bestaande bestelbord-blokken (LijstKaart, KaartKop, RijMeta, StatusLabel/StatusBadge, CompacteTabel, AantalStapper). Geen nieuwe kleuren/radii/fontgroottes, geen #hex, geen rounded-[..], geen components/polar.
- Afstand: alleen 8/12/16/24 (gap-2/3, p-3/4, space-y-4, px-4 lg:px-6). Rij min-h-11; alle rijen in een kaart even hoog; meta altijd via RijMeta onder de naam.
- Controls op werkschermen h-11 (size="touch"); stapper en knop in één rij dezelfde hoogte. In AantalStapper: eenheid text-xs muted, baseline gelijk met het cijfer (items-center/leading-none).
- Eén primaire knop per kaart. Max één statuslabel per rij met tekst.
- Lever before/after-screenshots op 390, 834 en 1280, naast een bestaand referentiescherm. Zelf de checklist in /workspace/pura-nieuw/ui-regels/UI-REGELS.md sectie B afvinken vóór "klaar".
```

## D. Intern uit Midsland — wat nog scheef staat (after) + exacte fix

Bestanden: `InternBestellen.tsx` / `InternGroepV2.tsx`, `AantalStapper.tsx`.

1. **Stapper vs Bestellen-hoogte.** Nu: `AantalStapper compact` = h-9, knop `size="sm"`. Fix: beide h-11 (`compact={false}` of knop `size="touch"`), of beide bewust h-9 met een compact-touch-variant; nooit mengen.
2. **Baseline "1 bak" / "1 emmer".** Nu: `items-baseline` op label met `<input>` + `text-sm` eenheid → eenheid zweeft. Fix in `AantalStapper`: `items-center leading-none`; eenheid altijd `text-xs text-muted-foreground`; cijfer en eenheid visueel op één lijn.
3. **Ongelijke rijhoogte / meta-plaats.** Nu: Wortelspread heeft RijMeta ("3,2 kg per bak"), Granola alleen badge op de naamregel. Fix: elke rij dezelfde structuur: naam (+ optioneel StatusBadge) op regel 1, inhoud/eenheid altijd op regel 2 via `<RijMeta altijd>` (lege plek of "—" als inhoud onbekend); `items-center` op de rij zodat stapper+knop verticaal centreren op het tekstblok.
4. Extra (kleiner): MEP-subkop (`pt-3 pb-1`) dichter bij de eerste rij zetten (regel van nabijheid); controls rechts in vaste breedte zodat er geen lege strook naast Bestellen ontstaat; overweeg `StatusLabel` i.p.v. ad-hoc `StatusBadge`-padding.
