# Design-audit 6 november 2026

Stap 1. Geen bestaand scherm is omgezet. Wel toegevoegd: de gesloten set in `src/components/pura/canoniek.tsx`, de sectie Canoniek op `/design-system`, en dit document. Bronnen: `docs/STYLING_GUIDE.md` (geldt), `/design-system`, `docs/UI-REGELS.md`.

## Hoe gekeken

De app draait lokaal (`vite`, poort 8080). Er is geen testaccount in de repo, dus Bestelbord, Taken, beheer, MT-punt en Keten zijn niet ingelogd bekeken. De inventaris komt uit de componenten die het scherm rendert. Wel visueel, op 390, 834 en 1280:

- `/design-system#canoniek`
- `/preview/interne-levering-v2` (bestaande dev-route): echte `InternGroepV2Kaart` met vaste voorbeeldproducten
- Stickers en MEP: dezelfde pagina’s (`SnelPrinten`, `MepDag`) zonder loginpoort, alleen voor de foto
- AfvinkRonde: de component geeft `null` terug zonder data. De foto gebruikt de classes uit `AfvinkRonde.tsx` (rij `rounded-[14px]`, vinkje 26px, `text-[16px]` / `text-[13px]`)

Op 390 kapt de intern-rij de knop Bestellen af tot “Be”. Op 1280 staan stapper, datum en Bestellen op één regel, met lege ruimte links en een groene knop per rij. Stickers toont op 1280 de stapper op 32px (`md:h-8`) en secties in kapitalen. MEP zonder taken toont de icoon-lege-staat, niet `LegeStaatBlok`.

`docs/UI-REGELS.md` sectie D.1 beschrijft `AantalStapper compact` (h-9) naast `size="sm"`. In de huidige code zijn stapper en Bestellen allebei `h-11`. De baseline, de eenheid en de ongelijke rijen uit D.2–D.4 staan er nog.

## Inventaris per scherm

### Bestelbord — Op het bord (`Bestelbord.tsx`, `BordTabel`, `CompacteTabel`, `ZelfHalenTabel`)

Tabs (`BestelbordTabs` + `segmentTabsKlasse`), `LijstKaart`, `KaartKop`, `Invoerbalk`, eigen `Stepper`, `Select` h-11, `Button size="touch"`, tabel met kop `h-9` en rijen `min-h-11`, `RijMeta`, `RijMenu`, `Badge` (info/warning/outline) én `StatusLabel`, teller als `StatusBadge`, `TabelVoet`, `EmptyState` met icoon, `DetailLade`, `Stappen`. Aantal als pill (`rounded-full bg-muted text-sm font-semibold`) plus eenheid `text-xs`.

### Bestelbord — Advies (`AdviesTabel`)

`LijstKaart`, `KaartKop`, rij `min-h-11`, `StatusLabel` op de naamregel (niet op een vaste meta-regel), dezelfde aantal-pill, `TabelVoet`, `EmptyState`.

### Bestelbord — Advies keuken (`KeukenTelblok`, `DrankAdvies`, `KeukenAdviesTabel`)

`LijstKaart` deels, tabel `whitespace-nowrap` met sticky naamkolom (horizontaal scrollen op 390), kop `h-9`, leverancier als losse `text-xs` in plaats van `RijMeta`.

### Bestelbord — Tellen (`Voorraadproef.tsx`)

`Card` + `KaartKop`, `InklapGroep`, `StatusLabel`, invoer `h-11` met eenheid `text-sm` absoluut in het veld, totaal `text-lg`, groene Opslaan per open rij, zijmarge `px-3`, voortgangsbalk `h-1`.

### Bestelbord — Onderweg (`OnderwegTabel`, `InternOnderweg`, `InternOnderwegV2`)

Zelfde tabelritme als het bord. `StatusLabel` (“2d te laat”) en `StatusBadge` (intern) door elkaar. `AantalStapper` bij ontvangst.

### Bestelbord — Intern uit Midsland (`InternBestellen.tsx`, `InternGroepV2.tsx`, `AantalStapper.tsx`)

