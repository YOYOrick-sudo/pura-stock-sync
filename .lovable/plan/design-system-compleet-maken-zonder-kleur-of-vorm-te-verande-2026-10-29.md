# Design system compleet maken (zonder kleur of vorm te veranderen)

Kleuren, afronding en schaduw blijven precies zoals nu. Het plan maakt het systeem completer, ruimt tegenstrijdige regels op en legt het vast in werkende bouwblokken. Op de Bestellijst wordt dat getest.

## Wat ik van shadcnblocks overneem (dashboard, application shell, multi-pane)
Ik neem alleen de opbouw over, niet de kleuren of de vormen.
1. **Kaartkop-patroon:** links een klein icoon + titel + telbadge ("Recent Orders 12"), rechts één compacte keuze of actie. Elke kaart gebruikt hetzelfde.
2. **Kengetal met context:** een groot getal, één meta-regel eronder ("op 18 regels") en eventueel één kleine verschilbadge rechtsboven. Nooit meer dan dat.
3. **Tabel ín een kaart:** de tabel loopt van rand tot rand, met lichte kolomkoppen en een voetregel ("1–6 van 12", of "Toon alles"). Dus geen tabellen los op de achtergrond.
4. **Paginakop als dunne balk:** links titel + subtitel, rechts filterchips en één actie. Wij houden de titel in de app-header, dus hier komen alleen de subtitel en de acties.
5. **Multi-pane:** de lijst links, details in een paneel rechts (iPad liggend) in plaats van een pop-up. Op smallere schermen wordt dat een zijlade.
6. **Zijmenugroepen:** een klein groepslabel, de items met tellers rechts uitgelijnd. Dit wordt alleen een regel voor later, niet nu.
7. **Dichtheid:** dunne randen, weinig schaduw, consequente afstand van 16px binnen een kaart en 12px tussen de rijen. De getallen staan rechts uitgelijnd en hebben gelijke breedte.
8. **Status:** zachte badges ("Delivered", "Shipped") alleen in een vaste statuskolom, nooit naast de naam.

Wat ik bewust niet overneem: zwart-wit grafieken, Engelse labels en de dichte 13px-tekst. Die past niet bij natte handen op een iPad; wij houden rijen van 44–48px.

## Analyse: wat er nu misgaat

**1. Drie families onderdelen naast elkaar**
- `components/polar` wordt in 8 schermen gebruikt (KPI-kaart, tabel, dialog, tooltip, enz.).
- `components/pura` wordt in 9 schermen gebruikt (SegmentedTabs, StatCard, StatusBadge, EmptyState, PageSubheader).
- `components/layout/Paginapatronen` is net door mij toegevoegd en doet deels hetzelfde als pura (EmptyState, StatusBadge, tabs).
- Daarnaast is er de shadcn-basis in `components/ui`.
- Gevolg: voor tabs, statuslabels, kengetallen en lege staten bestaan twee tot drie varianten, en elke module kiest er een.

**2. Regels die elkaar of de code tegenspreken**

| Regel in geheugen of kennis | Werkelijkheid in de code |
|---|---|
| Kaarten 20px, knoppen 14px, dialogs 24px | Kaarten **en** knoppen gebruiken 16px (`polar-lg`), dialogs elders 24px |
| Iconen 20px in kaarten | De knop dwingt 16px af op alle iconen |
| Tikdoel minimaal 44px | Standaardinvoer en standaardknop zijn 40px hoog; per scherm wordt `h-11` overschreven (212 keer) |
| Info-icoon met vaste kleur `#E6F4F1` | Een vaste kleurwaarde, in strijd met "alleen tokens" |
| SegmentedTabs: "losse pill-knoppen, actief groen gevuld" | Botst met de nieuwe regel: aaneengesloten balk, alleen het gekozen tabblad gevuld en wit |
| "Samenvattingskaarten rechts" (meervoud) | De nieuwe regel is één overzichtskaart |
| KPI-kaart met trendpijl (polar) | Past niet meer bij "geen getal dubbel, rustig" |

**3. Willekeur in de schermen** (telling in de code)
- Afronding wordt in 14 vormen geschreven. Naast de tokens zijn er 56× `rounded-[20px]`, 33× `rounded-[14px]`, 21× `rounded-[12px]` en 15× `rounded-[10px]` als losse waarden.
- Hoogtes van bedieningselementen lopen door elkaar: 8, 9, 10, 11, 12 en 14.
- 35 bestanden bevatten vaste kleurwaarden of inline kleuren.

**4. Wat mist in het design system**
Er zijn geen voorbeelden voor de onderdelen die je bij shadcnblocks zo fijn vindt:
- paginakop met acties;
- filterbalk (zoeken + filters + weergave);
- datatabel met selectie, sorteren en lege of ladende staat;
- detailpaneel als zijlade (sheet);
- formulier in secties;
- instellingenlijst;
- bevestigingsdialoog;
- lijst op mobiel;
- melding na actie;
- laadskelet per patroon.

