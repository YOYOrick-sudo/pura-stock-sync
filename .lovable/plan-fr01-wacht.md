# Tijdelijke FR01-bediening in de preview

## Resultaat
Yorick kan op zijn eigen ingelogde telefoon, tablet of computer de al bevestigde frietproef starten via `/cijfers/eilandbezorger`, met de knop **Verstuur frietproef FR01 (€7)**. De bestaande beheerpagina heeft deze knop nog niet. De agent heeft geen bestaande bevoegde eigenaarssessie en neemt geen andere sessie over.

## Afbakening
- Alleen frontendbediening en gerichte tests; geen nieuwe proef, backendwijziging, uitrol, publicatie, printerwijziging of wijziging van de reguliere livevlag.
- Alleen zichtbaar op bekende previewhosts, voor de bestaande bevoegde eigenaar bij Midsland, gedurende 23 november 2026 in Europe/Amsterdam.
- Hergebruik bestaande appclient en eigenaar-/vestigingscontrole; de bestaande functie blijft definitief autoriseren.

## Bediening en zekerheid
- Lees de opgeslagen FR01-order en pogingen met bestaande toegang, onafhankelijk van het huidige lijstfilter, over beide datumreferenties en de permanente IDs.
- Toon opgeslagen status, aantal pogingen, Nederlandse tijd, HTTP-status en werkelijk Lightspeed-order-ID indien beschikbaar; toon leesfouten expliciet en blokkeer bij onvolledige controle.
- De knop doet uitsluitend na bewust aanklikken één aanroep met `actie: print_proef_fr01`, `referentie: PV-PRINT-MID-20261123-FR01` en `bevestiging: true`.
- Controleer vlak vóór de aanroep opnieuw dat er geen order/poging bestaat. Vergrendel onmiddellijk tegen dubbelklikken en blijvend in dezelfde browser na de aanroep, ook bij een onzekere uitkomst. Alleen statuslezen mag automatisch verversen; verzending nooit.
- Een andere tablet kan al verzonden hebben: de opgeslagen poging en bestaande atomaire serverclaim voorkomen dubbele tickets. Bij storing blijft de knop vergrendeld; geen automatische of handmatige retry aanbieden.

## Technisch en verificatie
Categorie: frontendlogica met bestaande alleen-lezen queries; geen schema-, RLS- of rolwijziging.
Route/toegang: bestaande beschermde `/cijfers/eilandbezorger`; tijdelijke actie alleen voor de reeds bevoegde oorspronkelijke eigenaar en Midsland.
Gebruik een kleine afzonderlijke proefbediening, bestaande Pura-bouwblokken en semantische tokens; behoud overige beheeracties.
Gerichte tests voor datumgrens, preview-only, bevoegdheid/vestiging, vaste referentie en blokkering bij order/poging/onzekere uitkomst. Controleer preview en actuele bouwmelding. Geen testregels in live tabellen.
Uitvoering door de agent is uitsluitend mogelijk als de juiste bestaande eigenaarssessie beschikbaar komt; anders lever de knop met exact previewpad op en meld dat Yoricks eigen browser nog moet klikken.