# Open- en sluitlijsten met NL / EN-knop

## Wat er in de praktijk verandert

Boven de dagelijkse open- en sluitlijst komt één duidelijke taalkeuze: **NL | EN**. Met één tik wisselt het team de zichtbare lijstinhoud om. De actieve taal is direct herkenbaar en de keuze wordt per telefoon of iPad onthouden.

In het Engels veranderen:
- taaknamen;
- eventuele taakomschrijvingen achter het info-icoon;
- namen van onderdelen en gezamenlijke secties, zoals “Binnenkomst” en “Laatste loodjes”;
- lege- en gereedmeldingen binnen de takenlijst.

De navigatie, instellingen en andere modules blijven Nederlands. Ingebouwde onderdelen zoals Voorraadronde en bain-marie houden hun huidige Nederlandse bediening; alleen de omliggende takenlijst schakelt om.

## Voor wie en wanneer

- Medewerkers kiezen aan het begin van de dienst eenmalig NL of EN op telefoon of iPad.
- De knop krijgt een tikvlak van minimaal 44px en werkt zonder uitleg of verborgen bediening.
- De taalkeuze verandert alleen de tekst, nooit de taak, volgorde, voortgang of afvinkstatus.
- Een nieuw of gewist apparaat begint veilig in het Nederlands.

## Uitvoering

1. **Tweetalige gegevens toevoegen**
   - Voeg Engelse velden toe aan de bestaande taaktemplates en dagelijkse taken voor taaknaam en omschrijving.
   - Voeg aan de bestaande onderdeelvolgorde een Engelse onderdeelnaam toe.
   - Bestaande rechten en locatie-afscherming blijven ongewijzigd; er komt geen nieuwe tabel.

2. **Bestaande lijsten vertalen**
   - Vertaal de actieve open- en sluittemplates van West en Midsland naar kort, praktisch horeca-Engels.
   - Vul dezelfde Engelse teksten in bij de al gegenereerde open- en sluittaken, zodat de knop meteen werkt en niet pas vanaf morgen.
   - Vertaal de gebruikte onderdeelnamen; interne sleutels en Nederlandse bronteksten blijven behouden.

3. **NL / EN-keuze bouwen**
   - Plaats de taalkeuze bij de knoppen Openen en Sluiten, alleen bij de dagelijkse takenlijst.
   - Bewaar de keuze lokaal per apparaat, zodat verschillende iPads gelijktijdig een andere taal mogen tonen.
   - Gebruik Engelse tekst wanneer EN actief is; ontbreekt een vertaling, toon altijd de Nederlandse tekst zodat een taak nooit verdwijnt.

4. **Beheer toekomstbestendig maken**
   - Bij het beheren van een open- of sluittaak kan naast de Nederlandse naam en uitleg ook de Engelse versie worden aangepast.
   - Nieuwe taken blijven direct bruikbaar als alleen Nederlands is ingevuld; EN valt dan zichtbaar terug op Nederlands.

## Risico’s en afdekking

- **Verkeerde vertaling kan een handeling veranderen.** Daarom blijven taak-ID, volgorde, afdeling, herhaling en afvinkstatus exact gelijk; alleen de zichtbare tekst wisselt. De vertalingen worden per locatie en fase nagekeken.
- **Een nieuwe taak heeft mogelijk nog geen Engels.** De Nederlandse tekst wordt dan getoond, zodat niets ontbreekt tijdens een dienst.
- **Twee tablets kunnen verschillende talen tonen.** Dat is bewust apparaatgebonden; realtime afvinken blijft op dezelfde taak werken.
- **Slechte wifi tijdens de dienst.** Wisselen gebruikt reeds geladen teksten en lokale apparaatkeuze; een taalwissel verandert geen operationele gegevens.
- **Bestaande koppelingen en historie.** Printer-, voorraad-, MEP- en automatiseringsflows blijven buiten scope. Historische taken worden niet verwijderd of opnieuw aangemaakt.

## Categorie-classificatie

- **UI:** NL/EN-keuze en taalweergave.
- **Data:** Engelse velden en vertalingen van bestaande open-/sluittaken en templates.
- **Logica:** veilige terugval naar Nederlands en apparaatgebonden taalkeuze.
- **RLS:** geen beleidswijziging; bestaande afscherming blijft gelden en wordt na de migratie gecontroleerd.
- **Edge functions:** geen wijziging.

## Aantoonbaar testen

1. West openen op iPadformaat: NL → EN → NL; taaknamen, onderdelen en uitleg wisselen direct.
2. West sluiten: dezelfde test voor Bediening, Keuken en Samen; voorraadronde en bain-marie blijven functioneel.
3. Midsland openen en sluiten: Engelse lijstinhoud zichtbaar zonder ontbrekende taken.
4. Eén taak afvinken in EN, terug naar NL: exact dezelfde taak blijft afgevinkt.
5. Twee apparaten simuleren met verschillende taalkeuze: realtime voortgang blijft gelijk.
6. Herladen: gekozen taal blijft op dat apparaat bewaard; nieuw apparaat start in NL.
7. Een taak zonder Engelse tekst controleren: Nederlandse terugval verschijnt en de taak blijft bedienbaar.
8. Beheercontrole: Engelse naam en uitleg aanpassen, opslaan en terugzien in de lijst.
9. Databasecontrole op aantallen en onveranderde taak-ID’s; rechtencontrole voor medewerker en manager.
10. Visuele controle op telefoon en iPad, plus build-, console- en runtimecontrole.