Ook ontbreken regels voor dichtheid, het verschil tussen telefoon en iPad, toetsenbord en focus, en de tekst van knoppen en meldingen.

**5. Bestellijst (testpagina)**
- Hij gebruikt nog losse tikgroottes.
- De tooltips staan per rij.
- Er zijn geen laad- en foutstaten in hetzelfde patroon.
- Geleverd en Niet nodig hebben elk een eigen inklapstijl.
- De Tellen-tab volgt de tabelopbouw nog niet.

## De oplossing

### A. Eén bron, één familie
- `components/ui` (shadcn) blijft de basis.
- Daarboven komt één laag `components/pura` voor alle Pura-patronen. Mijn `layout/Paginapatronen` gaat daarin op, dus er komt geen derde map.
- `components/polar`: niets breekt. Hij wordt gemarkeerd als "oud, niet gebruiken voor nieuw werk". Bestaande schermen zetten we later stap voor stap om, alleen op jouw verzoek.

### B. Tokens vastleggen zoals ze nu zijn (geen visuele wijziging)
- **Afronding:** de bestaande waarden krijgen namen:
  - `rounded-polar-lg` (16) voor kaarten, knoppen en invoer;
  - `polar-md` (12) voor binnenvlakken;
  - `polar-2xl` (24) voor dialogs;
  - `rounded-full` voor stippen en badges.
  - De onjuiste regel "kaart 20 / knop 14" verdwijnt.
- **Hoogte bediening:**
  - standaard 44px (`h-11`) voor tikken;
  - compact 36px (`h-9`) alleen voor acties in groepsrijen;
  - rij 48px.
  - Dit wordt een `size`-variant op knop en invoer (`size="touch"`), zodat schermen niet meer zelf `h-11` hoeven te zetten. De standaardmaat zelf verandert niet, om bestaande schermen niet te verschuiven.
- **Iconen:** 16px in knoppen en rijen, 20px in kaartkoppen, 24px alleen voor grote kengetallen.
- **Tekst:** vier niveaus (paginatitel, sectiekop, rij, meta) plus een getalstijl voor kengetallen.
- **Status:** goed, let op, fout, info en neutraal, steeds via StatusDot of StatusBadge. Nooit allebei op één rij.

### C. Volledige set Pura-bouwblokken (in de stijl van shadcnblocks, met onze kleuren)
1. **Paginaopbouw:** paginakop met acties rechts (geen eigen H1); inhoud links met een overzichtskaart rechts; op mobiel komt het overzicht onderaan, ingeklapt.
2. **SegmentTabs** (één versie): aaneengesloten balk, alleen het gekozen tabblad wit gevuld, met icoon en teller. De oude losse pill-variant wordt hierheen omgeleid.
3. **Filterbalk:** zoekveld, maximaal twee filters, en rechts één actie.
4. **Lijsttabel:** kolomkoppen één keer, groepsrijen met een optionele actie, een selectiekolom van 44px, een menukolom, een lege staat, een laadskelet en een foutregel met "Opnieuw". Op mobiel worden het kaartrijen zonder zijwaarts scrollen.
5. **Overzichtskaart:** maximaal drie kengetallen met een tabel eronder (vervangt de StatCard- en KPI-varianten voor nieuw werk).
6. **Invoerbalk:** snelle invoer in één vlak.
7. **Detailzijlade:** opent bij een tik op een rij (iPad: rechts, telefoon: van onderen). Hier komen de details en het bewerken.
8. **Formulier in secties:** label boven het veld, uitleg via het i-icoon, opslaan onderaan vast.
9. **Bevestigen:** alleen bij verwijderen of archiveren, met een rode knop.
10. **Melding na actie:** kort ("Opgeslagen"), met "Ongedaan maken" waar dat kan.
11. **Inklapgroep:** één stijl voor "Geleverd (n)", "Niet nodig (n)" en "Overige (n)".
12. **Lege staat, laadstaat en foutstaat:** per patroon één versie.

### D. Design system-pagina compleet en in het Nederlands
De nieuwe indeling:
1. **Start:** waar je begint, welke map je gebruikt en wat je nooit doet.
2. **Basis:** kleur, tekst, afstand, afronding, hoogte, iconen en schaduw. Kleuren worden alleen getoond, niet gewijzigd.
3. **Onderdelen:** knop, invoer, badge, stip, tabs, tabel, tooltip en menu.
4. **Patronen:** de twaalf bouwblokken hierboven, elk met een werkend voorbeeld met nepdata en een korte "wanneer gebruik je dit".
5. **Voorbeeldpagina:** een complete minipagina (de Bestellijst met nepdata) op iPad- en telefoonbreedte.
6. **Regels Doe/Niet:** ongeveer 15 regels, elk met een goed en een fout voorbeeld naast elkaar.
7. **Tekst en toon:** knopteksten (werkwoord, kort), meldingen en lege staten.
8. **Controlelijst:** tien vinkjes die je vóór oplevering doorloopt.
- De oude onderdelen die niet meer kloppen gaan eruit: de KPI met trend, de losse pill-tabs, de demo met randdiktes en de "Real-World Modules" met verouderde kaarten.

