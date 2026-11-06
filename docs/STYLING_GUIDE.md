# Pura Vida — styling

Dit document is de bron voor vorm, afstand, type en kleur. `/design-system#canoniek` laat dezelfde regels zien, met doe en niet, en met laden, leeg, fout, disabled en focus. `docs/UI-REGELS.md` is de checklist vóór review. Wijkt een scherm of een ouder voorbeeld af, dan geldt dit document.

Nieuwe schermen gebruiken `src/components/pura/canoniek.tsx`, de ondersteunende blokken die hieronder nog genoemd worden, en `src/components/ui`. Geen nieuwe kleuren, radii of fontgroottes. Geen `#hex` in classes, geen `rounded-[..]`, geen `components/polar`.

Bestaande schermen wijken nog af. Die blijven staan tot hun eigen PR. Een token in `index.css` of `tailwind.config.ts` niet veranderen als daardoor een bestaand scherm meebeweegt.

## Keuzes

1. Eén gevulde primary-knop per pagina. Een werkwoord dat op elke rij staat is `variant="outline"`.
2. Sectiekop is 48px, gelijk aan de rij.
3. Screenshots en review op 390, 834 en 1280. De CSS-breekpunten blijven `sm 640 / md 744 / lg 1024 / xl 1280`.
4. `DialogTitle` blijft `text-lg`. De dialoog houdt `rounded-polar-2xl` (24) van `DialogContent`.

## Tien bouwstenen

| Patroon | Component | Vast |
|---|---|---|
| Paginakop | `Paginakop` (= `PaginaBalk`) | Geen titel. Tabs links, hooguit één primary rechts. `gap-2`. Actie `size="touch"`. |
| Werkkaart | `Werkkaart` | Radius 16. Kop met icoon 20px. Zijmarge 16, desktop 24. Optioneel een balk `h-1`. |
| Sectiekop | `Sectiekop` | `min-h-12`. Zin, geen kapitalen. Zelfde zijmarge als de rijen. Ring voor een percentage. |
| Lijstrij | `Lijstrij` | `min-h-12`. Naam, hooguit één status, meta op regel 2, actie rechts. |
| Afvinkrij | `Afvinkrij` | Zelfde rij. Vinkje in een vak van 44px. Klaar = doorgestreept. |
| Telrij | `Telrij` | `AantalStapper` en outline-knop, allebei `h-11`. Op 390 blijft het label heel. |
| Statusbadge | `Statusbadge` (= `StatusLabel` + optioneel icoon) | Pill `rounded-full`. Tekst verplicht. Goed = `success`, niet `primary`. |
| Dialoog | `Dialoog` | Shell-dialog: radius 24, titel `text-lg`, padding 16 / vanaf `sm` 24. Ghost + één bevestiging. |
| Formulierveld | `Formulierveld` | Label boven veld, `space-y-2`. Veld `h-11 text-base` (de invoer zelf is 40px). |
| Lege staat | `LegeStaatBlok` | Alleen ná laden, als er niets is. Eén zin, `px-4 py-6`. Geen illustratie. |

De stapper bestaat één keer: `AantalStapper`. `Telrij` gebruikt die. `src/components/kitchen/AantalStapper.tsx` exporteert hetzelfde veld, zodat bestaande imports gelijk blijven.

Niet uitbreiden: `StatusBadge` (tweede pill), `EmptyState` (icoon en `text-[15px]`), `LegeStaat` (`py-8`), `components/kitchen/EmptyState`, `components/polar`.

## Ondersteunend

| Patroon | Waar |
|---|---|
| Laden | `LaadRijen` of `Skeleton`, rijhoogte 48 |
| Fout | `FoutRegel`, één keer Opnieuw |
| Rij-acties | `RijMenu`; gevaar rood, onderaan |
| Meta | `RijMeta`; ontbreekt de inhoud, dan `—` |
| Lade | `DetailLade` (Sheet). Rij-tik. Rechts vanaf tablet, onder op de telefoon |
| Melding | Sonner (`toast`). Kort, één actie |
| Tabs | `Tabs` + `segmentTabsKlasse`. Tekst, ook op 390. Hoogte 44 |
| Voortgang | `VoortgangBalk` is `h-1`. `VoortgangRing` in de sectiekop. De primitive `Progress` is `h-4`; die niet zo laten in een lijst |
| Zoeken | `ZoekVeld`, icoon `Search`, 44px |
| Beheer | `InstellingRij`, `FormKaart` |
| Kengetal | `KengetalVerdeling`, het enige `text-2xl` |

Leeg is niet hetzelfde als laden. Een mislukte request is `FoutRegel`, geen lege staat.

## Afstand

Alleen 8, 12, 16 en 24.

| px | Class | Waar |
|---|---|---|
| 8 | `gap-2`, `py-2`, `space-y-2` | Icoon en label, label en veld |
| 12 | `gap-3`, `p-3` | Cluster in een rij |
| 16 | `gap-4`, `p-4`, `space-y-4`, `px-4` | Tussen blokken; zijmarge in een kaart |
| 24 | `lg:px-6`, `sm:p-6`, `py-6` | Zijmarge desktop; dialoog vanaf `sm`; lege staat verticaal |

