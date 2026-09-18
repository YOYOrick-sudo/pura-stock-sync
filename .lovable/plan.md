# Bijvullen of zelf maken: de keten kloppend maken

Je hebt gelijk. Bij een paar producten zegt de ronde "bijvullen", terwijl er in de koelcel geen kant-en-klaar bakje ligt maar alleen het verse product dat nog gesneden of gepeuterd moet worden. Dan is bijvullen geen opdracht die iemand kan uitvoeren — het hoort op de mise-en-place.

## Wat er nu in het systeem staat

Voor deze drie staat in de koelcel een regel met dezelfde productsleutel als het bakje op de werkbank, waardoor de app denkt dat er een voorraad achter ligt:

- **Gesneden paprika** — koelcelregel "Gesneden paprika" (1 stuk). Daarnaast staat al een aparte regel "Verse paprika's" (12 stuks, inkoop).
- **Granaatappelpitjes** — koelcelregel "Granaatappels" (6 stuks). Dat zijn hele vruchten, geen pitjes.
- **Rode peper** — koelcelregel "Rode peper" (1 wit emmertje). Dat zijn hele pepers.

Avocado, blauwe bes en zoetzure gember kloppen wél: daar ligt echt het product zelf achter, dus bijvullen is de juiste opdracht.

## Wat er verandert

**1. Vers product wordt herkenbaar vers**

- De koelcelregel "Gesneden paprika" gaat eruit (gearchiveerd, niet verwijderd) — "Verse paprika's" blijft de telregel.
- "Granaatappels" en "Rode peper" in de koelcel blijven staan als **verse grondstof**, maar zijn niet langer gekoppeld aan het bakje op de werkbank. Ze heten voortaan "Verse granaatappels" en "Verse rode peper" en worden gewoon geteld en besteld zoals nu.

**2. Bakje leeg = MEP-taak**

Het bakje op de werkbank van gesneden paprika, granaatappelpitjes en rode peper krijgt als herkomst "zelf maken in West". Staat het bakje onder de norm, dan komt er automatisch een taak op de mise-en-place — met de bekende regel: half = mag morgen, bodempje of leeg = vandaag. Eén hele batch per taak, geen halve bakjes.

**3. Het labeltje zegt wat er echt gebeurt**

In de lade staat nu bij elk tekort hetzelfde amberkleurige "bijvullen". Dat wordt gesplitst:

- Ligt het product echt in de koelcel/vriescel/magazijn → **bijvullen** (amber, zoals nu).
- Moet het eerst gemaakt of gesneden worden → **op de MEP** (rustig groen, hetzelfde chipje als elders in de ronde).

Zo zie je tijdens het lopen meteen of je zelf even naar de koelcel loopt, of dat het op de lijst voor morgen komt.

## In de praktijk

Sluitdienst tikt bij gesneden paprika "half": geen loze bijvul-opdracht meer, maar rustig "op de MEP" en de taak staat morgenochtend klaar. Bij zoetzure gember blijft het "bijvullen" — dat pak je ter plekke uit de koelcel. Niemand hoeft te onthouden welk product welke route heeft.

Risico om te kennen: verse paprika's, granaatappels en rode pepers worden vanaf nu op hun eigen regel geteld. Tel je die niet, dan komt er ook geen bestelling — dus die regels blijven gewoon onderdeel van de koelcelronde (dat zijn ze al).

## Technisch

- Migratie: koelcelregel `gesneden-paprika` op `actief = false`; koelcelregels van `granaatappelpitjes` en `rode-peper` krijgen een eigen sleutel (`verse-granaatappels`, `verse-rode-peper`) en nieuwe naam; werkbankregels `gesneden-paprika`, `granaatappelpitjes` en `rode-peper` krijgen `bron = 'zelf_west'` en `batch_aantal = 1`.
- `src/components/foh/VoorraadRonde.tsx`: het chipje bij een tekort in een lade wordt afgeleid van `vervolgactieVoorRegel` — bij `soort: 'niveau'` blijft het amber "bijvullen", bij een MEP-bestemming wordt het de groene `VoorraadChip variant="klaar"` met "op de MEP". Geen verandering aan tellen, aanvulbon, bestellen of printen; de MEP-routing zelf bestaat al.

## Testen

West → Sluiten → Keuken → Voorraadronde → Links boven: gesneden paprika op "half" geeft "op de MEP"; granaatappelpitjes en rode peper op "bodempje" geven "op de MEP" met prioriteit vandaag; zoetzure gember, avocado en blauwe bes houden "bijvullen".
