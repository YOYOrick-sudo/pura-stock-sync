# West takenlijst: Bediening en Keuken als klikbare secties

## Wat er verandert

Boven de takenlijst in West komt een rij met twee grote knoppen: **Bediening** en **Keuken**. Je tikt op een knop en de lijst springt naar die sectie. Beide knoppen blijven altijd zichtbaar en klikbaar, op elke iPad.

De gedeelde **Samen**-taken (opstarten bovenaan, laatste loodjes onderaan) blijven op allebei de iPads staan. Het is dezelfde lijst: vinkt de ene iPad een Samen-taak af, dan ziet de andere iPad dat ook (dat werkt al live).

Elke iPad krijgt een vaste standaardsectie. Bij het openen van de lijst opent iPad 1 op Bediening en iPad 2 op Keuken. Die keuze zet je één keer per iPad in de instellingen van de takenlijst; hij blijft staan, ook als je tussendoor naar de andere sectie kijkt.

## Hoe het er in de praktijk uitziet

- Bovenaan de lijst, onder de fase-tabs (Openen / Sluiten): twee knoppen naast elkaar, groot genoeg voor natte handen (minimaal 44px hoog), met per knop de voortgang (bijvoorbeeld "Keuken 3/12").
- De actieve sectie is groen gemarkeerd; de andere is grijs maar gewoon aantikbaar.
- Volgorde op het scherm blijft: Samen / Opstarten → gekozen sectie → Samen / Laatste loodjes. De niet-gekozen sectie staat eronder, ingeklapt achter een regel "Bediening tonen" / "Keuken tonen", zodat scrollen kort blijft maar niets verdwijnt.
- Instelling: in het bestaande instellingenscherm van de takenlijst staat "Deze iPad opent standaard: Bediening / Keuken". Wordt lokaal op het apparaat bewaard, dus per iPad verschillend.

## Wat het team moet weten

- Eenmalig per iPad de standaardsectie instellen. Doe je dat niet, dan opent de lijst op Bediening (zoals nu).
- Een iPad die opnieuw wordt opgestart of waarvan de browsergegevens worden gewist, valt terug op Bediening; dan opnieuw instellen.
- Taken zelf veranderen niet: dezelfde taken, dezelfde volgorde, dezelfde secties in de database.

## Technisch

Alles gebeurt in `src/components/foh/FohTasks.tsx`; geen databasewijziging.

- De bestaande `deviceMode` (localStorage `foh_device_mode_west`) wordt hergebruikt als **vaste standaard per apparaat** met waarden `bediening` | `keuken` (default `bediening`), en niet meer als sorteervolgorde.
- Nieuwe state `zichtbareSectie` initialiseert bij mount op `deviceMode`; wisselen via de knoppen verandert alleen deze sessie-state, niet de opgeslagen standaard.
- Renderpad West in `renderDepartmentSection`/`sections`: Samen-top → actieve sectie (uitgeklapt) → inactieve sectie (ingeklapt, klikbare kop) → Samen-bottom.
- Sectieknoppen tonen `voltooid/totaal` uit `currentTasks`, met dezelfde tellogica als de sectiekoppen.
- Instellingenblok in het admin/instellingen-dialoog wordt herschreven naar twee keuzeknoppen met uitleg "Geldt alleen voor deze iPad".
- Bestaande drag-and-drop, bewerkmodus en realtime-sync blijven ongewijzigd.

## Testen na oplevering

1. iPad A: standaard Bediening instellen, lijst herladen → opent op Bediening.
2. iPad B: standaard Keuken instellen, lijst herladen → opent op Keuken.
3. Op beide iPads de andere sectie aantikken → wordt getoond; na herladen weer de eigen standaard.
4. Samen-taak afvinken op iPad A → verschijnt binnen enkele seconden afgevinkt op iPad B.
