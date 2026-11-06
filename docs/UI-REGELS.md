# Pura UI-regelboek v3

Dit is het enige regelboek. `docs/STYLING_GUIDE.md` wijst hierheen en is geen tweede bron. Het boek beschrijft het doel. De code loopt er nog op achter; die achterstand staat in de opruimlijst.

De vloer: iemand staat, heeft haast, kijkt scheef, en tikt met een vette vinger op een tablet. Elke regel hieronder dient dat, of een scherm dat dezelfde onderdelen deelt.

## 1. Principes

Vijf. Meer regels zijn een uitwerking van deze vijf.

1. **Eén scanlijn.** Een rij is 48 px hoog en één ding. De naam links, de actie rechts, de status op één vaste plek. Reden: in slecht licht en haast lees je een kolom, geen kaart.
2. **Eén groene knop per pagina.** Groen is “dit is de actie”. Een status is een woord in zijn eigen kleur, geen tweede groen vlak. Reden: als alles groen is, is niets de actie.
3. **Raakvlak 44 px.** Alles wat je tikt is minstens 44×44. De knop naast een stapper is even hoog als de stapper. Reden: een vette vinger mist 36 px.
4. **Vlak, niet gestapeld.** Eén pagina-vlak, een haarlijn, witruimte. Een kaart alleen om een echte groep. Geen kaart in een kaart, geen tweede titel voor dezelfde groep. Reden: elk extra kader is een rand die je oog moet overslaan.
5. **Drie toestanden, drie vormen.** Leeg, laden en fout zijn drie verschillende blokken. Een leeg scherm is geen fout en geen skelet. Reden: iemand die opnieuw tikt terwijl de lijst nog laadt, dient twee keer.

## 2. Tokens

Kleuren staan in `src/index.css` als HSL-onderdelen, omdat Tailwind `hsl(var(--token))` verwacht. In componenten gebruik je de tokennaam (`bg-background`, `text-foreground`). Geen `#hex` in `className`.

### Kleur

Licht:

| Rol | HSL | Hex | Wanneer wel | Wanneer niet |
| --- | --- | --- | --- | --- |
| background, card, popover | `0 0% 100%` | `#ffffff` | Pagina, kaart, dialoog, sheet, toast, tabel | Als vulkleur van een status |
| foreground | `0 0% 3.9%` | `#0a0a0a` | Paginatitel, sectiekop, rijnaam, veldtekst | Als enige kleur van een status |
| muted, secondary | `0 0% 96.1%` | `#f5f5f5` | Hover, tabelkop, lege staat, tablijst, grijze badge | Als vlak onder fouttekst |
| muted-foreground | `0 0% 32%` | `#525252` | Meta, kolomkop, hint, placeholder, teller | Als rijnaam |
| border | `0 0% 89.8%` | `#e5e5e5` | Haarlijn 1 px om kaart, rij, tabel, veld, badge | Als enige teken dat iets fout of actief is |
| ring | `0 0% 32%` | `#525252` | Focusring, 2 px, offset 2 | Als rand van een veld in rust |
| primary | `163 65% 26%` | `#176d55` | De ene gevulde groene knop | Status, vinkje, tab, link, badge, hoverrand |
| primary-hover | `163 65% 21%` | `#135845` | Hover en ingedrukt van die knop | Iets anders |
| primary-foreground | `0 0% 100%` | `#ffffff` | Tekst op die knop | Tekst op wit |
| destructive | `357 100% 45%` | `#e6000b` | Fouttekst, foutdrand, de verwijderknop | Een tweede groene knop |
| destructive-foreground | `0 0% 100%` | `#ffffff` | Tekst op de verwijderknop | Fouttekst op wit (die is destructive) |
| success | `152 24% 32%` | `#3e6553` | Het woord “goed” of “Klaar” | Een groen vlak of een vinkje |
| warning | `32 55% 36%` | `#8e5f29` | Het woord “let op” | Een oranje vlak |
| info | `215 14% 42%` | `#5c697a` | Het woord “info” | Een blauw vlak |

`#176d55` is het berekende resultaat van `163 65% 26%`. De oude merknaam `#1B7867` is een andere kleur. De code houdt de HSL-waarde aan, niet de oude hex.

Donker (`html.dark`). De ring en de meta uit licht (`#525252` op `#0a0a0a` is 2,53:1) halen daar 3:1 niet. Donker heeft daarom eigen waarden voor dezelfde rollen, geen nieuwe rollen.

| Rol | HSL | Hex | Tekst op de knop |
| --- | --- | --- | --- |
| background, card, popover | `0 0% 3.9%` | `#0a0a0a` | — |
| foreground | `0 0% 98%` | `#fafafa` | — |
| muted, secondary, border | `0 0% 14.9%` | `#262626` | — |
| muted-foreground, ring | `0 0% 64%` | `#a3a3a3` | — |
| primary | `160 55% 50%` | `#39c697` | `#0a0a0a`, nooit wit |
| primary-hover | `160 55% 55%` | `#4dcba1` | `#0a0a0a` |
| primary-foreground, destructive-foreground | `0 0% 3.9%` | `#0a0a0a` | — |
| destructive | `0 70% 65%` | `#e46767` | `#0a0a0a` |
| success | `152 30% 70%` | `#9cc9b4` | alleen het woord |
| warning | `32 55% 70%` | `#ddb588` | alleen het woord |
| info | `215 20% 72%` | `#a9b5c6` | alleen het woord |

Afgeleide rollen krijgen geen eigen kleur. `card-foreground`, `popover-foreground`, `secondary-foreground` en `accent-foreground` zijn `foreground`. `accent` is `muted`. `input` is `border`. `--notification-badge` vervalt: een teller is meta, geen eigen rood. `--sidebar-bg`, `--sidebar-active` en `--sidebar-hover` vervallen: de balk gebruikt background, muted en foreground.

### Grafiek

Een reeks gebruikt een `--chart-*` token, nooit een `#hex` in het component. Omzet en Midsland blijven `primary`. De vier die er al zijn blijven: `chart-grid`, `chart-prev-line`, `chart-idle-bar`, `chart-track`. Daar komen bij:

| Token | Licht | Donker | Reeks |
| --- | --- | --- | --- |
| `chart-west` | `199 89% 48%` | `199 89% 64%` | West, nu `#0EA5E9` |
| `chart-loon` | `24 76% 52%` | `24 76% 64%` | Loonkosten, nu `#E27726` |
| `chart-goed` | `142 71% 45%` | `142 60% 55%` | Onder het loondoel |
| `chart-slecht` | `0 72% 51%` | `0 75% 64%` | Boven het loondoel |

