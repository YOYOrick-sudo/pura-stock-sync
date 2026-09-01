# Herstelplan MEP toevoegen en stickers

## Categorie
Data-/flowwijziging: de MEP-interface schrijft naar en ververst databasegegevens; daarom behandel ik dit zwaarder dan een gewone UI-fix. Geen schemawijziging voorzien.

## Diagnose tot nu toe
- **MEP:** de invoer meldt nu succes voordat in het scherm aantoonbaar is dat de nieuwe rij in de actuele dag-/vestigingslijst staat. Ik volg de insert, retourwaarde, datum/vestiging en query-cache door en maak de lijst direct en betrouwbaar zichtbaar.
- **Stickers:** het productveld heeft expliciete autofocus én opent de keuzelijst bij laden. Daardoor verschijnt op tablet direct het toetsenbord. Die automatische focus gaat weg.
- **Vrije stickertekst:** ik herstel het invoerpad zodat gewone tekst altijd in het zichtbare productveld blijft staan en geprint kan worden, zonder dat de suggestielijst de invoer onderschept.

## Bouwstappen
1. **MEP toevoegen betrouwbaar maken**
   - Insert valideren en een lege vestiging blokkeren met een duidelijke melding.
   - Na succesvolle insert de exacte dag-/vestigingscache direct bijwerken en daarna opnieuw ophalen.
   - De ingevoerde taak pas als “toegevoegd” tonen wanneer een geldige database-rij terugkomt.
   - Receptkeuze, vrije taak, snelkeuze en medewerker-toewijzing via hetzelfde robuuste pad laten lopen.

2. **Stickerinvoer herstellen**
   - Geen autofocus of automatische toetsenbordopening bij het openen van de module.
   - Suggesties pas openen wanneer iemand bewust op het productveld tikt of begint te typen.
   - Vrije tekst behouden als geldige productnaam; een suggestie kiezen blijft optioneel.
   - Na printen het veld leegmaken zonder het toetsenbord opnieuw automatisch te openen.

3. **Verifiëren als ingelogde gebruiker**
   - MEP: vrije taak toevoegen en controleren dat die meteen in vandaag + juiste vestiging verschijnt.
   - MEP: recept toevoegen, medewerker kiezen en controleren dat de taak zichtbaar en toegewezen blijft.
   - Stickers: module openen en bevestigen dat het toetsenbord/focus niet automatisch opent.
   - Stickers: vrije tekst typen en bevestigen dat de printactie beschikbaar wordt; daarnaast één bestaande suggestie kiezen.
   - Build-, runtime- en consolefouten controleren.

## Praktijk en risico
Op de keuken-iPad moet toevoegen één duidelijke handeling blijven en mag haperende wifi geen vals succes geven. Bij een fout blijft de invoer staan en krijgt de gebruiker een concrete foutmelding; zo verdwijnt geen MEP-opdracht uit de werkstroom. De printserver- en stickeropbouw worden niet gewijzigd.
