# Bestellijst: één navigatie in plaats van twee

Je hebt gelijk: de kaarten en de tabs eronder tonen hetzelfde (Op het bord 6, Advies 2, Onderweg 21), en het inklapbare "Overzicht" is een extra tik zonder dat het iets oplevert.

## Wat verandert
- Het blok "Overzicht" met de vier kaarten verdwijnt helemaal, dus ook het in- en uitklappen.
- De tabs blijven als enige navigatie: Op het bord · Advies · Tellen · Onderweg, met hun aantal.
- De twee dingen die alleen op de kaarten stonden, krijgen een vaste plek:
  - **Totaalbedrag (€ 81,40)** staat al onderaan de lijst, in de totaalregel. Verder geen plek nodig.
  - **Geen prijs (5)**: één klein oranje knopje rechts naast de tabs, alleen als er producten zonder prijs zijn. Tik = alleen die tonen, nog eens tikken = filter uit.
  - **"20 te checken"** bij Onderweg: wordt de oranje stip of het oranje getal in de tab Onderweg, alleen als er iets te checken valt.

## Wat blijft gelijk
De tabs, toevoegen, bestellen, aantallen, prijzen, deadlinebadges en de filter "geen prijs" zelf. Geen database-wijzigingen, niets publiceren.

## Technisch
- `Bestelbord.tsx`: `InklapGroep` + `BestelKengetallen` eruit; een kleine "Geen prijs"-knop (warning, alleen bij >0) naast de TabsList die `alleenZonderPrijs` omzet; "te checken" als warning-teller in de Onderweg-trigger.
- `BestelKengetallen.tsx` wordt dan nergens meer gebruikt en wordt verwijderd.
