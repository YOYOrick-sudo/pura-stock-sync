# Alleen-lezen onderzoek: opbouw betaalde modifiers (Midsland 36864)

## Doel
Feitelijk bewijs voor hoe L-Series OnlineOrdering bruto- en nettobedragen van betaalde modifiers opslaat. Er wordt niets gebouwd, uitgerold, besteld of gewijzigd.

## Stappen
1. Kijk eerst welke Midsland-gegevens er al in de database staan: bestaande `lightspeed_connections` (alleen de status, geen token) en of kassabon 414226679 aan een online order gekoppeld is.
2. Doe kleine, begrensde GET-aanvragen via het bestaande server-side tokenbeheer van Midsland. Het token wordt niet uitgelezen of getoond.
   - Zoek de online order bij bon 414226679, of anders een recente Order Anywhere-order.
   - Zoek een regel met een betaalde modifier, liefst Uluwatu Groot met Sriracha. Zoek ook een tweede voorbeeld met aantal >1.
   - Haal de productbasisprijs los op uit de kaart.
   - Bij een 429 vertraag ik eenmaal en stop ik daarna.
3. Vergelijk per regel: unitPrice, totalPrice, de nettobedragen, quantity, de modifier price en priceWithoutVat, de basisprijs en de totaal ontvangen betaling.
4. Rapporteer alleen geanonimiseerde bedragen en ID's, zonder gastgegevens of volledige orderdata. Ik meld ook expliciet of het een echt opgeslagen OnlineOrdering-bericht was of alleen een kassabon.

## Bekend risico
Eerdere alleen-lezen GET's op orders en bonnen gaven 401. Een geldige eigenaarssessie was toen niet beschikbaar. Gebeurt dat weer, dan stop ik direct en meld ik de concrete reden. Ik probeer dan geen andere route.

## Technisch
- De aanvragen lopen alleen via een bestaande server-side route die GET-only proxyt. Bestaat zo'n route niet zonder nieuwe code of uitrol, dan voer ik niets uit en meld ik dat als blokkade.
- Er worden geen writes, migraties, deploys, wijzigingen aan de livevlag of publicaties gedaan.
