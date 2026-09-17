# Deel 3: zoet in de voorraad-check (West)

Al het zoet wordt in Midsland gemaakt, ligt in de vriescel in West en wordt van daaruit
aangevuld in de koelcel. Elk product krijgt dus twee regels: één in de koelcel en één in
de vriescel. Is de koelcel leeg, dan wijst de app naar de vriescel. Is de vriescel ook leeg,
dan komt het automatisch op de bestellijst voor Midsland.

## Wat erin komt

| Product | Koelcel | Vriescel (nieuw) |
| --- | --- | --- |
| Wortel-walnoot | 3 bakken | 2 bakken |
| Cheesecake | 2 bakken | 2 bakken |
| Notenbar | 1 bak | 2 bakken |
| Bananencake | 1 bak | 2 bakken |
| Koffiebrownie | 1 bak | 2 bakken |
| Appeltaart (special) | 1 bak | 1 bak |
| Muffin vanille-wortel-kaneel | 6 stuks | 6 stuks |
| Muffin banaan-amandel | 6 stuks | 6 stuks |

De aantallen voor de vriescel zijn mijn voorstel, want die heb je nog niet genoemd. Ze zijn
per product in één scherm aan te passen (Instellingen → MEP → Voorraad-check), en elk
product heeft daarnaast een apart aantal voor drukke dagen.

## De vriescel-voorraad afmaken

Je punt klopt: zonder doelaantal in de vriescel kan de app niet zien wanneer er besteld moet
worden bij Midsland. Ik vul daarom in dezelfde stap de ontbrekende vriescel-aantallen aan
voor alle Midsland-producten uit deel 1 en 2 (bananenpannenkoeken, kip, soepen, tomatenjam,
tomatenrelish, wortelspread). Voor elk zet ik een startaantal, zodat de keten overal
doorloopt tot aan de bestellijst voor Midsland.

## Hoe het straks loopt

```text
koelcel leeg  ->  "Op"  ->  pak uit vriescel (taak "Ontdooien"/uithalen)
vriescel leeg ->  "Op"  ->  bestellijst voor Midsland
```

Bij het zoet betekent dat in de praktijk: bij het sluiten tel je de bakken in de koelcel,
je tikt Aanwezig of Op, en de rest regelt de app.

## Technisch

- Eén migratie met nieuwe rijen in `koelcel_check_items` voor vestiging West:
  per product een regel `plek='koelcel'` (`bron='vriezer'`) en `plek='vriezer'`
  (`bron='midsland'`), met hetzelfde `product_sleutel` zodat `NIVEAU_ONDER` de melding
  doorschuift.
- Bananencake bestaat al op de werkbank (lade); die krijgt hetzelfde `product_sleutel`,
  zodat werkbank → koelcel → vriescel → Midsland één keten wordt.
- Nieuwe `eenheid`/`bak_maat`: "bak" en "stuks" (muffins); categorie zoet blijft binnen de
  bestaande blokken Koelcel op peil en Uit de vriezer.
- `doel_aantal_druk` gevuld (meestal +1 bak, muffins +6).
- Aanvullende UPDATE's die ontbrekende vriescel-regels/aantallen voor Midsland-producten
  uit deel 1 en 2 invullen.
- Geen wijziging in `useKoelcelCheck.ts`, `KoelcelCheckBlok.tsx` of `VoorraadCheckBeheer.tsx`
  nodig; de bestaande routing dekt dit al.

## Waar je op moet letten

- Zoet in de koelcel kan snel gaan in het seizoen; loop de drukke aantallen één keer na.
- Muffins tellen per stuk, de rest per bak — dat staat zichtbaar bij elk product.
- Specials (appeltaart) wisselen mogelijk per periode; die kun je in het beheerscherm
  op inactief zetten in plaats van verwijderen, zodat de historie blijft.