Wit op een grafiekpil is `primary-foreground`, niet `#fff`. De Cijfer-PR’s zetten deze tokens. Tot die PR blijven de waarden hier de bron, ook als `index.css` ze nog niet alle vier heeft.

### Contrast

Tekst onder 24 px, en vette tekst onder 18,7 px, minstens 4,5:1. De paginatitel op 390 is 20 px en telt dus als normale tekst. Vanaf 834 is de titel 24 px, net als het kengetal: grote tekst (minstens 3:1, en hier ook boven 4,5). Een vette badge van 12 px telt als normale tekst. Een focusring of een rand die een toestand draagt minstens 3:1. De haarlijn `#e5e5e5` is versiering en haalt 3:1 niet; zij mag, zolang de toestand ook in tekst of in de ring zit.

Licht:

| Tekst | Op wit `#ffffff` | Op muted `#f5f5f5` |
| --- | --- | --- |
| foreground `#0a0a0a` | 19,80 | 18,16 |
| muted-foreground `#525252` | 7,81 | 7,17 |
| `#737373` (shadcn-grijs, niet gebruiken) | 4,74 | 4,35, zakt door AA |
| primary `#176d55` | 6,26 | 5,74 |
| wit op primary | 6,26 | — |
| wit op primary-hover `#135845` | 8,37 | — |
| destructive `#e6000b` | 4,81 | 4,41, zakt door AA |
| wit op destructive | 4,81 | — |
| success `#3e6553` | 6,58 | 6,04 |
| warning `#8e5f29` | 5,50 | 5,04 |
| info `#5c697a` | 5,59 | 5,13 |
| ring `#525252` op wit | 7,81, haalt 3:1 | — |
| `#a1a1a1` op wit (niet als ring) | 2,58, zakt door 3:1 | — |
| haarlijn `#e5e5e5` op wit | 1,26, versiering | — |

Donker:

| Tekst | Op `#0a0a0a` | Op muted `#262626` |
| --- | --- | --- |
| foreground `#fafafa` | 18,97 | 14,50 |
| muted-foreground en ring `#a3a3a3` | 7,85 | 6,00 |
| `#0a0a0a` op primary `#39c697` | 9,14 | — |
| wit op primary `#39c697` | 2,17, zakt door AA | — |
| `#0a0a0a` op primary-hover `#4dcba1` | 9,78 | — |
| destructive `#e46767` | 6,07 | 4,64 |
| `#0a0a0a` op destructive `#e46767` | 6,07 | — |
| wit op destructive `#e46767` | 2,56, zakt door AA | — |
| success `#9cc9b4` | 10,77 | 8,24 |
| warning `#ddb588` | 10,41 | 7,96 |
| info `#a9b5c6` | 9,53 | 7,29 |
| `#525252` op `#0a0a0a` (niet als ring) | 2,53, zakt door 3:1 | — |

Fouttekst staat op background of card. In licht is dat wit; op muted zakt `#e6000b` door AA (4,41). Meta mag op muted: `#525252` haalt daar 7,17 en `#a3a3a3` haalt in donker 6,00. Warning op muted haalt 5,04 en success 6,04, dus die badges blijven leesbaar op een grijs vlak. Een fout-badge niet: de pill heeft vulling `bg-background`, zodat het woord nooit op de rij eronder staat. Hover van een rij is daarom geen `bg-muted` onder die badge. Op een scherm met hover is het een haarlijn. Op een tablet is er geen hover-vulling. Een disabled onderdeel is in WCAG uitgezonderd; we kleuren hem toch als muted-tekst op muted, zodat hij in slecht licht leesbaar blijft (7,17 in licht, 6,00 in donker). Geen `opacity-50` en geen `brightness-*`: die maken de gemeten verhouding ongeldig.

### Rand en schaduw

Rand is 1 px `border-border`. Geen 1,5 px, geen 2 px, behalve de focusring.

Schaduw op een kaart en een toast: `0 1px 2px rgb(0 0 0 / 0.05)` (`shadow-sm`). Schaduw op dialoog, sheet en menu: `shadow-lg`. De actieve tab heeft ook `shadow-sm`, omdat hij een wit vlak op de grijze tablijst is. Verder geen schaduw op een knop, een rij of een badge. `shadow-soft`, `shadow-card`, `shadow-card-hover` en `shadow-elevated` zijn oud.

### Radius

De schaal is 8, 12, 16 en 24, via de polar-namen:

| Naam | px | Waar |
| --- | --- | --- |
| `rounded-polar-sm` | 8 | Checkbox-vak, toast |
| `rounded-polar` | 14 | Niet voor nieuw werk |
| `rounded-polar-md` | 12 | Elke control van 44 hoog: knop, veld, select, stapper, tab, menu-item, zijbalk-item, sluitknop van een sheet of dialoog |
| `rounded-polar-lg` | 16 | Kaart, tabel, lege staat, sheet van opzij, menu-paneel |
| `rounded-polar-xl` | 20 | Niet voor nieuw werk |
| `rounded-polar-2xl` | 24 | Dialoog, blad van onderen |
| `rounded-full` | pill | Badge, stip, segment |

Alles wat 44 hoog is en naast elkaar staat, heeft dezelfde hoek. Een zoekveld naast een filterknop is allebei 12. De tablijst is 16 met 4 px padding, zodat de tab van 12 precies in de geneste hoek past (16 − 4).

Geneste radius geldt voor een vlak dat in de hoek van zijn ouder ligt: binnenhoek = max(0, buitenhoek − padding van die ring). Een kaart van 16 met rijen tegen de rand laat de rij de hoek knippen, binnenhoek 0. Een knop die in de padding staat en de hoek niet raakt, houdt 12. Een binnenhoek die de hoek deelt mag niet ronder zijn dan de buitenhoek. Het checkbox-vak is 8. Een geneste berekening zou daar 6 van maken, en 6 zit niet in de schaal. Voor dat vak geldt de geneste regel niet.

`rounded-lg`, `rounded-xl` en `rounded-2xl` zijn niet de schaal hierboven (`lg` is 12, `xl` is 16, `2xl` is 20). Nieuw werk gebruikt de polar-namen of `rounded-full`.

### Typografie

Inter. De rol zet zelf de grootte. `body` is nu 15 px en wordt 16 px in de opruim-PR. Tot die PR leunt een blok niet op de maat van `body`.

