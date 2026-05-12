Plan om het scrollen echt smooth te maken:

1. Eén verticale scroll-container maken
- De huidige workaround met twee aparte verticale scrollgebieden blijft voelbaar stroef.
- Ik haal de verticale scroll van de namen-kolom af.
- De rechter tijdlijn blijft de enige verticale scroll-container én de enige zichtbare scrollbar.
- De namenkolom wordt sticky links binnen dezelfde scrolllaag, zodat namen en balken fysiek samen bewegen in plaats van achteraf gesynchroniseerd worden.

2. Programmatic scroll-sync verwijderen
- De huidige `scrollTop`-sync via scroll events + `requestAnimationFrame` veroorzaakt het “niet smooth” gevoel.
- Die logica verwijder ik volledig.
- Scrollen wordt dan weer native browser-scroll: vloeiender op muis, trackpad en touch.

3. Horizontale scroll behouden zoals bedoeld
- De tijdlijn blijft horizontaal scrollbaar voor de maanden/dagen.
- De namenkolom blijft zichtbaar links tijdens horizontaal scrollen.
- De onderste horizontale scrollbar blijft gekoppeld aan de tijdlijn, niet aan de hele pagina.

4. Header en rijen blijven uitgelijnd
- De sticky datum-header, dichtheidsbalk en linker header krijgen dezelfde scroll-context.
- De totale hoogte blijft gebaseerd op `totalRowsHeight`, zodat keuken/bediening, vorig jaar, woonruimte en personeelsbalken exact op één lijn blijven.

5. Extra page-scroll opruimen waar nodig
- Ik controleer of de hoofd-layout nog onnodig pagina-scroll veroorzaakt rondom de planning.
- De planningkaart krijgt een stabiele hoogte op basis van de viewport, zodat je niet én de pagina én de tijdlijn tegelijk voelt scrollen.

Bestand om aan te passen:
- `src/pages/personeel/Tijdlijn.tsx`

Waarschijnlijk niet nodig:
- Geen databasewijzigingen.
- Geen wijzigingen aan personeeldata.
- De eerder toegevoegde `scrollbar-hide` utility kan blijven of verwijderd worden als hij niet meer gebruikt wordt.

Verificatie na implementatie:
- Scrollen op namen beweegt de tijdlijn direct mee.
- Scrollen op balken beweegt namen direct mee.
- Er is geen aparte verticale scrollbar meer in de namenkolom.
- Verticale scroll voelt native/smooth zonder haperende sync.
- Horizontaal scrollen door maanden blijft werken.
- Sticky headers blijven vaststaan en rijen blijven aligned.