Niet: `gap-1.5`, `p-5`, `px-5`, `space-y-5`, `space-y-6`, `space-y-8`, `space-y-10`, losse px.

Witruimte scheidt blokken. Een lijn alleen tussen rijen, en de `groep`-lijn op een sectiekop. Geen kader om een cluster dat al in een kaart zit.

`page-stack` is nog `space-y-4 md:space-y-6`. Dat blijft tot een eigen shell-PR. Nieuwe pagina's gebruiken `space-y-4`.

## Hoogte

| Wat | px | Class |
|---|---|---|
| Rij, sectiekop, tabelvoet | 48 | `min-h-12` |
| Knop, invoer, stapper | 44 | `h-11`, `size="touch"` |
| Trefvlak van het vinkje | 44 | het vak; het vinkje zelf mag kleiner |

Werkschermen gebruiken `size="touch"`, niet de default-knop van 48px (`h-12`) en niet `size="sm"` (`h-9`).

## Typografie

| Niveau | Class |
|---|---|
| Kaarttitel, sectiekop | `text-sm font-semibold` |
| Rijnaam | `text-sm font-medium` |
| Body | `text-sm` |
| Meta | `text-xs text-muted-foreground` |

Uitzonderingen: invoer `text-base` (anders zoomt iOS). Kengetal `text-2xl font-semibold tabular-nums`. Dialoogtitel `text-lg` van `DialogTitle`. De body van de app is 15px in `index.css`; bouwstenen blijven op `text-sm` en `text-xs`.

Cijfers: `tabular-nums`. Eenheid kleiner, niet vet, zelfde lijn (`items-center leading-none`).

Modules hebben geen eigen `h1`. De titel staat in de app-header. `/design-system` is de naslag en heeft wel een titel.

## Radius

| Token | px | Gebruik |
|---|---|---|
| `rounded-full` | — | Statusbadge, stip, segment |
| `rounded-polar-sm` | 8 | Chip, sidebar-item |
| `rounded-polar-md` | 12 | Vlak in een kaart |
| `rounded-polar-lg` | 16 | Kaart, knop, veld, stapper |
| `rounded-polar-2xl` | 24 | Dialoog (`DialogContent`) |

Geneste radius: binnen = buiten − padding van die ring. Een kaart van 16 met 16px padding heeft van binnen geen rondere hoek dan 0. Nooit een binnenhoek ronder dan de buitenhoek.

`rounded-polar` (14) en `rounded-polar-xl` (20) niet nieuw gebruiken. `rounded-xl` en `rounded-2xl` ook niet.

## Kleur

| Rol | Betekenis |
|---|---|
| `primary` | De ene gevulde actie |
| `success` | Status goed |
| `warning` | Let op |
| `destructive` | Fout of gevaar |
| `info` | Informatie, geen actie |
| `muted` | Rust, meta, leeg |
| `border` | Schaarse lijnen |
| `input` | Veld in rust |

Primary en success zijn niet dezelfde rol. Een “gelukt”-pill gebruikt `success` plus icoon of woord, nooit `bg-primary`.

## Status en voortgang

| Vorm | Wanneer |
|---|---|
| Pill `Statusbadge` | De status heeft een woord nodig |
| Stip 8px | Alleen naast tekst die al zichtbaar is |
| Ring `VoortgangRing` | Percentage in een sectiekop |
| Balk `h-1` of `h-2` | Percentage in een kaart |

Kleur nooit alleen. Icoonknoppen hebben een `aria-label`. Voortgang heeft `aria-label` of `aria-valuenow`.

## Iconen

Alleen lucide, alleen deze betekenis. 16px in knop en rij, 20px in een kaartkop, 24px alleen bij een kengetal.

| Betekenis | Icoon |
|---|---|
| Bestelbord | `ClipboardList` |
| Intern | `ArrowLeftRight` |
| Koelcel | `Refrigerator` |
| Vriezer | `Snowflake` |
| Magazijn | `Warehouse` |
| MEP | `ListChecks` |
| Datum | `CalendarClock` |
| Let op | `AlertTriangle` |
| Fout | `CircleAlert` |
| Goed | `CircleCheck` |
| Toevoegen | `Plus` |
| Opties | `MoreVertical` |
| Zoeken | `Search` |
| Uitleg | `Info` |

Een nieuwe betekenis hoort eerst in deze tabel.

## Rand, schaduw, beweging

Kaart: `border-1.5 border-border` en `shadow-soft` van `LijstKaart`. Geen los `shadow-sm` op een nieuwe kaart. Hover `duration-fast` (150ms), gewone overgang `duration-200`, dialoog `duration-slow` (300ms).

Focus: de ring van de knop of het veld. Niet `outline-none` zonder vervanging. Disabled: de disabled-stijl van het component, hoogte blijft 44px.

## Laden, leeg, fout

Elke lijst heeft alle drie. Klaar- en nulregels zitten in `InklapGroep`, standaard dicht. Geen emoji, geen illustratie, geen marketingzin.

Op 390 geen horizontale scroll en geen kale `Table` die dat afdwingt. Extra kolommen gaan naar `RijMeta`.