| Rol | Maat | Gewicht | Regelhoogte | Tracking |
| --- | --- | --- | --- | --- |
| Paginatitel op 390 | `text-xl` 20 px | 600 | 28 px | `tracking-tight` −0,025 em |
| Paginatitel vanaf 834 | `text-2xl` 24 px | 600 | 32 px | `tracking-tight` −0,025 em |
| Kengetal | `text-2xl` 24 px | 600 | 32 px | normaal, `tabular-nums` |
| Dialoogtitel | `text-lg` 18 px | 600 | 28 px | `tracking-tight` |
| Sectiekop | `text-base` 16 px | 600 | 24 px | `tracking-tight` |
| Rijnaam, knop | `text-sm` 14 px | 500 | 20 px | normaal |
| Veld | `text-base` 16 px | 400 | 24 px | normaal |
| Meta, hint, kolomkop, badge | `text-xs` 12 px | 400, badge 500 | 16 px | normaal |
| Getal in een rij of stapper | `text-sm` 14 px | 600 | `leading-none` | `tabular-nums` |

Eén paginatitel per scherm. Een kengetal is een getal, geen tweede titel. De dialoogtitel is kleiner dan de paginatitel, omdat de dialoog op de pagina ligt.

### Afstand

Alleen 8, 12, 16 en 24.

| px | Waar |
| --- | --- |
| 8 | `gap-2`, `space-y-2`. Tussen icoon en woord. Tussen label en hint. `py-2` als een rij op een smal scherm omklapt. |
| 12 | `gap-3`. Tussen de dingen in één rij: naam en badge, stapper en knop, filterknoppen. |
| 16 | `gap-4`, `p-4`, `space-y-4`. Paginapadding onder `lg`, ook op 390. Binnenruimte van een sectie. Zijkant van een kaart onder `lg`. |
| 24 | `gap-6`, `space-y-6`. Alleen tussen de secties van een pagina. Paginapadding en zijkant van een kaart vanaf `lg`. Padding van een dialoog vanaf `sm`. |

## 3. Atomen en blokken

Staten die voor elk tikbaar onderdeel gelden, tenzij hieronder anders:

- **default** zoals de variant.
- **hover** een stap donkerder of `bg-muted`. Op een muted vlak is de hover `bg-background`, anders verdwijnt hij. Een rij met een fout-badge krijgt geen muted-vulling: daar is de hover een haarlijn, en op een tablet helemaal geen hover-vulling. Geen schaduw, geen groene rand, geen `brightness-*`.
- **focus** de ring-token, 2 px, offset 2. In licht `#525252`, in donker `#a3a3a3`. Geen `outline-none` zonder die ring.
- **active** dezelfde kleur als hover.
- **disabled** zelfde maat, `bg-muted`, tekst muted-foreground, `pointer-events-none`. Geen kleinere knop, geen `opacity-50`.
- **loading** zelfde maat. Een spinner van 16 px vervangt het icoon of staat vóór het label. Het onderdeel is disabled.
- **fout** rand en tekst `destructive`, op background (in licht is dat wit). De melding is één zin plus, als het een mislukte actie is, één keer opnieuw.

### Button

Anatomie: label, optioneel één icoon van 16 px links, gap 8. Hoogte 44 (`h-11`, `size="touch"`), padding horizontaal 16, radius 12, `text-sm` gewicht 500.

Varianten op de werkvloer: `default` (de groene), `outline`, `ghost`, `destructive`. `secondary` en `link` blijven in de code voor bestaande schermen buiten de keuken; nieuw keukenwerk gebruikt ze niet.

Gebruik `default` voor de ene zichtbare groene actie. Een dialoog dekt de pagina af: de groene knop van de dialoog is dan de enige, en de knop erachter telt niet mee. Gebruik `outline` voor een tweede actie met tekst (“Bestellen”, “Opnieuw”). Gebruik `ghost` voor een actie die in een rij herhaalt, of een actie in een lege staat. Gebruik `destructive` voor verwijderen. Die knop is rood, niet een tweede groene.

Niet gebruiken als status. Niet twee gevulde groene knoppen tegelijk in beeld. `sm` (36 px) en `lg` zijn niet voor de werkvloer. De oude `shadow-sm` en `hover:brightness-125` op de knop vervallen, net als `border-1.5` en `hover:border-primary/30`.

### Input

Anatomie: hoogte 44, radius 12, rand 1 px, tekst 16 px, padding horizontaal 12. Achtergrond `bg-background`. Dezelfde hoek als de knop ernaast. 16 px tekst omdat de waarde op armlengte leesbaar moet zijn, en een veld onder 16 px de pagina inzoomt op een telefoon.

Varianten: één regel is 44 hoog. Een textarea begint op twee regels (88) en groeit. Een optie in een select is 44 hoog.

Focus is de ring, niet een groene rand. Fout is `border-destructive` plus de ring in destructive. Placeholder is muted-foreground.

Gebruik voor één waarde. Niet voor een keuze uit twee tot vier pagina-delen (dan tabs).

Vervangt `border-1.5`, `focus:border-primary` en `bg-input-surface` als enig rustvlak.

### Checkbox

Anatomie: het tikvlak is 44×44, het vakje is 20×20, radius 8, rand 1 px. De geneste-radiusregel geldt niet voor dit vak: die zou 6 px geven, en 6 zit niet in de schaal. Het vinkje is lucide `Check`, 12 px.

Aangevinkt: vlak `foreground`, vinkje `background`. Niet primary. Reden: groen blijft de knop. In donker is het vlak `#fafafa` en het vinkje `#0a0a0a`.

Gebruik voor “dit is gedaan” in een afvinkrij. Niet als radiogroep (één uit n is een ander onderdeel, nog niet gebouwd). Niet als statusbolletje.

Vervangt de gevulde cirkel met `border-2`.

### Badge

Anatomie: hoogte 20, `text-xs` gewicht 500, padding horizontaal 8, `rounded-full`, rand 1 px, vulling `bg-background`, tekst in de statuskleur. Optioneel één icoon links, 12 px: `CircleCheck` bij goed, `AlertTriangle` bij let op, `CircleAlert` bij fout. Info heeft geen icoon. Het woord blijft.

Varianten: success, warning, error, info, en een grijze `secondary` zonder betekenis. Geen gevulde groene `default` op de werkvloer.

Eén badge per rij. De pill dekt de rij, zodat het woord op background staat en niet op een muted hover. Geen tweede label en geen stip ernaast.

Niet gebruiken voor een teller (dat is meta-tekst) en niet voor een knop.

### AantalStapper

Anatomie: één rand om het geheel, hoogte 44, radius 12. Min en plus zijn 44×44, `rounded-none`, ghost, icoon 16. Het getal staat in het midden: `text-sm` gewicht 600, `tabular-nums`, `leading-none`. De eenheid is `text-xs` muted, op dezelfde regel, verticaal gecentreerd.

Gebruik naast de bestelknop. De knop is ook 44 hoog. Niet een tweede rand om de plus of de min. Niet de compacte 36 px uit het voorbeeldscherm.

