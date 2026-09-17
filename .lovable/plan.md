# Mise en place opslaan-knop + kassatelling West

## Wat er aan de hand is

**1. Opslaan-knop niet bereikbaar (mise en place)**
Het venster waarin je een taak aanpast is lang: handeling, wie, prioriteit, aantal, eenheid, klaar-voor en notitie staan onder elkaar. Het venster scrollt, maar de knoppen Annuleren/Opslaan scrollen mee naar beneden. Op de keuken-iPad (zeker met toetsenbord in beeld) valt Opslaan daardoor buiten het scherm. Rechten en opslaan zelf zijn in orde — het is puur dat je de knop niet kunt bereiken.

**2. Kassatelling West vanochtend**
In de telling-gegevens staat vandaag geen enkele West-telling; Midsland van 06:53 staat er wel in. Twee dingen kunnen dit veroorzaken en die pak ik allebei aan:
- De knop blokkeert zichzelf 10 minuten na een eerdere verzending ("Wacht alsjeblieft..."), ook als die eerdere poging misging. Dat blijft op dat ene apparaat hangen.
- Als de vestiging op dat moment nog niet geladen was, wordt de telling weggestuurd zonder vestiging en weigert de database hem. De melding die je dan krijgt is onduidelijk.
Op 16 september staan twee identieke West-tellingen van 05:52:17 — dubbel verzonden binnen een fractie van een seconde. Dat wordt ook afgevangen.

## Wat ik ga doen

**Mise en place — taakvenster**
- Annuleren/Opslaan vastzetten onderaan het venster, altijd zichtbaar, ook bij scrollen en met toetsenbord in beeld.
- Venster compacter: aantal + eenheid en prioriteit + klaar-voor naast elkaar, minder witruimte, zodat er minder gescrold hoeft te worden.
- Duidelijk zichtbaar wanneer hij aan het opslaan is, en een begrijpelijke melding als het misgaat.

**Kassatelling**
- Niet verzenden zolang de vestiging nog niet bekend is; in plaats daarvan een duidelijke melding en de knop kort uit.
- De 10-minuten-blokkade alleen starten na een gelukte verzending, niet na een mislukte. Bij een blokkade tonen wat je kunt doen.
- Dubbel verzenden binnen enkele seconden afvangen.
- Bij een fout de melding in gewone taal ("Je telling is niet opgeslagen — ...") met de al bestaande lokale back-up, zodat niets verloren gaat.

**Bugronde mise en place**
Ik loop de hele module na als ingelogde gebruiker en controleer:
taak toevoegen (vrije invoer én recept), snelkeuzes, aantal/eenheid, wie-doet-het, prioriteit, bewerken + opslaan, afvinken met en zonder sticker, heropenen, verwijderen, de drie weergaves (alle taken / per persoon / per handeling), overloop van gisteren, en gedrag na een tijd niets doen (app uit de achtergrond halen). Wat stuk blijkt, los ik in dezelfde ronde op en meld ik terug.

## Technisch
- `src/components/kitchen/MepTaakBewerken.tsx`: scrollend body + sticky `DialogFooter`, compactere grid-indeling.
- `src/pages/Kassa.tsx` en `src/pages/KassatellingOverdag.tsx`: guard op `userLocation`, throttle-timestamp pas na succes, dubbelklik-guard, duidelijker foutmeldingen. Bestaande localStorage-back-up blijft.
- Geen wijzigingen aan database, RLS, routes of packages.
