# Pura Vida — styling

Dit document is de enige bron voor vorm, afstand, type en kleur. `/design-system` (sectie Canoniek en het regelboek) laat dezelfde regels zien. `docs/UI-REGELS.md` is de checklist vóór review. Wijkt een scherm, een voorbeeld of de checklist af, dan geldt dit document.

Nieuwe schermen gebruiken alleen `src/components/pura/canoniek.tsx`, de oudere blokken in `src/components/pura` die hieronder nog genoemd worden, en `src/components/ui`. Geen nieuwe kleuren, radii of fontgroottes. Geen `#hex` in classes, geen `rounded-[..]`, geen `components/polar`.

Bestaande schermen wijken nog af. Die blijven staan tot hun eigen migratie-PR. Niet namaken.

## Gesloten set

Tien patronen. Implementatie: `src/components/pura/canoniek.tsx`. Voorbeeld met doe en niet: `/design-system#canoniek`.

| Patroon | Component | Vaste maat |
|---|---|---|
| Paginakop | `Paginakop` | Geen titel. Tabs links, hooguit één actie rechts. `gap-2`. Actie `size="touch"` (`h-11`, 44px). |
| Werkkaart | `Werkkaart` | Kaart `rounded-polar-lg` (16). Kop `min-h-12`, `text-sm font-semibold`. Zijmarge 16, desktop 24 (`px-4 lg:px-6`). |
| Sectiekop | `Sectiekop` | `text-sm font-semibold`, teller `text-muted-foreground`. Zin, geen kapitalen. |
| Lijstrij met actie | `Lijstrij` | `min-h-12` (48). Naam `text-sm font-medium`. Meta altijd regel 2 via `RijMeta`. Actie rechts. Tik opent de lade. |
| Afvinkrij | `Afvinkrij` | Zelfde rij. Vinkje in een vak van 44px. Klaar = doorgestreept. |
| Telrij met stapper | `Telrij` | Zelfde rij. Stapper én knop `h-11`. Cijfer `text-sm font-semibold tabular-nums`. Eenheid `text-xs text-muted-foreground` met `items-center leading-none`. |
| Statusbadge | `Statusbadge` | Eén per rij, altijd met tekst. `rounded-full`. |
| Dialoog | `Dialoog` | `rounded-polar-xl` (20). Padding 16, vanaf `sm` 24. Annuleren ghost, één bevestiging. |
| Formulierveld | `Formulierveld` | Label boven veld (`space-y-2`). Invoer `h-11 text-base`. Knoppen rechtsonder. |
| Lege staat | `LegeStaatBlok` | Eén zin, `text-sm text-muted-foreground`, `px-4 py-6`. Geen icoon. |

Oudere blokken die blijven gelden tot een scherm overstapt: `PaginaBalk` (zelfde rol als Paginakop), `LijstKaart`, `KaartKop`, `RijMenu`, `RijMeta`, `TabelVoet`, `ZoekVeld`, `DetailLade`, `FilterBalk`, `InklapGroep`, `LaadRijen`, `FoutRegel`, `InstellingRij`, `FormKaart`, `Stappen`, `KengetalVerdeling`.

Niet uitbreiden: `StatusBadge` (tweede badge naast `Statusbadge`), `EmptyState` (icoon en `text-[15px]`), `LegeStaat` (`py-8`, buiten de schaal), `components/kitchen/EmptyState`, `components/polar`.

## Afstand

Alleen 8, 12, 16 en 24.

| px | Class | Waar |
|---|---|---|
| 8 | `gap-2`, `py-2` | Icoon en label, kleine delen in een rij |
| 12 | `gap-3`, `p-3` | Compacte cluster in een rij of formuliergroep |
| 16 | `gap-4`, `p-4`, `space-y-4` | Tussen blokken op de pagina; zijmarge in een kaart |
| 24 | `lg:px-6`, `sm:p-6` | Zijmarge in een kaart vanaf desktop; dialoog vanaf `sm` |

Niet: `space-y-5`, `p-5`, `gap-1.5`, `gap-5`, `px-5`, losse px, en 8/12/16 door elkaar in hetzelfde cluster.

`page-stack` is nog `space-y-4 md:space-y-6`. Nieuwe pagina's zetten `space-y-4` op hun eigen stapel. De shell zelf verandert in een aparte PR.

## Rijen en bediening