Vervangt de losse plus-minknoppen met elk een eigen rand.

### Card

Anatomie: rand 1 px, radius 16, schaduw `shadow-sm`, achtergrond `bg-card`. Padding 16, vanaf `lg` 24. Eén kop: optioneel één vast icoon, 16 px, muted-foreground, links van de titel. Daarna titel `text-base` gewicht 600, optioneel een teller in meta. Geen beschrijving die de titel herhaalt. Het icoon komt uit de vaste lijst en alleen voor bestelbord, intern, koelcel, vriezer, magazijn, taken of MEP. Geen icoon zonder die betekenis.

Gebruik als de inhoud één groep is: een formulier, of een tabel met een kop. Niet om een losse lijst (die is een sectie). Niet om één knop. Niet in een andere kaart.

Vervangt `shadow-soft`, `shadow-card` en een kaart zonder rand.

### Lijstrij

Anatomie: `min-h-12` (48), padding horizontaal 16, haarlijn onder de rij behalve de laatste. Naam links `text-sm` gewicht 500. Actie rechts. Meta, als die er is, onder de naam in `text-xs` muted-foreground (`#525252` in licht, `#a3a3a3` in donker).

Gebruik voor één kolom feiten plus één actie. Niet als de rij drie of meer vergelijkbare kolommen heeft (dan een tabel, vanaf `md`).

Geen “—” als de meta leeg is. Binnen één lijst heeft elke rij meta, of geen enkele.

### Afvinkrij

Een lijstrij met de checkbox links, naam, optioneel meta, en de voortgang als tekst: “1/3”. Die breuk is een teller, geen tweede status. Geen voortgangsring naast het vakje. De hele rij is het tikvlak (een label van 48 hoog), niet een tweede knop naast het vakje.

Klaar: de naam wordt muted en doorgestreept, het vakje is aangevinkt. Geen extra badge “klaar”.

Gebruik voor een rondje dat je afvinkt. Niet voor een getal (dat is een telrij).

### Telrij

Een lijstrij met de stapper rechts. De stapper heeft één rand. Het getal `tabular-nums`. Geen groene knop in de rij.

Gebruik voor tellen. De optionele knop in de rij is outline, nooit groen. Bestellen is geen telrij: dat is een lijstrij of een tabelrij met dezelfde stapper en een outline-knop.

### Table

Anatomie: vanaf `md`. Kolomkop `h-10`, `text-xs` gewicht 500, muted-foreground, haarlijn. Rij 48, haarlijn, cel padding horizontaal 16. De actiekolom is een ghost-icoon met `aria-label`, 44×44.

Gebruik als er drie of meer vergelijkbare kolommen zijn. Op 390 worden het lijstrijen; de extra kolommen verhuizen naar de meta-regel. Geen horizontale scroll.

Niet voor een afvinklijst of een tellijst. Die blijven rijen op elk scherm.

Vervangt een kaart per rij op tablet en desktop.

### Sectiekop

Anatomie: `min-h-12`, optioneel één vast icoon, 16 px, muted-foreground, links van de titel. Titel `text-base` gewicht 600 `tracking-tight`, optioneel een teller in meta rechts. Zelfde iconen als de kaartkop: alleen bestelbord, intern, koelcel, vriezer, magazijn, taken of MEP. Geen ander icoon.

Gebruik boven een losse sectie. Niet onder een kaartkop die hetzelfde zegt. Niet als paginatitel.

### LegeStaatBlok

Anatomie: gestreepte rand 1 px, radius 16, `bg-muted`, padding 12 verticaal en 16 horizontaal, één zin `text-sm` in foreground, optioneel één ghost-knop. Foreground op muted haalt 18,16 in licht en 14,50 in donker. Geen illustratie, geen emoji, geen grote icoon.

Gebruik alleen na een geslaagde lege uitkomst. Niet tijdens laden. Niet bij een fout.

### Dialog

Anatomie: radius 24, rand 1 px, `shadow-lg`, padding 16 en vanaf `sm` 24. Titel `text-lg` gewicht 600. Sluiten is 44×44, radius 12, icoon foreground, niet `opacity-70`. Eén bevestiging in de footer, rechts: groen, of rood als het verwijderen is. Links daarvan een ghost “Annuleren”.

Gebruik voor een korte bevestiging of een klein formulier dat de pagina blokkeert. Niet voor een lang formulier (dat is een sheet of een pagina). Niet voor informatie die in de rij past.

### Sheet

Anatomie: een sheet van opzij heeft radius 16 aan de open zijde. Een blad van onderen heeft bovenhoeken 24, gelijk aan de dialoog. Rand 1 px, `shadow-lg`, dezelfde titelregel als de dialoog. Sluiten is 44×44, radius 12, icoon foreground, niet `opacity-70`.

Gebruik voor een formulier of een rij-detail dat de lijst in beeld laat. Niet als er al een dialoog open is.

### Tabs

Anatomie: de lijst is `bg-muted`, radius 16, padding 4. Een tab is minstens 44 hoog, radius 12. Met 4 px padding valt die hoek gelijk met de lijst (16 − 4). Actief: vlak `bg-background`, `shadow-sm`, tekst foreground. Inactief: muted-foreground. Geen groene rand.

Gebruik voor twee tot vier echte pagina-delen (Bestellen, Tellen). Niet voor filters (dat is een outline-knop) en niet voor meer dan vier (dan een rij of een menu).

### Toast

Anatomie: radius 8, rand 1 px, `shadow-sm`, titel `text-sm` gewicht 500, uitleg `text-xs`. Fout gebruikt destructive tekst. Geen tweede toast over dezelfde actie.

Gebruik voor een bevestiging die de pagina niet blokkeert. De actie in de toast is ghost of outline, niet een tweede groene knop. Niet voor een fout die de gebruiker moet oplossen voor hij verder kan (die staat bij het veld of als foutblok).

## 4. Pagina

De paginakop heeft de enige titel. Op 390 is die `text-xl` (20 px), zodat titel en groene knop op één regel passen. Vanaf 834 is het `text-2xl` (24 px). Allebei gewicht 600 `tracking-tight`, daaronder één regel meta. Een kengetal blijft `text-2xl` en is geen titel. Op 390 is dat groter dan de paginatitel. De actie staat rechts van de titel. Tabs of filters staan op de regel eronder en zijn geen tweede kop. De shell (hoofdstuk 5) draagt het kruimelpad, de locatie en het account, niet deze titel. `Paginakop` tekent vandaag alleen de tabregel en de actie; de titel staat erboven tot dat component de titel zelf krijgt.

Eén groene knop in beeld. Staat hij in de kop, dan is elke andere knop outline of ghost. Staat hij nergens, dan heeft de pagina geen primaire actie. Een open dialoog dekt de pagina: alleen de knop in de dialoog telt.

