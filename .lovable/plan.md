# Sluitronde keuken in dezelfde vorm als de andere sluittaken

## Probleem
De afvinkronde is een eigen witte kaart met een grote kop, een uitlegregel, een groene balk en eigen lade-kaartjes. Daaronder staan de gewone keukentaken zonder eigen kop. Daardoor voelt de afvinkronde als "het echte werk" en lijken de taken eronder niet meer te hoeven.

## Wat er verandert
- **Zelfde kop als de rest**: "Sluitronde keuken" krijgt dezelfde grijze balk als "Samen / Start" en "Samen / Laatste loodjes", met de stand rechts als pil ("12/39", groen met vinkje als alles af is) en het pijltje om in te klappen. De uitlegregel gaat achter het info-icoon. De losse groene voortgangsbalk vervalt.
- **Geen witte kaart eromheen**: de lades (Links boven, Flessen, Toppings …) worden kleine tussenkopjes zoals de categoriekopjes in de takenlijst, met hun eigen stand rechts.
- **Rijen zoals taken**: zelfde rondje om af te vinken, zelfde letter en tussenruimte als een gewone taakrij. "Bron op" en "Naar MEP" blijven rechts, iets compacter.
- **Keukentaken krijgen weer een kop**: onder de sluitronde komt een balk "Keuken" met stand ("0/32"), zodat duidelijk is dat dat een eigen blok is dat ook af moet.
- Zelfde ruimte tussen alle blokken (32px), zodat de lijst één ritme heeft.
- **Eenheid door de hele lijst**: elke afvinkbare regel (gewone taak, sluitronde-product, au bain-marie, maandagtelling-kop) begint op dezelfde lijn links, heeft hetzelfde rondje op dezelfde plek, dezelfde letter voor de naam en dezelfde kleine grijze regel eronder. Knoppen rechts ("Bron op", "Naar MEP", "Weggooien", "Sticker") krijgen één vorm en hoogte. Afgevinkt ziet er overal hetzelfde uit (doorgestreept, grijs).

Volgorde blijft: Samen / Start → (maandag: telling) → Sluitronde keuken → Keuken → au bain-marie → Samen / Laatste loodjes.

## Wat niet verandert
Afvinken, Bron op, Naar MEP, Herstel, wifi-melding met Opnieuw, de maandagtelling, de keten en alles in de database blijven precies hetzelfde. Alleen de opmaak.

## Technisch
- `AfvinkRonde.tsx`: buitenste `section`-kaart en eigen header vervangen door `SectieBalk` (titel, stand `klaar/alle`, afgerond, open/onToggle) + `InfoKnop` voor de uitleg; voortgangsbalk weg; wrapper `marginBottom: 32px`; groepskop in stijl van de categoriekop uit `renderCategoryGroups`; rijen overnemen in maat/typografie van taakrijen (44px tikdoel blijft).
- `FohTasks.tsx`: in de West-keuken-sluitfase `hideHeader` voor `eigen` uitzetten zodat de "Keuken"-balk getoond wordt (alleen keuken + sluit, bediening ongewijzigd).
- Verificatie: preview op telefoon (402px) en iPad met keukenaccount West, Sluiten-tab Keuken; kopjes meten op gelijke hoogte/rand; afvinken + Bron op nogmaals proberen en testdata opruimen.
