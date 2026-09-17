# Voorraadcheck West opnieuw opzetten

Je hebt gelijk: het scherm is nu een muur van 44 regels met per regel drie knoppen die allemaal een andere breedte en een andere tekst hebben. Op een iPad tijdens het sluiten is dat niet te doen.

## Wat er nu misgaat
- 44 koelcelregels, 34 werkbankregels en 3 toppingsregels staan allemaal open onder elkaar. Je scrollt eindeloos.
- Per regel drie knoppen naast elkaar, met wisselende teksten: "Op", "Doorgezet", "Halen uit de vriescel", "Bijvullen uit de koelcel". De rechterrand golft daardoor alle kanten op.
- Onder elke naam staat een grijze zin vol routebeschrijving ("Aanvullen uit de vriescel · daarna de bestellijst voor Midsland · 17 zak besteld, nog niet geleverd"). Dat is informatie die je pas wilt zien als er iets mis is.
- De voortgangsbalk ziet eruit als een schuifknop in plaats van een balk.
- Tussen de regels zit veel lucht maar geen duidelijke scheiding, dus alles loopt visueel in elkaar over.

## Hoe het wordt
Eén ritme, één beslissing per regel.

```text
Koelcel op peil                                   3 / 44
--------------------------------------------------------
 Gesneden bloemkool          1x        [  Oke  ] [  !  ]
 Forel                       1x        [  Oke  ] [  !  ]
 Gerookte zalm               2x   ✓ bijgewerkt
```

- **Twee knoppen, altijd even breed, altijd op dezelfde plek.** Groen "Oké" (ligt er) en een grijze knop met uitroepteken (klopt niet). Beide 48 px hoog.
- **De vervolgactie verhuist naar een venster.** Tik je op de grijze knop, dan opent één compact venster dat vertelt wat je moet doen: "Pak 1 forel uit de vriescel" met de knoppen *Gedaan*, *Te weinig* en *Vriescel is ook leeg*. Alle route-uitleg verdwijnt uit de lijst.
- **Afgehandelde regels vouwen dicht** in een dunne regel met een vinkje, zodat de lijst korter wordt terwijl je vordert.
- **De lijst krijgt echte tabelregels**: dunne scheidingslijn, vaste rijhoogte, naam links, aantal ernaast in een grijs chipje.
- **De secties blijven vier stuks** (Vriescel maandag, Koelcel, Koelwerkbank, Toppings), elk met een sticky kop met titel en teller, in te klappen zodra hij op nul openstaande regels staat.
- **Bestelinfo alleen waar relevant**: "besteld, nog niet geleverd" komt als klein groen chipje rechts, niet in een lopende zin.

## Eén punt om te checken
Bij Tempeh staat nu "17 zak besteld, nog niet geleverd" en bij Vissoep "26 stuks". Dat lijkt niet te kloppen met de dagelijkse praktijk. Ik controleer die openstaande bestellingen en meld wat eruit komt voordat ik dat chipje toon.

## Technisch
- Alleen `src/components/foh/KoelcelCheckBlok.tsx` wordt herschreven: `ItemRij` naar twee acties, `CheckBlok` naar een tabelraster met sticky kop en inklapbare afgehandelde regels, `AanvulDialog` en `TekortDialog` samengevoegd tot één actievenster.
- De inline stijlen gaan naar Tailwind-klassen met de bestaande tokens (20 px kaarten, 14 px knoppen, primary green).
- Geen wijziging aan `useKoelcelCheck.ts`, aan de ketenlogica of aan de database; alleen presentatie. De bestaande functies `vervolgactieVoorRegel`, `meldOp` en `vulAanUitNiveau` blijven ongewijzigd in gebruik.
- Controle op de openstaande bestellingen gebeurt met een leesquery op `internal_orders` / `internal_order_items` voordat er iets verandert.
