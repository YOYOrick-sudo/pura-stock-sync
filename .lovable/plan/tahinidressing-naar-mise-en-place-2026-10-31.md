# Tahinidressing — naar mise-en-place

## Vastgestelde oorzaak
De actieve West-regel **Tahinidressing (flessen)** in het magazijn staat op **Ingekocht** (`koelcel_inkoop`). Bij een tekort stuurt de bestaande voorraadronde deze daarom naar het bestelbord. Het artikel **Tahini citroen dressing** staat voor West al op eigen productie.

## Correctie
- Alleen de aanvulbron van magazijnregel `bea6f01b-5e9b-46ba-9302-282786187429` wijzigen naar **Zelf maken in West** (`zelf_west`), met controle op huidige vestiging, naam en bron.
- De werkbankregel en het ingekochte ingrediënt **Tahini naturel** ongemoeid laten. Geen algemene routeringswijziging, rollenwijziging of publicatie.
- Na de wijziging de instelling teruglezen. Bestaande routeringsfunctie met gemockte data testen: magazijntekort leidt naar Bereiden/MEP, niet bestellen; werkbank blijft via magazijn aanvullen.
- De al gemaakte bestelbordregel niet automatisch verwijderen of een tweede MEP-taak aanmaken. Eerst read-only vaststellen welke bestaande regel bij deze melding hoort en eventuele duplicaten; herstel van die lopende actie apart afstemmen.

## Praktijk en risico
Het West-team gebruikt dezelfde voorraadronde op de keukentablet; geen nieuwe handeling nodig. Een nieuw tekort krijgt een productieactie in plaats van een inkoopactie. De reeds gemaakte bestelbordregel verandert niet vanzelf: die laten staan kan tot een verkeerde bestelling leiden; automatisch omzetten kan een dubbele MEP-taak veroorzaken.

Preview en live delen deze instelling: de broncorrectie werkt meteen op beide. Geen echte tellingen, testbestellingen of printjobs maken. Historie blijft bewaard; andere producten en vestigingen blijven ongewijzigd.

## Technisch
Categorie: gerichte operationele datawijziging. Bestaande rechten en routeringslogica hergebruiken; geen migratie, nieuwe bibliotheek of wijziging aan printer/koppelingen. Voor uitvoering de geldende database-schemaregels raadplegen en de doelrij opnieuw controleren.
