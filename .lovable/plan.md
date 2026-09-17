# Productkaarten West — deel 1 verwerken (en het model uitbreiden naar een ketting)

## Wat jouw uitleg laat zien

Elk product heeft niet één herkomst, maar een **ketting van niveaus**:

```text
KOELWERKBANK  <- KOELCEL  <- VRIESCEL  <- inkoop of Midsland
```

Per niveau hoort er iets te liggen, en per niveau is er een andere actie als het op is.
Voorbeeld gerookte zalm: halve 1/6 in de koelwerkbank, 2 pakjes in de koelcel, voorraad in de vriescel, en pas als de vriescel leeg raakt gaat het op het bestelbord.

Het huidige systeem kent maar één herkomst per product. Daarom breid ik de productkaart uit
zodat per product elk niveau zijn eigen doelvoorraad en eigen vervolgactie heeft.

## Hoe het op de sluitlijst werkt

- **Koelwerkbank bijvullen** blijft het dagelijkse blok: per product de juiste bak, knop "Bijgevuld" of "Op".
- "Op" bij de koelwerkbank betekent: ik heb het uit de koelcel gehaald, maar dat was de laatste.
  Dan verschijnt het product automatisch in het blok **Koelcel op peil** met de vervolgactie van dat niveau
  (bereiden in West, uit de vriezer halen/ontdooien, bestelbord, of bestellijst Midsland).
- Zo hoeft niemand te weten waar iets vandaan komt; je meldt alleen "op".

## Deel 1 — vastgelegd (8 producten)

| Product | Koelwerkbank | Koelcel | Vriescel | Als de vriescel/bron op is |
|---|---|---|---|---|
| Bananenpannenkoeken | 1 bak (maat?) rechtstreeks uit de vriezer | n.v.t. | ja | bestellijst Midsland |
| Forel | halve 1/6 | ja | ja | bestelbord (inkoop) |
| Gerookte zalm | halve 1/6 | 2 pakjes | ja | bestelbord (inkoop) |
| Falafel | volle hoge 1/6 | 1 zwarte bak, bereid in West | ja (rauw) | bestelbord (inkoop) |
| Döner/kebab | hoge 1/6 vol | 2 zwarte bakken, gevacumeerd | ja | bestelbord (inkoop) |
| Tempeh | halve 1/4 | 1 gevacumeerde zak | ja | bestellijst Midsland |
| Feta (verkruimeld) | midden 1/6 | 4 zakken verkruimeld, verwerkt in West | n.v.t. (koeling) | bestelbord (inkoop) |
| Kaas belegen | hoge 1/6 | ja | n.v.t. | bestelbord (inkoop) |

Twee dingen die ik wil laten bevestigen (ik zet ze er alvast zo in):
- Bij kebab zei je "2 zwarte bakken met falafel" — ik ga uit van **kebab** in die bakken.
- De bakmaat van bananenpannenkoeken in de koelwerkbank heb ik niet; ik zet er "1 bak" neer.

## Wat ik nu doe

1. Productkaart uitbreiden met niveaus: per product een regel voor koelwerkbank, koelcel en vriescel,
   elk met doelaantal, bakmaat en vervolgactie.
2. De 8 producten uit deel 1 invoeren volgens de tabel hierboven; bestaande dubbele/oude regels
   voor dezelfde producten opruimen zodat ze niet twee keer op de lijst staan.
3. "Op" laten doorschuiven naar het niveau eronder in plaats van meteen naar bestelbord/MEP,
   behalve op het laagste niveau (daar gaat het naar bestelbord of Midsland).
4. Het beheerscherm (Instellingen → MEP → Voorraad-check) laat de ketting per product zien,
   zodat je later zelf kunt bijstellen.

Daarna wacht ik op deel 2 en voeg die producten op dezelfde manier toe.

## Technisch

- `koelcel_check_items` krijgt `product_sleutel` (groepeert de niveaus van één product) en
  `niveau` (werkbank | koelcel | vriezer), plus per regel `bron` voor het laagste niveau.
  Bestaande regels migreren mee: huidige `plek` wordt `niveau`, `product_sleutel` afgeleid van de naam.
- `bestemmingVoorBron` wordt `vervolgactieVoorRegel`: bestaat er een regel op het niveau eronder,
  dan wordt dát de bestemming (status `gemeld`, item verschijnt in dat blok). Anders bestelbord,
  Midsland-order of MEP zoals nu.
- Geen nieuwe libraries; blokken, realtime sync, 44px tikdoelen en optimistische updates blijven gelijk.

## Risico's

- Producten kunnen tijdens de overgang dubbel verschijnen; oude losse regels worden in dezelfde
  migratie gedeactiveerd.
- Een verkeerd ingeschatte bakmaat geeft verkeerde verwachtingen in de keuken; alles is in het
  beheerscherm aan te passen zonder mijn hulp.
