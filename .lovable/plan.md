# Bestellijst: zoeken en toevoegen duidelijk scheiden

## Wat verandert er?
- Het zoekveld heet **‘Zoeken in deze lijst’** en blijft bij de tabbladen. Het filtert alleen bestaande regels.
- De groene knop heet **‘Product toevoegen’**. Dit wordt de duidelijke ingang om iets op de bestellijst te zetten.
- De invoerbalk verschijnt pas na die knop. Het productveld heet **‘Welk product wil je bestellen?’**; na productkeuze staan verpakking en aantal erbij. De bevestiging heet **‘Toevoegen’**. Sluiten kan zonder iets toe te voegen.
- Eerder gekozen producten staan alleen in de geopende invoer, niet steeds boven de lijst.
- De vier grote overzichtskaarten verdwijnen uit de vaste bovenkant. Hun informatie en bestaande acties blijven bereikbaar onder een ingeklapt **‘Overzicht’**. Aantallen blijven bij de tabbladen; het totaal blijft onder de lijst.

## In de praktijk
Een teamlid gebruikt op telefoon of keukentablet één herkenbare knop voor toevoegen. Zoeken en bestellen worden niet meer twee bijna gelijke tekstvelden naast elkaar. Er is geen nieuwe werkafspraak nodig: een product komt nog steeds pas na bevestigen op het bord. Dichtklappen van de invoer mag ingevulde gegevens niet wissen.

## Afbakening en risico
Alleen de presentatie van Bestelbord in de preview; niet publiceren. Geen wijzigingen aan prijzen, berekeningen, deadlines, verpakkingsregels, rechten, database of koppelingen. De controle op geblokkeerde verpakkingen en ‘eenheid controleren’ blijft behouden. Het overzicht moet bereikbaar blijven, anders raakt de prijsfilter uit zicht. De invoer blijft binnen de lijstkaart om een extra, afwijkende dialoog te vermijden.

## Technisch en controle
- Categorie: frontend/UI; bestaande gegevens, queries en mutaties blijven gelijk.
- Gebruik de bestaande Pura-bouwblokken en stijl voor de inklapbare invoer en het overzicht; geen nieuwe kleuren of lettertypen.
- Controleer zoeken, openen/sluiten zonder invoerverlies, product- en verpakkingskeuze, toevoegen en de prijsfilter.
- Controleer telefoon, iPad en desktop op overlopen en tikvlakken van minimaal 44px.
- Draai de bestaande tests en controleer de automatische build. Geen echte testbestellingen zonder toestemming.