Een kaart als de groep één ding is (formulier, tabel met kop). Een losse sectie als het een lijst is: 24 px onder de vorige, een haarlijn, een sectiekop. Nooit allebei voor dezelfde groep.

Een tabel vanaf `md` bij drie of meer kolommen. Rijen op 390, en op elk scherm voor afvinken en tellen.

Breedtes waarop je nakijkt: 390, 834 en 1280. De CSS-breuken zijn `sm` 640, `md` 744, `lg` 1024, `xl` 1280. De tabel verschijnt dus op 834.

Elke pagina die data haalt heeft de drie blokken: skelet op rijhoogte 48 tijdens laden, het lege blok na een geslaagde lege lijst, een foutblok met één zin en één keer opnieuw. Het foutblok is geen lege staat.

Iconen zijn lucide, 16 px (`h-4 w-4`), stroke 2. Een icoon vervangt het label alleen bij een actie die in elke rij terugkomt (meer, plus, min, zoeken als het veld het label draagt), met `aria-label`. Een primaire of destructieve knop heeft altijd een woord. Een icoon dat alleen uitleg geeft, opent op tik, niet op hover. De ingeklapte zijbalk is de uitzondering uit hoofdstuk 5: het icoon heeft een `aria-label`, en het kruimelpad blijft de leesbare naam.

Vaste betekenis: `ClipboardList` bestelbord, `ArrowLeftRight` intern, `Refrigerator` koelcel, `Snowflake` vriezer, `Warehouse` magazijn, `ListChecks` taken, `ChefHat` mise-en-place, `CalendarClock` datum, `AlertTriangle` let op, `CircleAlert` fout, `CircleCheck` goed, `Plus` toevoegen, `MoreVertical` meer, `Search` zoeken, `Info` uitleg.

De shell staat in hoofdstuk 5. Zij tekent geen paginatitel.

## 5. App-shell

Yorick kiest shell 2: sidebar-07, inklapbaar. Dit hoofdstuk is het besluit.

Eén shell voor elk scherm dat nu `SidebarLayout` of `KitchenLayout` gebruikt. De opbouw volgt shadcn sidebar-07 en dashboard-01: een zijbalk die kan inklappen, groepen, de gebruiker onderin, en een bovenbalk met trigger en kruimelpad. Twee dingen daarvan nemen we niet over. De zijbalk van de huidige dashboard-01 zweeft als inset, met marge en een eigen hoek; dat is een tweede kader, en de shell is geen groep die een kaart nodig heeft. De menuknoppen van shadcn zijn 32 px hoog; op de vloer is de rij 48.

De primitive blijft `src/components/ui/sidebar.tsx`. Die kent al de breedte 16rem (256 px) en de rail van 3rem (48 px). De nieuwere dashboard-01 gebruikt 18rem. We houden 16rem, omdat op 834 anders te weinig overblijft voor de tabel. 256 en 48 zijn maten van de shell, geen stap uit de reeks 8/12/16/24. De kleuren van de shell zijn background, foreground, muted en border. `bg-sidebar` en `text-sidebar-foreground` in de primitive worden die rollen. Geen eigen sidebar-palet.

### Zijbalk

Vanaf `md` (dus op 834 en op 1280). Volle hoogte, tegen de rand, haarlijn rechts, geen radius, geen schaduw, geen marge. Open is 256 px. Ingeklapt is een rail van 48 px. De begintoestand is open, ook op 834. Een tablet heeft geen hover, en een rail van alleen iconen zegt dan niets. De gebruiker mag inklappen; die keuze blijft bewaard. Onder `md` is er geen zijbalk.

De kop is één rij van 48. Links het beeldmerk in een vak van 44, daarin hooguit 32 px hoog. Daarnaast de locatie. Geen losse woordmerk van 54 px boven het menu; dat beeldmerk hoort op het inlogscherm.

**Locatie.** Midsland en West, alleen als deze gebruiker beide heeft. Anders is het een label, geen knop. De knop is ghost, 44 hoog, met de twee namen voluit. Niet groen, niet `bg-primary/10`. Wisselen tekent het menu opnieuw vanuit `useNavigatieItems`. Bestaat de open pagina daarna niet meer voor die locatie, dan ga je naar `/dashboard`. Op de rail is het een icoonknop van 44 met `aria-label` “Vestiging, nu West” of “Vestiging, nu Midsland”.

**Groepen.** Overzicht, Keuken, Voorraad, Beheer, in die volgorde. Een groep zonder zichtbare items valt weg. Het label is `text-xs` muted, als een zin (“Keuken”), niet in kapitalen. De items komen alleen uit `useNavigatieItems`. De shell voegt geen bestemming en geen rechten toe.

**Item.** Rij 48, radius 12, de hele rij is het tikvlak. Icoon 16 px, stroke 2, gap 8, label `text-sm` gewicht 500. Actief: `bg-muted`, tekst foreground, `aria-current="page"`. Niet primary, geen groene ring. Eén actief item, op de regel die `isNavActief` al gebruikt. Hover is muted, focus is de ring. Ingeklapt: het icoon zit in een knop van 44, met `aria-label` en een tooltip met de naam. De tooltip is extra. Het kruimelpad blijft de leesbare naam.

Twee items delen geen icoon. `Settings` is alleen Instellingen. Voorraadketen, koelwerkbank en onderhoud hebben nu hetzelfde icoon als een ander item; dat staat bij de open punten.

**Gebruiker onderin.** Haarlijn erboven. Naam `text-sm`, daaronder e-mail of rol in `text-xs` muted. De rij is 48 en opent een menu: thema en uitloggen. Uitloggen is geen losse knop van 36 naast de rij, en geen groene knop. Ingeklapt blijft één knop van 44 die hetzelfde menu opent.

### Bovenbalk

Hoogte 64, `bg-background`, haarlijn onder, geen schaduw. Zij blijft 64 als de zijbalk inklapt. Links: de trigger van 44 (inklapen of uitklappen), een scheider, het kruimelpad. Het kruimelpad is `text-sm`: de groep in muted, de huidige pagina in foreground. Een geneste pagina krijgt de tussenstap erbij (Keuken / Recepten / Recept bewerken). Het laatste kruimel is geen link. Het mag hetzelfde woord zijn als de paginatitel, maar het is geen tweede titel en nooit `text-2xl`. De shell tekent geen `h1`.

Rechts, vanaf `md`: de datum als `text-sm` muted. Geen knop. Op 390 niet, daar is de balk het kruimelpad en de locatienaam. De locatienaam staat als tekst in de balk zolang er geen open zijbalk is, zodat je West of Midsland leest zonder een rail te verklaren. De wissel zelf zit niet in deze balk. De groene knop van de pagina zit niet in deze balk.

