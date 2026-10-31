# Vaste zijmarge in kaarten

## Probleem
Kaartkoppen en voetregels houden 16px afstand tot de rand, maar de tabelrijen in de bestelbordkaarten maar 8px. Daardoor plakken tekst, bedragen en het "…"-knopje tegen de linker- en rechterrand, en lijnt de inhoud niet uit met de kop ("Per leverancier", "1 product").

## Standaard (gangbaar in enterprise-apps zoals Linear, Stripe en Shopify)
- Kaartrand naar inhoud: **16px** op telefoon en tablet, **24px** vanaf desktop (≥1024px).
- Tussen kolommen: 8px (blijft compact).
- Kop, rijen en voet van een kaart gebruiken allemaal dezelfde zijmarge, zodat alles op één lijn staat.
- Vinkjes en het "…"-knopje houden hun 44px-tikvlak; alleen de buitenmarge verandert.

## Wat verandert
1. Compacte bestelbordtabel: eerste en laatste kolom krijgen de vaste zijmarge; de middenkolommen blijven compact. Dit geldt in één keer voor Op het bord, Onderweg, Advies, Keukenadvies en het overzicht Per leverancier.
2. Kaartkop, voetregel, laad- en foutregel in de gedeelde bouwblokken krijgen dezelfde marge (16px, 24px op desktop).
3. Invoerkaart "Product toevoegen…": zelfde buitenmarge, zodat het veld uitlijnt met de rijen eronder.
4. Regel toevoegen aan het Regelboek op /design-system: "Zijmarge in kaarten: 16px, 24px vanaf desktop; kop, rijen en voet gelijk."

## Niet aangeraakt
Bestellogica, tellers, de schakelaar v2, database. Niet publiceren.

## Risico
Op een smalle telefoon (320px) gaat er 16px breedte af per kant in de tabellen; productnamen die al afgekapt worden, worden iets eerder afgekapt. Dit controleer ik op 320, 390, 768 en 1280px.

## Technisch
- `CompacteTabel.tsx`: `[&_td:first-child]:pl-4 [&_td:last-child]:pr-4` (+ `lg:pl-6/pr-6`), idem voor `th`; uitzondering cellen met `!px-0` (vinkjes) houden 44px-label maar krijgen buitenmarge via `first-child:pl-2`.
- `patronen.tsx`: `KaartKop`, `LijstKaart`-voet, `LaadRijen`, `FoutRegel` naar `px-4 lg:px-6`.
- `GroepRij` (leverancierskop in tabel) zelfde marge.
- Regelboek-entry + bestaande designregels-test blijft groen.
