# Mayo-tellen in GN-bakken en liters + avocado spread per pot

## Wat je straks ziet

**Mayo's (chimichurri, zeewier-algen, knoflook-kurkuma)** — in de voorraadronde tel je niet meer "bakken", maar je geeft aan wat er écht staat:

```text
Knoflook-kurkumamayonaise
Welke bak staat er?   [GN 1/3] [GN 1/6] [GN 1/9]
Hoogte?               [laag] [midden] [hoog]
Hoe vol?              [vol] [¾] [half] [kwart] [bodem] [leeg]

→ Staat er: 1 volle GN 1/9 hoog ≈ 1,3 L
   Norm: minimaal halve GN 1/3 ≈ 2,0 L   ✗ te weinig
   MEP-taak aangemaakt: "Knoflook-kurkumamayo bijmaken"
```

Het systeem rekent de bakmaat × vulstand om naar liters en vergelijkt met de ingestelde norm. Onder de norm → automatisch een MEP-taak "bijmaken" op de eerstvolgende open dag. Genoeg → niets aan de hand.

**Avocado spread (pot in de koelcel)** — tellen gaat per pot met vulstand: vol / half / leeg. Half is prima (geen actie). Alleen bij leeg of geen pot: actie (nieuwe pot ontdooien uit de vriezer).

## Wat er verandert

1. **GN-liter-tabel** (nieuw, in de app): vaste richtwaarden per bak — GN 1/3, 1/6, 1/9 in de hoogtes laag (65mm), midden (100mm), hoog (150mm). Bijv. GN 1/9 hoog ≈ 1,3 L, halve GN 1/3 midden ≈ 2,0 L. Dit zijn richtwaarden (per bakmerk wijkt het iets af) — goed genoeg voor "moeten we bijmaken?".

2. **Nieuwe telkaart voor mayo** in de voorraadronde: drie stappen met grote knoppen (bak, hoogte, vulstand), meteen de liters en de norm in beeld, groen/rood. Werkt op telefoon in de koelcel.

3. **Norm per mayo instelbaar**: per mayo leg je vast wat er minimaal moet liggen, bijv. "halve GN 1/3". In de bestaande beheerschermen (zelfde plek waar bakmaat en vulnorm nu staan).

4. **MEP-koppeling**: tekort → MEP-taak "…mayonaise bijmaken (± X liter)" voor de eerstvolgende open dag, zodat het 's ochtends op de MEP-lijst staat. Alleen mayo onder de norm; geen dubbele taken als hij er al staat.

5. **Avocado spread**: telkaart wordt vol/half/leeg. Leeg (of geen pot) → ontdooi-actie uit de vriezer, zoals de andere spreads nu al werken.

## Wat bewust niet verandert
- Wortelspread, tomatenjam en de andere spreads blijven tellen zoals nu (pakje/bakje).
- De vriezer-keten en bestelbordregels blijven gelijk.
- Niets wordt verwijderd; tellingen blijven in de historie.

## Technische aanpak
- Nieuwe kolommen op `koelcel_check_items`: `norm_gn_formaat`, `norm_gn_hoogte`, `norm_fractie` (de ingestelde minimum-norm). Telling legt vast: gekozen GN-formaat, hoogte en vulstand (nieuwe kolommen op de tellingstabel), zodat je later terugziet wat er stond.
- Nieuw bestand `src/lib/gn-liters.ts` met de liter-tabel en de berekening `liters(formaat, hoogte, fractie)`.
- `VoorraadRonde.tsx`: nieuwe kaartvariant "gn-bak" voor items met een GN-norm; avocado-pot krijgt variant "pot met vulstand".
- MEP-taak aanmaken bij afronden van de ronde (zelfde moment als de aanvulbon), met controle op dubbele taken.
- Migratie met GRANTs en RLS ongewijzigd (bestaande tabellen, alleen kolommen).

## Praktijk en risico's
- **Wie/wanneer**: keuken West, sluitronde, telefoon of iPad in de koelcel. Drie tikken per mayo; het rekenwerk ("is een volle 1/9 genoeg voor een halve 1/3?") verdwijnt uit hoofden.
- **Gewoonte**: het team moet weten welke bak ze pakken — de bakmaten staan al in de koelcel, de namen (1/3, 1/6, 1/9) komen overeen met wat op de bakken staat.
- **Risico**: liter-waarden zijn richtwaarden. Bij twijfel (net onder norm) staat de berekende hoeveelheid op de MEP-taak, dus de kok ziet wat er ongeveer bij moet — geen harde fout mogelijk.
- **Risico**: verkeerde bak gekozen bij tellen → verkeerde liters. De kaart toont de conclusie direct ("1,3 L van min. 2,0 L — te weinig"), dus een vreemde uitkomst valt meteen op.
- **Test**: live op telefoonformaat — mayo tellen met verschillende bakken, norm onderschrijden en zien dat de MEP-taak verschijnt; avocado half = geen actie, leeg = ontdooi-actie. Testtellingen worden achteraf opgeruimd.
- **Eerste stap bij bouwen**: de nog openstaande live test van het stickerblok (3e taak in de sluitlijst) afronden.
