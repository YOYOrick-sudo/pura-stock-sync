# Koelwerkbank: tellen op reserve in plaats van vulling

## Wat er nu misgaat

De ronde vraagt hoe vol het bakje in de werklade is. Dat klopt niet met hoe jullie werken: een half bakje tomatentapenade hoeft niet aangevuld te worden zolang er nog een vol reservebakje onderin staat. Pas als dat reservebakje naar de werklade gaat, moet er een nieuwe reserve gemaakt of gehaald worden.

## Nieuwe regel

Voor werkbankproducten telt alleen de reserve.

- Per product staat er een reserve-aantal (meestal 1 bakje, soms 2).
- Tijdens de ronde tel je alleen de reservebakjes: hele bakjes, plus/min.
- Ligt er minder reserve dan afgesproken, dan gaat precies dat verschil op de aanvulbon en volgt het de bestaande route: uit de koelcel, uit de vriescel (met Ontdooid-sticker), naar MEP, naar Midsland of naar het bestelbord.
- Het bakje in de werklade tel je niet meer. Geen vol/half/bodempje meer voor de koelwerkbank.
- Reserve leeg krijgt geen speciale markering; het komt gewoon in de bon.

## Hoe het tellen eruitziet

Eén blok "Reserve koelwerkbank", in looproutevolgorde per lade, want in de praktijk ligt 90% van de reserve in dezelfde lade. Per product:

```text
Tomatentapenade        reserve 1     [ − ]  1  [ + ]     Links onder
Chimichurrimayonaise   reserve 1     [ − ]  0  [ + ]     Links onder
Zeewier-algenmayonaise reserve 2     [ − ]  2  [ + ]     Midden onder
```

Past een bakje een keer niet in de vaste reservelade, dan blijft het gewoon in de lijst staan met zijn normale plek erachter — je telt wat je ziet, waar het ook ligt. De ronde blokkeert daar niet op.

Toppings, koelcel en vriescel blijven precies zoals ze nu zijn.

## Instellen

In het scherm Koelwerkbank indelen komt er per product één veld bij: hoeveel bakjes reserve. Standaard 1 voor alle werkbankproducten. Zet je het op 0, dan doet het product niet mee in de reserveronde.

Lades kun je aanwijzen als reservelade, zodat de ronde ze in de juiste volgorde zet en de bon laat zien waar het bakje terug moet.

## Wat verandert er voor het team

De ronde wordt korter: je trekt de reservelade open, telt de bakjes, klaar. Geen inschatting meer van hoe vol iets is. De afspraak die mee moet veranderen: reserve aanvullen is een dagelijkse taak, niet iets wat je doet als je het toevallig ziet.

Risico om in de gaten te houden: staat er een reservebakje ergens anders en tel je het niet mee, dan bestelt de app er één te veel. Daarom staan alle reserveproducten in één lijst, ook die zonder vaste lade.

## Technisch

- Migratie: `reserve_doel integer` (default 1 voor actieve West-werkbankitems, 0 voor de rest) op `koelcel_check_items`; `rol text` ('werk' | 'reserve', default 'werk') op `voorraad_lades`.
- `VoorraadRonde.tsx`: voor plek `werkbank` vervalt de vol/half/bodempje-stepper en de vulgraadlogica uit `voorraad-formaat.ts`; tellen gaat op hele bakjes tegen `reserve_doel` in plaats van `doel_aantal`/`doel_aantal_druk`. Groepering per lade blijft, gesorteerd met reservelades eerst.
- Bonberekening: `tekortVan(reserve_doel, geteld, onderweg)` voor werkbankitems; routing via bestaande `vervolgactieVoorRegel`, `vulAanUitNiveau` en `meldOp` blijft ongewijzigd, inclusief Ontdooid-sticker.
- `KoelwerkbankIndeling.tsx` / `useVoorraadLades.ts`: reserve-aantal per product bewerken, lade-rol instellen.
- Producten met een half doel uit de eerdere migratie (Forel, Gerookte zalm, Tempeh, Blauwe bessen, Rode peper) krijgen in deze migratie een heel reserve-aantal; die zet ik op 1 tenzij je een ander getal noemt.
- Geen nieuwe libraries.
