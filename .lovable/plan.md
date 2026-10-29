# Bestellijst: echte make-over volgens shadcnblocks

## Eerlijk antwoord
Nee, nog niet alles is doorgevoerd. De bouwblokken en regels staan op /design-system, maar de Bestellijst gebruikt ze maar half. Alleen het tabblad Bord heeft de nieuwe opbouw; Advies, Onderweg en Tellen nog niet. De pagina mist ook de vaste opbouw die je bij shadcnblocks ziet (kengetallen bovenaan, een tabel in een kaart met kop en eindregel).

## Wat de pagina wordt (zoals de shadcnblocks-voorbeelden)

```text
+-------------------------------------------------------------+
| [Op bord 12] [Besteld 5] [Onderweg 8, 2 te laat] [Geen prijs 3] |  <- 4 kengetal-kaarten, aantikbaar = filter
+-------------------------------------------------------------+
| Bord | Advies | Tellen | Onderweg        [Zoek...] [+ Erbij] |  <- één balk: tabs links, zoek + 1 primaire knop rechts
+-------------------------------------------------------------+
| Kaart                                                        |
|  Leverancier A  (inklapbaar, aantal rechts)                  |
|   [ ] Product            Aantal   Prijs   Status   ...       |
|  Leverancier B                                               |
|  ----------------------------------------------------------  |
|  12 artikelen · totaal € 340                [Alles besteld]  |  <- eindregel
+-------------------------------------------------------------+
```

1. **Kengetallen bovenaan**: vier kaarten op één rij (telefoon: 2x2). Tik op een kaart filtert de lijst. Vervangt de losse "Overzicht"-kaart en de samenvatting rechts.
2. **Eén actiebalk**: tabs, zoekveld en één groene knop "Erbij". Geen andere losse knoppen.
3. **Alle vier tabbladen dezelfde tabel**: gegroepeerd per leverancier, inklapbaar, dezelfde kolommen, één status per rij, acties in "…". Advies, Onderweg en Tellen krijgen dezelfde opbouw als Bord.
4. **Eindregel per tabel**: aantal artikelen, totaalbedrag en de bulkactie ("Alles besteld" / "Alles geleverd").
5. **Lege staat**: nette lege-kaart met icoon en één knop, in plaats van grijze tekst.
6. **Rij klikbaar** opent de bewerklade (met de stappen Op bord → Besteld → Geleverd).
7. **"Geen prijs" aantikbaar**: opent direct prijs invullen.

## Wat niet verandert
Bestellen, tellen, opslaan, advies-berekening en de koppeling met Midsland blijven precies zoals ze zijn. Alleen de weergave verandert.

## Risico's
- Team is aan de huidige plek van knoppen gewend: "Alles geleverd" verhuist naar de eindregel onderaan.
- Filteren via kengetallen kan verwarren als je vergeet dat een filter aan staat; daarom toont de kaart duidelijk "actief" en is er een kruisje om te wissen.

## Verificatie
Schermafbeeldingen ingelogd op 390, 834 en 1349 px breed van alle vier tabbladen, zodat je vóór en na kunt vergelijken. Tests en designregels-check moeten slagen.

## Technisch
- Nieuwe presentatiecomponenten in components/kitchen/bestelbord: `BestelKengetallen`, `BestelActieBalk`, `LeverancierGroep`; hergebruik pura `StatCard`, `ZoekVeld`, `TabelVoet`, `StatusLabel`, `RijMenu`, `InklapGroep`, `EmptyState`.
- AdviesTabel, OnderwegTabel en tellen-weergave omzetten naar CompacteTabel + LeverancierGroep.
- Filterstatus alleen lokaal in Bestelbord.tsx (useState); bestaande queries en mutaties ongemoeid.
- Eerst sessie aanmaken via `lovable auth-session` zodat screenshots ingelogd werken.
