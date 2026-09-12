# Kas-controle: een overzicht waarmee je echt controleert

## Eerst duidelijk: er gaat niets verloren
De tellingen komen wél binnen, voor West én Midsland. De laatste staan er gewoon in (West 12 september, Midsland 11 september). Er is geen aparte sheet-verzending meer in de app; Kas-controle is de plek. Wat ontbreekt is niet de data, maar een overzicht waarin je in één oogopslag ziet of een dag klopt.

## Wat ik in de database zie en wat dat betekent
- Sluittellingen bevatten cash-omzet, afdracht en kasverschil; opentellingen niet. Nu staan die in één platte lijst door elkaar.
- Kasverschillen staan wél vast (bijvoorbeeld -8,00, +4,25, -0,90) maar vallen nergens op.
- Er staan dubbele tellingen in (9 september Midsland twee keer identiek, 2 september West twee keer identiek). Die zijn nu niet als dubbel herkenbaar.
- Er zijn dagen zonder sluittelling. Dat is nu alleen te zien door zelf te tellen in de lijst.

## Wat ik ga bouwen

### 1. Eén regel per dag per vestiging
In plaats van losse regels door elkaar:
- Per dag en vestiging één regel met: openen (wie, hoe laat), sluiten (wie, hoe laat), cash-omzet, afdracht en kasverschil.
- Klikken opent de bestaande detailweergave met alle coupures.

### 2. Kasverschil als hoofdzaak
- Het kasverschil is de opvallendste waarde in de regel: groen bij klein verschil, oranje bij een afwijking die aandacht vraagt, rood bij een grote afwijking.
- De grens tussen deze niveaus zet ik vast in overleg; voorstel: tot €2 groen, tot €10 oranje, daarboven rood.

### 3. Signalen die je nu zelf moet opmerken
Bovenaan een korte lijst met wat niet klopt in de gekozen periode:
- Dag zonder sluittelling.
- Dag zonder opentelling.
- Twee dezelfde tellingen kort na elkaar (dubbel ingediend).
- Kasverschil boven de grens.

### 4. Samenvatting per periode
Boven het overzicht: aantal dagen, totaal afdracht, totaal kasverschil en het aantal dagen met een verschil — per vestiging naast elkaar.

### 5. Filters die passen bij controleren
Snelkeuzes: deze week, vorige week, deze maand. Vestiging en periode blijven werken zoals nu. De CSV-export blijft en volgt de nieuwe dagregels.

## Praktijk en risico
- **Wie en wanneer:** jij of een manager, op laptop of tablet, meestal achteraf per week. Medewerkers merken niets; de telschermen blijven ongewijzigd.
- **Wat als er niets wordt ingevuld:** een ontbrekende telling wordt juist zichtbaar als signaal in plaats van stil te verdwijnen.
- **Over een maand:** het overzicht groeit per dag, niet per telling, dus het blijft leesbaar; de standaardperiode blijft de laatste 30 dagen.
- **Risico:** dagen met dubbele tellingen kunnen totalen scheeftrekken. Ik tel per dag niet zomaar alles op, maar toon de dubbeling als signaal en gebruik de laatste telling als leidend.
- Geen wijziging aan tellen, opslaan, rechten of de wisselkassa-knop. Bestaande gegevens blijven ongemoeid; dit is alleen een andere presentatie.

## Verificatie
- Controleren dat 9 september Midsland en 2 september West als dubbel worden gemeld.
- Controleren dat een dag met alleen een opentelling het signaal "geen sluittelling" geeft.
- Controleren dat kasverschillen van -8,00 en +4,25 de juiste kleur krijgen.
- Controleren dat West en Midsland gescheiden totalen tonen en dat de export klopt.

## Technische details
- Alleen frontend: `src/pages/KasControle.tsx` wordt omgebouwd tot dag-gegroepeerde weergave met signaal- en samenvattingsblok; de detaildialoog en `DenomTable` blijven hergebruikt.
- Geen database-, RLS- of routewijziging; dezelfde query op `kassa_afdrachten` wordt in de browser gegroepeerd.
- Drempelwaarden voor kasverschil komen als constante bovenin het bestand, zodat ze eenvoudig aan te passen zijn.