`LijstKaart` + `KaartKop`. Intro `px-4 pb-1 pt-3`. Rij is `space-y-2 px-4 py-3`, niet `min-h-12`: meta alleen als er een inhoud is. `StatusBadge` op de naam; open regels tot drie badges. Stapper: `items-baseline`, cijfer `text-lg`, eenheid `text-sm`. Groene Bestellen op elke rij. Op smal scherm wikkelen de controls onder de naam en blijft rechts een leeg vlak.

### Taken / sluitlijst (`AfvinkRonde.tsx`, `FohTasks.tsx`, `SluitRondeWest.tsx`)

AfvinkRonde is een eigen lijst: `rounded-[14px]`, vinkje `h-[26px] w-[26px] rounded-[6px]`, naam `text-[16px]`, meta `text-[13px]`, groepskop `text-[13px] uppercase tracking`, teller `text-[11px]`, `gap-1.5`, `space-y-1.5`, inline `marginBottom` 24 en 32. Knoppen zijn `Button` maar met `rounded-[14px]` en `text-[13px]`. Geen `LijstKaart` / `Afvinkrij`.

FohTasks (het takenblad eromheen) importeert `components/polar`, gebruikt `rounded-[10px]`, `text-[13px]` en `size="sm"`. `KitchenTasks.tsx` is een stub met `bg-blue-100` / `bg-purple-100` en `components/kitchen/EmptyState`.

### MEP (`MepDag.tsx`, `MepWeek.tsx`, `MepBeheer.tsx`)

Datum `text-[15px]`, sectie `text-[11px] uppercase tracking-wider`, `px-5`, `pt-3 pb-1`, `Button size="sm"` met `h-11` eroverheen, ruwe `<button>` voor taakrijen, `Card` in plaats van `Werkkaart`, `Progress`, keuken-`EmptyState`. Weeklijst heeft `items-baseline`.

### Stickers (`SnelPrinten.tsx`)

`Card` met `p-4 sm:p-5 shadow-sm`. Sectietitel `text-xs uppercase tracking-wide`. Stapper is een ruwe knop: `h-11 w-11` en vanaf `md` `h-8 w-8`. Aantal-suffix `text-[10px]`. Typechips `text-xs`. Geen `Telrij` of `Werkkaart`.

### Beheer taken (`TakenBeheer.tsx`, `TakenAdmin.tsx`)

`PolarDialog` (`components/polar`). Inline margin/padding. Ruwe knoppen naast `Button`.

### MT-punt (`MtPunt.tsx`)

Formulier op `Card` met `p-4 md:p-6`, textarea `min-h-[140px]`, versturen `min-h-[44px]` in plaats van `size="touch"`. De lijst eronder is al `LijstKaart` + `StatusLabel`.

### Instellingen (`Settings.tsx`, `settings/Team.tsx`)

`Card`-rijen met chevron, `text-lg` op de kop, Team met `h-8`/`h-9` en ruwe knoppen. Geen `FormKaart` / `InstellingRij` als enig patroon.

### Keten (`KetenBeheer.tsx`, `components/keten/*`)

Intro `text-sm`. Tabs in een `overflow-x-auto`. Op mobiel dwingt `[&_table]:min-w-[52rem]` horizontaal scrollen. `Card`, `h-8`/`h-9`, ruwe knoppen, `size="sm"`, deels `LijstKaart` en `StatusBadge`.

### Wat de schermen wel al delen

Bestelbord-lijsten gebruiken `LijstKaart`, `KaartKop`, `RijMeta`, `RijMenu`, `TabelVoet` en `min-h-11`. Dat is het dichtst bij de set. De afwijking zit in hoogte (11 vs 12), twee badges, de stapper en de aantal-pill.

## Afwijkingen

Ernst: hoog = elke dienst zichtbaar of breekt 390. Midden = zelfde scherm, andere maat. Laag = naslag of rand.