- Elke rij in één kaart even hoog: `min-h-12`.
- Meta (eenheid, gewicht, datum) altijd op regel 2. Ontbreekt de inhoud, dan `—`. Nooit de ene rij met een badge op de naam en de andere met een tweede regel.
- Werkschermen: knoppen `size="touch"` of `size="touch-icon"` (`h-11`). Stapper en knop in dezelfde rij exact die hoogte.
- Getal `font-semibold tabular-nums`, eenheid kleiner en niet vet, zelfde lijn (`items-center leading-none`).
- Eén groene knop per kaart. Een werkwoord dat op elke rij staat (Bestellen, Opslaan) is `variant="outline"`. `Telrij` doet dat zelf; `primair` alleen als de kaart verder geen groene knop heeft.
- Overige rij-acties in `RijMenu`. Gevaar onderaan, rood.
- Tikdoel minstens 44px. Geen uitleg die alleen met hover verschijnt.
- Geen horizontale scroll. Breedtes om te controleren: 390, 834, 1280. Op 390 draagt de meta-regel wat een brede tabel in een kolom zou zetten.

## Typografie

Vier niveaus. De paginatitel staat alleen in de app-header. Modules hebben geen eigen `h1`. `/design-system` is de uitzondering: dat is de naslag, geen module.

| Niveau | Class |
|---|---|
| Kaarttitel | `text-sm font-semibold` |
| Rijnaam | `text-sm font-medium` |
| Body | `text-sm` |
| Meta | `text-xs text-muted-foreground` |

Cijfers in een rij: `tabular-nums`. Een kengetal op een overzicht (`KengetalVerdeling`) mag `text-2xl font-semibold tabular-nums`. Dat is het enige grotere cijfer. Geen `text-[13px]`, `text-[15px]`, `text-[11px]`, `text-lg` in een stapper.

## Kleur

Rollen, geen losse hex in een class.

| Rol | Token | Betekenis |
|---|---|---|
| primary | `bg-primary`, `text-primary` | De ene actie, en “goed” |
| muted | `bg-muted`, `text-muted-foreground` | Rust, meta, leeg |
| border | `border-border` | Lijnen |
| success | `text-success`, `bg-success/15` | Gelukt |
| warning | `text-warning` | Let op |
| destructive | `text-destructive` | Fout of gevaar |
| info | `text-info` | Informatie, geen actie |

Status: groen = goed, oranje = let op, rood = fout, grijs = neutraal. Altijd met een woord (`Statusbadge`). Een stip alleen is niet genoeg.

## Radius

| Token | px | Gebruik |
|---|---|---|
| `rounded-polar-sm` | 8 | Kleine chips, sidebar-item |
| `rounded-polar-md` | 12 | Binnenvlak, focusvlak |
| `rounded-polar-lg` | 16 | Kaart, knop, invoer, stapper |
| `rounded-polar-xl` | 20 | Dialoog |
| `rounded-full` | — | Statusbadge, stip |

`rounded-polar` (14) en `rounded-polar-2xl` (24) staan nog op oude dialogen en rijen. Nieuwe dialogen gebruiken `Dialoog` (`rounded-polar-xl`). Geen `rounded-xl`, `rounded-2xl` of `rounded-[14px]`.

## Rand, schaduw, beweging

| | Class |
|---|---|
| Kaart, outline-knop, dialoog | `border-1.5 border-border` |
| Invoer in rust | `border border-input` |
| Statusrand, alleen als de badge die zelf heeft | niet zelf `border-2` optellen |
| Kaartschaduw | de schaduw van `Card` / `LijstKaart` (`shadow-soft`). Geen los `shadow-sm` op een nieuwe kaart |
| Hover | `duration-fast` (150ms) |
| Gewone overgang | `duration-200` |
| Dialoog | `duration-slow` (300ms) |

Iconen: 16px (`h-4 w-4`) in knop en rij, 20px (`h-5 w-5`) in een kaartkop, 24px alleen bij een groot kengetal.

## Laden, leeg, fout

Elke lijst heeft alle drie. Laden: `LaadRijen` (skelet op rijhoogte). Leeg: `LegeStaatBlok`. Fout: `FoutRegel` met één keer Opnieuw. Klaar- en nulregels zitten in `InklapGroep`, standaard dicht.

## Controle

Voor een scherm telt `docs/UI-REGELS.md` sectie B, op 390, 834 en 1280, naast `/design-system#canoniek`.