Heeft een pagina nog geen eigen titel, dan is het laatste kruimel de enige naam en blijft dat `text-sm`. De shell vult daar geen `h1` voor in.

`hideHeader` vervalt. De balk heeft geen titel, dus een pagina hoeft hem niet te verbergen om een dubbele kop te voorkomen.

### 390

Onderbalk, plus een blad voor de rest. Niet de zijbalk als sheet, wat shadcn op een smal scherm doet. Reden: Bestellen, Taken en MEP wissel je met één duim, terwijl de lijst in beeld blijft. Een sheet dekt de lijst en kost een tweede tik. De vier bestemmingen blijven de vier uit `mobieleNavigatie`: Start, Taken, MEP, Bestellen, plus Meer. Geen tweede lijst van wat belangrijk is.

De balk is 64 hoog, plus de safe-area, haarlijn boven, `bg-background`. Vijf vakken, elk minstens 44 breed. Icoon 16 px, stroke 2, label `text-xs` eronder. Actief is foreground op muted, niet `text-primary`. Het icoon wordt niet dikker als het actief is.

Meer opent een blad van onderen, hooguit 85 dvh, bovenhoeken 24. Daarin dezelfde groepen, de locatiewissel, en de gebruiker met thema en uitloggen. De wissel staat niet in de onderbalk: een mis-tik midden in de service bestelt voor de andere locatie. De locatienaam staat wel als tekst in de bovenbalk, zodat je ziet waar je bent zonder Meer te openen.

De inhoud houdt onderaan 16 px over, plus de balk van 64, plus de safe-area. Niets blijft onder de balk liggen.

### 834 en 1280

Geen onderbalk. De zijbalk is de navigatie, begintoestand open (256 px). Op 834 blijft dan 578 px voor de inhoud, genoeg voor de tabel die vanaf `md` verschijnt. Op 1280 is de zijbalk ook open. Inklappen is overal dezelfde rail van 48.

De inhoud heeft geen maximale breedte. Een bestelbord en een tabel gebruiken de ruimte die de zijbalk overlaat. Padding van de inhoud is de paginaregel: 16 onder `lg` (dat is 390 en 834), 24 vanaf `lg` (dat is 1280). De bovenbalk valt buiten die padding.

### Wat vervangen wordt

- `src/components/polar/Sidebar.tsx` — zwevende kaart van 230 px, ingeklapt 76 px, radius 20, schaduw, itemhoogte 42, actief in `bg-primary/10`. Vervalt. De shell gebruikt `ui/sidebar`.
- `src/components/polar/Header.tsx` — de `h1` met de paginanaam, de datum, en de locatiewissel in het groen (`bg-primary/10`). Vervalt. Locatie gaat naar de zijbalk, de titel naar de pagina.
- `src/components/AppSidebar.tsx` — de lijm op `PolarSidebar`, inclusief uitloggen als `h-9` en het logo op `h-[54px]`. Blijft de lijm, maar op `ui/sidebar`, met dezelfde `useNavigatieItems`.
- `src/components/SidebarLayout.tsx` — `getPageTitle` als kop, `md:px-10` (40 px) en `lg:px-16` (64 px), en `--app-canvas` als pagina-kleur. De padding wordt 16 of 24. De pagina-kleur wordt `bg-background`.
- `src/components/MobielOnderbalk.tsx` — de balk van 64 blijft. Weg: icoon van 20 px, stroke 1,75 of 2,25, en actief in `text-primary`.
- `src/components/MobielMeerBlad.tsx` — het blad blijft. Het vinkje bij de locatie is niet primary.
- `src/components/kitchen/KitchenLayout.tsx` — tweede shell, met een gecentreerde titel, `max-w-5xl` en een logo van 48 tot 64 px. MEP gebruikt `SidebarLayout` op elke breedte.
- `src/components/pura/PageSubheader.tsx` — de commentaar zegt dat `PolarHeader` de enige titel is. Dat is de regel die vervalt. De actie hoort in de paginakop.

## 6. Verboden

- Geen `#hex` en geen `rgb(` in `className` of in een `style` op een component. Tokens horen in `src/index.css`.
- Geen `rounded-[..]`, geen `text-[..]`, geen `h-[..]` voor een maat die de schaal al heeft.
- Geen `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-polar` (14) of `rounded-polar-xl` (20) in nieuw werk.
- Geen kaart in een kaart. Geen schaduw op een knop, een rij of een badge. De actieve tab is de uitzondering: `shadow-sm` op het pagina-vlak.
- Geen tweede kop voor dezelfde groep. Geen paginatitel in de app-balk én in de pagina.
- Geen twee statuslabels per rij. Geen stip én een badge. Geen “—” voor ontbrekende meta.
- Geen tweede gevulde groene knop. Geen primary op een vinkje, een tab, een link of een badge.
- Geen `gap-5`, `space-y-5` of `p-5` (20 px zit niet in de schaal). `space-y-4` is 16 en mag binnen een sectie. `space-y-6` alleen tussen secties.
- Geen `brightness-*` en geen `opacity-50` op een knop. Geen `hover:-translate`.
- Geen horizontale scroll om een tabel te redden.
- Geen illustratie of emoji in een lege staat.
- Geen icoon-knop zonder `aria-label`. Geen primaire knop die alleen een icoon is.
- Geen nieuwe donkere token-soort.

## 7. Opruimlijst

Per bestand het oude dat weg moet of om moet, zodra dat scherm of die laag aan de beurt is. Dit boek verwijdert het niet. De lijst beschrijft `main` nu. De shell staat uitgewerkt in hoofdstuk 5; de bestanden daar zijn `polar/Sidebar.tsx`, `polar/Header.tsx`, `AppSidebar.tsx`, `SidebarLayout.tsx`, `MobielOnderbalk.tsx`, `MobielMeerBlad.tsx`, `kitchen/KitchenLayout.tsx` en `pura/PageSubheader.tsx`.

**Tokens, `src/index.css`.** `:root` is nog het warme canvas: `--background` `45 8% 95%`, `--foreground` `220 26% 14%`, `--secondary` `163 30% 95%` (groen getint), `--muted` `40 5% 95%`, `--muted-foreground` `220 9% 46%`, `--destructive` `0 84% 60%`, `--border` `40 6% 88%`, `--ring` gelijk aan primary, `--success` `160 60% 45%`, `--warning` `38 92% 50%`, `--info` `217 91% 60%`. `--shadow-card` is een zware stapel, `--shadow-card-hover` ook. Het commentaar bij primary noemt `#1B7867`; de HSL rekent naar `#176d55`. `.dark` zet success gelijk aan primary en de ring op groen. `.pura-theme-v3` is het voorbeeld van de neutrale set, maar zijn muted-foreground (`0 0% 45.1%`, `#737373`) en ring (`0 0% 63.1%`, `#a1a1a1`) wijst dit boek af. `--notification-badge` en `--sidebar-bg`, `--sidebar-active`, `--sidebar-hover` zijn eigen kleuren en vervallen. De voorbeeldklasse verdwijnt als `:root` en `.dark` de waarden uit hoofdstuk 2 hebben.