| Scherm | Afwijking | Ernst | Canoniek patroon | Inspanning |
|---|---|---|---|---|
| Intern uit Midsland | Meta alleen als er inhoud is; Granola heeft geen regel 2, Wortelspread wel | Hoog | `Telrij` + `RijMeta` met `—` | S |
| Intern uit Midsland | Stapper `items-baseline`, cijfer `text-lg`, eenheid `text-sm` | Hoog | `Telrij` (cijfer `text-sm`, eenheid `text-xs`, `leading-none`) | S |
| Intern uit Midsland | Groene Bestellen op elke rij; tot drie `StatusBadge`s | Hoog | `Telrij` outline + één `Statusbadge` | S |
| Intern uit Midsland | Op 390 wordt Bestellen afgekapt (“Be”); op 1280 staat er lege ruimte links van stapper, datum en knop | Hoog | `Telrij`: stapper en knop even hoog, knop helemaal leesbaar | S |
| Bestelbord bord / onderweg | Rij `min-h-11`, kop `h-9`, aantal-pill `text-sm` naast eenheid `text-xs` | Midden | `Lijstrij` `min-h-12`, getal en eenheid zoals `Telrij` | M |
| Bestelbord bord / advies / onderweg | `Badge`, `StatusBadge` en `StatusLabel` door elkaar | Midden | één `Statusbadge` | M |
| Bestelbord toevoegen | Eigen `Stepper` met dezelfde baseline-fout; soortknoppen zijn groen zolang ze aanstaan, plus Toevoegen | Hoog | `Telrij`-stapper; één primaire knop op de kaart | M |
| Bestelbord tellen | Eenheid `text-sm` in het veld, totaal `text-lg`, groene Opslaan per rij, `px-3` | Hoog | `Formulierveld` + `Telrij`; outline Opslaan | M |
| Bestelbord advies keuken | Tabel `whitespace-nowrap`, horizontaal scrollen op 390 | Hoog | `Lijstrij`; extra kolommen naar meta | M |
| Bestelbord leeg | `EmptyState` met icoon en `text-[15px]` in een lijst | Midden | `LegeStaatBlok` | S |
| Sluitlijst AfvinkRonde | `rounded-[14px]`, `rounded-[6px]`, `text-[16px]` / `[13px]` / `[11px]`, `gap-1.5`, inline margins 24/32 | Hoog | `Werkkaart` + `Afvinkrij` + `Sectiekop` | M |
| Taken bediening | `FohTasks` polar, `rounded-[10px]`, `text-[13px]`, `size="sm"` | Hoog | `Afvinkrij` / `Lijstrij`, geen polar | L |
| MEP dag | `text-[15px]`, `text-[11px] uppercase`, `px-5`, ruwe taakknop, `size="sm"` over `h-11` | Hoog | `Paginakop` + `Werkkaart` + `Afvinkrij` + `Sectiekop` | M |
| MEP week | `items-baseline` in de weekrij | Midden | `Lijstrij` | S |
| Stickers | Stapper `md:h-8`, suffix `text-[10px]`, kaart `p-5`, titel in kapitalen | Hoog | `Telrij` + `Werkkaart` + `Sectiekop` | M |
| Keten | `min-w-[52rem]` dwingt horizontaal scrollen op 390; `h-8`/`h-9` | Hoog | `Lijstrij`; verborgen kolommen naar meta | L |
| Keten | Ruwe knoppen, `size="sm"`, `Card` naast `LijstKaart` | Midden | `Werkkaart` + `Formulierveld` + `Dialoog` | M |
| MT-punt | Formulierkaart `p-4 md:p-6`, knop `min-h-[44px]` i.p.v. `size="touch"` | Midden | `Formulierveld` in `Werkkaart` | S |
| Instellingen / team | `text-lg` kop, `h-8`/`h-9`, ruwe knoppen | Midden | `InstellingRij` in `Werkkaart` | M |
| Taken beheren | `PolarDialog`, inline margin | Midden | `Dialoog` | S |
| Shell | `page-stack` wordt op desktop `space-y-6` (24) terwijl blokken 16 uit elkaar horen | Midden | `space-y-4` in de shell | S, raakt elk scherm |
| Naslag | Oude basis-sectie toonde 4/8/12/16. Staat nu op 8/12/16/24 | Laag | dit document | gedaan |
| Twee badges | `StatusBadge` (px-2.5, eigen tones) en `StatusLabel` | Midden | alleen `Statusbadge` | per scherm |
| Twee lege staten | `EmptyState`, keuken-`EmptyState`, `LegeStaat` (`py-8`) | Laag | `LegeStaatBlok` | per scherm |

