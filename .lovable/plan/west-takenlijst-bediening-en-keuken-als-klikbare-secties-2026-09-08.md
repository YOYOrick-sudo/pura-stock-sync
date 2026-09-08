# West takenlijst: Bediening en Keuken als klikbare secties

## Wat er verandert

Boven de takenlijst in West komt een rij met twee grote knoppen: **Bediening** en **Keuken**. Je tikt op een knop en die sectie klapt open. Beide knoppen blijven altijd zichtbaar en aantikbaar, op allebei de iPads.

De gedeelde **Samen**-taken (opstarten bovenaan, laatste loodjes onderaan) staan op allebei de iPads en zijn aan elkaar gekoppeld: vinkt de ene iPad een Samen-taak af, dan staat hij binnen enkele seconden ook afgevinkt op de andere. Dat geldt trouwens ook voor Bediening- en Keuken-taken; het is één lijst, alleen anders getoond.

Elke iPad krijgt een vaste standaardsectie. iPad 1 opent altijd op Bediening, iPad 2 altijd op Keuken. Die keuze zet je één keer per iPad in de instellingen van de takenlijst.

## Hoe het er in de praktijk uitziet

- Onder de fase-tabs (Openen / Sluiten) staan twee knoppen naast elkaar, minimaal 48px hoog — bedienbaar met natte handen, geen hover nodig.
- Op elke knop staat de voortgang van die sectie, bijvoorbeeld "Keuken 3/12", zodat je in één blik ziet hoe de andere kant ervoor staat.
- Volgorde op het scherm: Samen / Opstarten → gekozen sectie (open) → andere sectie (ingeklapt, aantikbare regel) → Samen / Laatste loodjes. Zo blijft scrollen kort en verdwijnt er niets.
- Instelling: in het instellingenscherm van de takenlijst staat "Deze iPad opent standaard op: Bediening / Keuken", met de opmerking dat dit alleen voor dit apparaat geldt.

## Randgevallen die zijn meegenomen

- **Tussendoor kijken bij de ander**: je tikt op de andere sectie, klapt hem open, vinkt eventueel iets af. Bij een volgende keer openen of herladen staat de eigen standaardsectie weer open. De vaste keuze wordt dus nooit stilletjes overschreven.
- **Taken zonder sectie**: taken waarvan de sectie leeg of onbekend is, vallen zoals nu onder Bediening. Ze verdwijnen dus niet.
- **Bewerkmodus en slepen**: in bewerkmodus worden beide secties uitgeklapt getoond, anders kun je niets naar de andere sectie slepen. Slepen blijft binnen een sectie werken zoals nu.
- **Periodieke taken** (tabblad naast Dagelijks) hebben geen Bediening/Keuken-indeling; daar verandert niets en de sectieknoppen worden er niet getoond.
- **Lege sectie**: heeft Keuken vandaag geen taken, dan blijft de knop staan met "0/0" en een regel "Geen taken" — niet verbergen, anders lijkt het alsof er iets stuk is.
- **Fase wisselen** (Openen ↔ Sluiten): de gekozen sectie blijft staan, je hoeft niet opnieuw te tikken.
- **Midsland**: ziet geen sectieknoppen, daar blijft de lijst exact zoals hij is.
- **Nieuwe of gewiste iPad**: valt terug op Bediening; instelling opnieuw zetten kost tien seconden.
- **Nieuw teamlid zonder uitleg**: twee knoppen met duidelijke woorden en een teller — geen verborgen gebaren, geen lang indrukken.

## Risico's en hoe ze worden afgedekt

- *Risico: taken worden over het hoofd gezien omdat de andere sectie dicht staat.* Afgedekt door de teller op de knop en door Samen-taken altijd open te tonen; de ingeklapte sectie blijft één tik weg.
- *Risico: iemand denkt dat de instelling voor het hele team geldt.* De instelling zegt letterlijk dat het alleen voor deze iPad is.
- *Risico: geen wifi of vastloper midden in de dienst.* Er verandert niets aan hoe taken worden opgeslagen; de bestaande directe terugkoppeling en live-synchronisatie blijven ongewijzigd. De sectiekeuze staat lokaal op de iPad en is niet afhankelijk van internet.
- *Risico voor bestaande data:* geen. Er verandert niets aan de database, aan taken, templates of volgordes — dit is puur hoe de lijst getoond wordt.

## Technisch

Alles in `src/components/foh/FohTasks.tsx`; geen migratie, geen nieuwe pakketten.

- Bestaande `deviceMode` (localStorage `foh_device_mode_west`) wordt de **vaste standaard per apparaat**, waarden `bediening` | `keuken`, default `bediening`. De huidige rol als sorteervolgorde vervalt.
- Nieuwe state `zichtbareSectie` initialiseert op `deviceMode`; sectieknoppen zetten alleen deze state, nooit localStorage.
- West-renderpad rond `renderDepartmentSection`: Samen-top → actieve sectie uitgeklapt → inactieve sectie ingeklapt (klikbare kop met teller) → Samen-bottom. In `isEditMode` beide uitgeklapt.
- Sectieknoppen berekenen `voltooid/totaal` uit `currentTasks` met dezelfde `westSectionOf`-logica als de sectiekoppen, zodat de tellers nooit uiteenlopen.
- Sectieknoppen alleen renderen bij `userLocation === 'West'` en `mainCategory === 'dagelijks'`.
- Instellingenblok in het admin-dialoog herschrijven naar twee keuzeknoppen ("Deze iPad opent standaard op"), tekst over volgorde weghalen.
- `handleDragEnd`, realtime-abonnementen en optimistische updates blijven ongewijzigd.

## Testen na oplevering (aantoonbaar)

1. iPad A op Bediening zetten, herladen → opent op Bediening met beide knoppen zichtbaar.
2. iPad B op Keuken zetten, herladen → opent op Keuken.
3. Op iPad B de knop Bediening tikken → sectie klapt open; herladen → weer Keuken.
4. Samen-taak afvinken op A → binnen enkele seconden afgevinkt zichtbaar op B.
5. Fase wisselen Openen → Sluiten → gekozen sectie blijft; tellers kloppen met de sectiekoppen.
6. Bewerkmodus openen → beide secties uitgeklapt, slepen werkt als voorheen.
7. Midsland openen → geen sectieknoppen, lijst ongewijzigd.