**`tailwind.config.ts`.** `boxShadow.soft`, `boxShadow.card`, `boxShadow.elevated` en `boxShadow.hover` vervallen met hun laatste gebruiker. `borderWidth.1.5` vervalt met de velden die hem nog zetten. De radius-aliassen `xl` → 16 en `2xl` → 20 blijven een valkuil; nieuw werk gebruikt ze niet. `notification.badge` en `sidebar.bg`, `sidebar.active`, `sidebar.hover` vervallen met de tokens.

**Atomen die de regel nog niet halen**

- `src/components/ui/button.tsx` — `shadow-sm`, `hover:brightness-125`, `rounded-polar-lg` (16, doel is 12), outline en secondary met `border-1.5` en schaduw, secondary krijgt `hover:border-primary/30`. `default` is `h-12`, `sm` is `h-9` (36 px). De werkvloer gebruikt `touch` (`h-11`). `link` is `text-primary`.
- `src/components/ui/input.tsx`, `select.tsx`, `textarea.tsx` — `h-10` (40 px), `border-1.5`, `rounded-polar-lg` (16). Doel is radius 12, focus via de ring, tekst `text-base`.
- `src/components/ui/checkbox.tsx` — cirkel `rounded-full border-2`, gevuld met primary, geen vinkje, tikvlak 20 px. Doel: vak 20 in een tikvlak van 44, radius 8, aangevinkt `bg-foreground`.
- `src/components/ui/badge.tsx` — `default` is gevuld primary. Statusvarianten zijn gevuld (`bg-success/15` en zo) in plaats van een outline-pill. `pending` is een tweede warning. `px-2.5` is 10 px.
- `src/components/ui/card.tsx` — `shadow-soft`. Doel is `shadow-sm` en een rand van 1 px.
- `src/components/ui/tabs.tsx` — actieve tab heeft `border-primary/20`. De schaduw `shadow-sm` mag blijven. De groene rand niet.
- `src/components/ui/sheet.tsx` — sluiten is een icoon van 16 px met `opacity-70`, zonder tikvlak van 44. `dialog.tsx` heeft het tikvlak al (`h-11`) en houdt `opacity-70`.
- `src/components/ui/dropdown-menu.tsx` — focus is `bg-primary/10 text-primary`, schaduw is `shadow-elevated`. Doel: focus `bg-muted`, schaduw `shadow-lg`.
- `src/components/ui/sonner.tsx` — de actieknop is `bg-primary`. Doel: ghost of outline.
- `src/components/ui/table.tsx` — de wrapper is `overflow-auto`. Een werkvloer-tabel scrollt niet horizontaal; onder `md` wordt het een lijst.
- `src/components/ui/progress.tsx` — `h-4`. In een kaart is de balk `h-1` (`VoortgangBalk` doet dat al).
- `src/components/ui/slider.tsx` — `h-1.5`, buiten de schaal.
- `src/components/kitchen/IngredientCombobox.tsx` — `border-1.5`.

**Bouwblokken, `src/components/pura/canoniek.tsx`**

- `Paginakop` tekent geen titel. De commentaarregel zegt “geen titel”. Dat is de regel die vervalt.
- `Lijstrij`, `Afvinkrij` en `Telrij` zetten via `RijMeta altijd` een “—” als de meta leeg is.
- `Sectiekop` is `text-sm`, niet `text-base`, en zet `VoortgangRing` in `stroke-primary`. De ring verdwijnt; de teller wordt tekst. Een icoon mag alleen als het een vaste plek is (bestelbord, intern, koelcel, vriezer, magazijn, taken, MEP), 16 px, muted-foreground.
- `AantalStapper` heeft de buitenrand, maar de plus en de min erven de radius van de knop. Doel: `rounded-none` op die twee, één rand om het geheel.
- `LegeStaatBlok` is `py-6`, gecentreerd, zin in muted, optioneel een icoon van 20 px. Doel: het compacte gestreepte blok.
- `Statusbadge` mag elk statusicoon in de pill zetten. Doel: het woord blijft, en hooguit één van `CircleCheck`, `AlertTriangle` of `CircleAlert` op 12 px.
- `Werkkaart` zet een willekeurig icoon in de kop. Doel: hooguit het vaste plek-icoon, 16 px, muted-foreground, plus titel en teller.

**Dubbele systemen**

- `src/components/pura/EmptyState.tsx` — illustratie, `shadow-card`, `text-[15px]`.
- `src/components/kitchen/EmptyState.tsx` — `p-8 shadow-soft`, icoonvlak in `bg-primary/5`.
- `src/components/pura/StatusBadge.tsx` — tweede pill naast `ui/badge`.
- `src/components/pura/SegmentedTabs.tsx` — actieve tab is gevuld primary, radius `rounded-polar-xl`. Staat als deprecated en wordt nog gebruikt. Vervangen door `ui/tabs`.
- `src/components/pura/StatCard.tsx` — `shadow-card`.
- `src/components/polar/` — oud naast `ui` en `pura`: `DatePicker`, `Dialog`, `Header`, `KPICard`, `Radio`, `Sidebar`, `Textarea`, `TimePicker`, `Tooltip`, plus `Alert`, `Avatar`, `Checkbox`, `FormCard`, `ModernKPICard`, `Progress`, `SetupCard`, `Skeleton`, `Table`. Geen nieuwe importeurs. `Tooltip.tsx` en `colors.ts` hebben een eigen hex.

**Schermen en bladen die de schaal nog niet volgen.** `radius` is `rounded-[..]`, `type` is `text-[..]`, `schaduw` is `shadow-soft`, `shadow-card` of `shadow-elevated`, `hex` is een kleur buiten de tokens. `h-[44px]` wordt `h-11`. Een `max-h-[calc(...)]` voor het scherm blijft. Testbestanden en `src/index.css` staan hier niet nog eens.