## Tien zwaarste

1. AfvinkRonde tekent een eigen rij (`rounded-[14px]`, `text-[13px]`/`[16px]`, inline 24/32).
2. FohTasks (takenblad) houdt polar, `rounded-[10px]` en `size="sm"`.
3. MEP-dag: eigen type (`text-[15px]`, `text-[11px]` kapitalen) en `px-5`.
4. Stickers: stapper zakt op tablet/desktop naar 32px, suffix 10px.
5. Stappers op het bord en intern: eenheid zweeft (`items-baseline`, `text-lg` + `text-sm`).
6. Intern-rijen ongelijk, meerdere badges, groene knop per rij.
7. Keten-tabellen dwingen op 390 een horizontale scroll (`min-w-[52rem]`).
8. Tellen: eenheid en totaal vallen buiten de vier tekstniveaus, Opslaan is overal groen.
9. Drie statuscomponenten en drie lege staten naast elkaar.
10. Advies keuken scrollt horizontaal; de bordrij is 44px en de kanonieke rij 48px.

## Migratie

Elke stap een aparte PR. Geen databasemigratie. Eerst het scherm dat de keuken elk uur aanraakt.

1. **Bestelbord, intern + stapper.** `AantalStapper` en de lokale `Stepper` in `Bestelbord.tsx` naar de lijn van `Telrij` (of de rij vervangen door `Telrij`). `InternBestellen` en `InternGroepV2` op één rijhoogte, één `Statusbadge`, outline Bestellen. Alleen presentatie; dezelfde `onChange` / `onBestellen`.
2. **Bestelbord, bord, advies en onderweg.** `BordTabel`, `OnderwegTabel`, `AdviesTabel`, `ZelfHalenTabel` naar `Lijstrij`. Aantal-pill weg. Eén `Statusbadge`. Leeg wordt `LegeStaatBlok`.
3. **Bestelbord, tellen en advies keuken.** `Voorraadproef` en `KeukenAdviesTabel`: geen horizontale scroll, eenheid `text-xs`, één groene knop per kaart.
4. **Sluitlijst.** `AfvinkRonde` naar `Werkkaart` + `Sectiekop` + `Afvinkrij`. Zelfde check- en bestelmutaties.
5. **Taken bediening.** `FohTasks` van polar en `rounded-[10px]` af, rijen naar `Afvinkrij` / `Lijstrij`. Grootste bestand; in plakken (lijst, dialoog, beheer).
6. **MEP-dag**, daarna week en beheer. Datumkop via de app-header / `Paginakop`. Taakrijen naar `Afvinkrij`.
7. **Stickers.** Stapper naar `Telrij`-hoogte op elk breekpunt. Kaarten naar `Werkkaart`.
8. **Keten.** Eerst de scroll (`min-w-[52rem]` eraf, extra kolommen naar meta), daarna knoppen en dialogen.
9. **MT-punt, Instellingen, Team, Taken beheren.** `Formulierveld`, `InstellingRij`, `Dialoog`. PolarDialog weg.
10. **Shell.** `page-stack` op elk breekpunt `space-y-4`. Aparte PR omdat elk scherm meeschuift.
11. **Recepten, gerechten, ingrediënten.** Lager verkeer. Zelfde set, nadat de keuken stabiel is.

Per PR: before/after op 390, 834 en 1280, naast `/design-system#canoniek`, en sectie B van `docs/UI-REGELS.md` afgevinkt. Mutaties, aantallen en RPC’s blijven gelijk.