### E. Regels opschonen
- **Projectgeheugen:**
  - de radiusregel, de icoonregel en de tabsstijl v6 worden aangepast naar de werkelijkheid;
  - de vaste kleur bij het info-icoon gaat weg;
  - "samenvattingskaarten" wordt "één overzichtskaart";
  - er komt één verwijzing naar /design-system als bron.
- **AGENTS.md:** de regel over `layout/Paginapatronen` wordt "Pura-patronen staan in components/pura, polar is oud".
- Er komt een eenvoudige automatische controle die nieuwe vaste kleuren (`#hex` in className) en losse afrondingen (`rounded-[..px]`) meldt. Dit wordt een test, geen nieuwe bibliotheek. Bestaande overtredingen staan op een lijst en worden niet in één keer aangepast.

### F. Testen op de Bestellijst
De Bestellijst wordt opnieuw opgebouwd met alleen de bouwblokken uit C:
- paginakop met SegmentTabs en "+ Product";
- de invoerbalk;
- de lijsttabel voor Op het bord, Advies, Onderweg en Tellen (alle vier dezelfde opbouw);
- de overzichtskaart;
- inklapgroepen in één stijl;
- tik op een rij opent de detailzijlade in plaats van de huidige dialoog. Die bevat dezelfde velden en dezelfde opslagfunctie.
- lege, laad- en foutstaten.

Bij Tellen: de tel-invoer per plek staat in de rij of in de zijlade, en het opslaan blijft letterlijk gelijk.

## In de praktijk
- **Voor het team:** de werking blijft hetzelfde. Wel opent bewerken voortaan als zijlade in plaats van een pop-up, dus één gewoonte verandert: tik op een rij, aanpassen, sluiten.
- **Voor nieuw bouwwerk:** "bouw met /design-system → Patronen" is één duidelijke opdracht, en de controlelijst vangt afwijkingen op.
- **Risico's:**
  - De zijlade vervangt de dialoog. Als dat in de drukte niet bevalt, is het per scherm terug te zetten.
  - Het omleiden van de oude SegmentedTabs verandert het uiterlijk van de tabs in de schermen die hem nu gebruiken (taken e.d.): alleen het gekozen tabblad blijft gevuld, de rest wordt rustiger. Wil je dat niet, dan laat ik de oude staan en geldt de nieuwe alleen voor nieuw werk.
  - Het opslaan van tellingen, bestelacties en de database blijven ongemoeid.

## Grenzen
Alleen de weergave en de documentatie. Geen kleur- of vormwijziging, geen database, rechten, edge functions of hooks. Het rollenplan blijft ongemoeid en er wordt niet gepubliceerd. Andere modules worden niet omgebouwd; alleen de Bestellijst.

## Technisch
- `src/components/pura/`: `SegmentTabs`, `FilterBalk`, `LijstTabel` (met `GroepRij`, skelet, fout- en lege staat, mobiele kaartmodus), `OverzichtKaart`/`Kengetal`, `Invoerbalk`, `DetailLade` (shadcn Sheet; rechts op ≥744px, onderaan daaronder), `FormSectie`, `InklapGroep`, `StatusDot`, `Bevestig` (AlertDialog) en `paginaKop`. `layout/Paginapatronen.tsx` wordt verplaatst en verwijderd.
- `components/ui/button.tsx` en `input.tsx`: een extra `size="touch"` (h-11). De standaard blijft gelijk.
- `pura/SegmentedTabs.tsx`: wordt een dunne wrapper op SegmentTabs (zie risico; keuze bij akkoord).
- `src/pages/DesignSystem.tsx`: opgesplitst in secties onder `src/pages/design-system/*.tsx`, zodat het bestand niet nog groter wordt dan 1400 regels.
- `src/test/designregels.test.ts`: scant `src/pages` en `src/components` op `#hex` in className en `rounded-[`, met een allowlist voor bestaande bestanden; nieuwe overtredingen laten de test falen.
- Bestellijst: `Bestelbord.tsx` en `kitchen/bestelbord/*`; `Voorraadproef.tsx` alleen de weergave. Bestaande handlers en `bewaar()` blijven ongewijzigd. Bewerken gaat via DetailLade met dezelfde state en handlers als de huidige dialoog.
- Projectgeheugen bijwerken (index plus de bestanden voor radius, icoon, tabs, info-icoon en paginapatronen) en `AGENTS.md` aanpassen.
- Controle: typecheck, `bun test src` en schermafdrukken van /design-system op 1280, 820 (iPad) en 390.

## Volgorde
1. Tokens, varianten en bouwblokken (A, B, C).
2. Design system-pagina (D).
3. Regels en de automatische controle (E).
4. Bestellijst ombouwen en controleren (F).
