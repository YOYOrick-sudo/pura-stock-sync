# Eilandbezorger Midsland — herstel betaalde opties en dieetbevestigingen (25-11-2026)

Alleen testmodus; geen Lightspeed-POST, live uit, planner (`eilandbezorger-ronde`) niet opnieuw uitgerold.

## Bewijs (alleen-lezen, geanonimiseerd)
- Oorspronkelijke L-Series onlineorders (GET /rest/onlineordering/order/{id}): 19849770, 19884311, 19887381, 19755500, 19710472, 19690028, 19663551, 19577217.
  `unitPrice` = basisprijs; modifier `price` = bruto toeslag per portie (Sriracha 0,50, glutenvrij brood 1,00, friet 7,00), `priceWithoutVat` = 0;
  betaling = som aantal × (unitPrice + toeslagen). Alle betaalde voorbeelden hebben amount 1.
- Kassabon 414226679 is een financiële restaurantbon (geen gekoppelde onlineorder): Uluwatu Groot B208 26,00 + Sriracha 0,50 + Sambal 0,50 → totalPrice 27,00, netto 24,77; twee sauzen uit verschillende groepen (167648/175168, max 1 elk).
- Kassakaart per eindproduct: sauzen op Uluwatu K/G, Biet solo/combo, Lam solo/combo; glutenvrij brood op Biet solo/combo, Hummus, Labneh, Vissoep mini/middel/groot; niet op Lamsburger.

## Model (één keer)
Regel met betaalde keuze gaat per portie (amount 1) met basis-unitPrice, toeslagen als modifier en totalPrice = basis + toeslagen; netto = totaal/(1+btw). Betaling = restaurantbedrag.

## Uitkomst testherhaling (TEST-EB-HERSTEL-20261125…)
44 ontvangsten, 0 verzendpogingen, 0 kassaberichten/orders. Blijft geblokkeerd met reden:
Bietenburger + gratis Glutenvrij (mand 1, TEST-4), Loaded Hummus + gratis Glutenvrij (mand 3, TEST-13), Lamsburger + glutenvrij brood (mand 3, TEST-18), Schulp Appelsap €4,00 (mand 2, TEST-11).