- `src/App.css` — hex.
- `src/components/HandoverCard.tsx` — radius, schaduw.
- `src/components/NotificationsDropdown.tsx` — type, schaduw.
- `src/components/PWAInstallHint.tsx` — radius, schaduw.
- `src/components/PincodeNumpad.tsx` — type.
- `src/components/ProtectedRoute.tsx` — radius.
- `src/components/ThemeToggle.tsx` — type.
- `src/components/auth/HerstelKnop.tsx` — type.
- `src/components/auth/StartScherm.tsx` — type.
- `src/components/cijfers/` — `BackfillProgressDialog`, `BronnenBlok`, `CijfersHeatmap`, `CijfersHoofdgrafiek`, `CijfersLoonkostenBar`, `CijfersLoonkostenDoelGrafiek`, `CijfersLoonkostenGrafiek`, `CijfersLozeUren`, `CijfersMetricsBar`, `CijfersTooltip`, `CijfersUrenVergelijk`, `CijfersUurverloop`, `CijfersVestigingSplit`, `CijfersWeekdagVergelijk`, `DemoBanner`, `SyncStoringBlok`. Hex in `CijfersLoonkostenGrafiek` en `CijfersUurverloop`.
- `src/components/dashboard/` — `AIWeatherAdvisor` (hex), `IdeaBox`, `TerschellingEventsCard`, `WasteAlertBanner`, `WasteCalendarCard`, `WeatherWidget`.
- `src/components/foh/` — `AfvinkRonde`, `BainMarie`, `FalafelAanvulRij`, `FohTasks`, `InfoKnop`, `KetenLijstRij`, `TaakVervolgPaneel`, `VoorraadRonde`, `VriezerNaarKoelcelRij`. `AfvinkRonde` tekent het vinkje nog zelf: `h-[26px]`, `rounded-[6px]`, `rounded-[14px]`, `text-[13px]`, en een knop in `bg-primary/10`.
- `src/components/kassa/DagBeoordelingDialog.tsx` — radius.
- `src/components/keten/` — `FixlijstTab`, `InterneProductenBeheer`, `MethodesTab`.
- `src/components/kitchen/` — `AllergenenBadges`, `MepAfrondDialog`, `MepDagKiezer`, `MepPerPersoon`, `MepTaakBewerken`, `MepTaakToevoegen`, `MepToevoegenDialog`, `MethodesKaart`, `bestelbord/RegelInfo`.
- `src/components/maintenance/` — `NewTicketForm`, `TicketDetail`, `TicketList`.
- `src/components/personeel/` — `HousingCard`, `HousingOccupancyStrip`. `ColorPickerModal`, `PlanningBlock` en `src/lib/personeel-utils.ts` bewaren een dienstkleur als data. De chrome eromheen volgt de tokens; de gekozen kleur blijft data.
- `src/components/voorraad/` — `BakmaatKiezer`, `BakmaatUitleg`, `KastOverzicht`, `KetenPerProduct`, `LadeGrid`, `LadePositie`, `PlekItemsBeheer`.
- `src/components/ui/calendar.tsx` — type. `scroll-area.tsx` — radius. `chart.tsx` — hex en radius; een reeks gebruikt de `--chart-*` tokens uit hoofdstuk 2, niet een hex in het component.
- `src/pages/Auth.tsx` — radius, type, `shadow-card`, `hover:-translate-y`, focusring in primary.
- `src/pages/auth/SetPassword.tsx` — radius.
- `src/pages/Cijfers.tsx` — hex, type.
- `src/pages/LightspeedCallback.tsx` — radius, schaduw.
- `src/pages/kitchen/` — `Ingredienten`, `KitchenMenu` (hex), `MepBeheer`, `MepDag`, `MepPlanning`, `MepWeek`, `RecipeDetail`, `RecipeForm`, `SnelPrinten`.
- `src/pages/personeel/` — `Collegas`, `PersoneelLayout`, `PersoneelSettings` (hex), `Tijdlijn`, `WonenDetail`.
- `src/pages/settings/MepInstellingen.tsx` — type.
- `src/preview/TaakVervolgVoorbeeld.tsx` — radius, type.
- `src/pages/DesignPreview.tsx` en `src/pages/StyleGuide.tsx` — oude galerijen met `#1B7867` en een eigen schaal. Ze wijken voor `/design-system`.
- `src/pages/design-system/Regelboek.tsx`, `Canoniek.tsx` en `ShadcnVoorbeeld.tsx` — tonen nog het vorige boek: geen paginatitel, lege staat met `py-6`, primary als `#1B7867`. Ze worden herschreven naar dit boek, in een latere PR. De “niet”-voorbeelden mogen de verboden vorm blijven tonen, als voorbeeld van wat niet mag.

## 8. Open punten

1. **Meta op `#525252` in plaats van het shadcn-grijs `#737373`.** Advies: hou `#525252`. Het shadcn-grijs zakt op muted door AA (4,35:1). Op `main` staat muted-foreground nog op `220 9% 46%`, en in `.pura-theme-v3` op `#737373`. Allebei wijken af van dit boek.
2. **Het vinkje in de tekstkleur in plaats van groen.** Advies: `foreground`, niet primary. Groen blijft de knop. In donker wordt het vak licht, anders verdwijnt een zwart vak op zwart.
3. **`body` wordt 16 px.** Besloten. De opruim-PR zet `body` van 15 px naar 16 px. De rollen blijven 14 voor een rij en 16 voor een veld en een sectiekop.
4. **Of de keuken donker überhaupt gebruikt.** De waarden staan in hoofdstuk 2, omdat de lichte ring en het lichte olijfgroen op bijna-zwart door AA zakken. Advies: de tokens vastleggen, geen donker scherm bouwen tot iemand daar werkt.
5. **Drie lege staten.** Advies: `LegeStaatBlok` wint, nadat hij zelf het compacte blok is geworden. `pura/EmptyState` en `kitchen/EmptyState` verdwijnen per scherm.
6. **Dienstkleuren in het rooster.** Advies: de gekozen kleur blijft data in `PlanningBlock` en de kleurkiezer. Alleen de chrome (rand, tekst, tikvlak) gaat naar de tokens.
7. **Menu-iconen.** Besloten. Instellingen houdt `Settings`, Bestelbord houdt `ClipboardList`. Voorraadketen krijgt `Network`, koelwerkbank `Refrigerator`, onderhoud `Wrench`.

## Checklist voor een PR die dit boek uitvoert

Het scherm zelf kijkt Yorick na. De PR zegt in tekst:

- welk bestand uit de opruimlijst is aangepakt, en wat er stond;
- dat de maten 44 en 48 zijn, met de klasse erbij;
- dat er één groene knop is, of geen;
- dat leeg, laden en fout drie blokken zijn;
- dat `npm run lint`, `npm run typecheck` en `npm run build` slagen.

Geen migratie, geen wijziging aan een scherm dat de PR niet noemt, niet mergen voor hij het gezien heeft.
