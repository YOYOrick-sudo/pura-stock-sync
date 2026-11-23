# Burger- en extra-uitbreiding Midsland — 23 november 2026

## Echt verwerkt

Uitsluitend deze twee optionele combikoppelingen toegevoegd:

| Eilandbezorger gerecht | Keuze | PLU | Kassaproduct-ID | Compleet | Toeslag per burger |
|---|---|---|---|---:|---:|
| PV-BE202ED8 Lamsburger | PVK-174BACEE-1 | B215 | 3370275 | €22,50 | €7,00 |
| PV-CE0EF3F3 Bietenburger | PVK-174BACEE-1 | BPB6 | 4499175 | €22,50 | €7,00 |

De solokoppelingen ontbraken bij de eerste controle en kwamen tijdens deze opdracht afzonderlijk beschikbaar. Alleen teruggelezen, niet door deze opdracht toegevoegd: B198/3278381 en BPB4/4499170, elk €15,50.

Verplichte formaten zijn standaard ongewijzigd verplicht; uitsluitend de twee bovenstaande rijen hebben `keuze_verplicht=false` en `keuze_toeslag_cent=700`. Basis en toeslag worden apart gecontroleerd: €15 + €7,50 is niet toegestaan ondanks hetzelfde totaal. Friet wordt uit de extra’s verwijderd en levert één complete productregel met het bestelde aantal op.

## Werkelijke normale ontvangsttests

Alle nummers beginnen met `TEST-EB-20261123-112651-768b5-`; hieronder staat het volledige suffix. Elke bestelling is via de normale ontvanger in modus **test** aangeboden en daarna via status-GET én opgeslagen regels/pogingen teruggelezen. Alle status-GETs: **HTTP 200**. Tijd: ongeveer **12:26–12:27 Europe/Amsterdam**.

| Suffix | POST | Teruggelezen status | Product / aantal / totaal |
|---|---:|---|---|
| LAM-SOLO | 201 | test_ok | B198 / 1 / €15,50 |
| LAM-FRIET | 201 | test_ok | B215 / 1 / €22,50 |
| LAM-FRIET2 | 201 | test_ok | B215 / 2 / €45,00 |
| BIET-SOLO | 201 | test_ok | BPB4 / 1 / €15,50 |
| BIET-FRIET | 201 | test_ok | BPB6 / 1 / €22,50 |
| BIET-FRIET2 | 201 | test_ok | BPB6 / 2 / €45,00 |
| BOWL-KLEIN | 201 | test_ok | Dh16 / 1 / €16,50 |
| LAM-DUBBEL | 422 | afgekeurd | Dubbele frietkeuze |
| BIET-DUBBEL | 422 | afgekeurd | Dubbele frietkeuze |
| LAM-FRIETAANTAL | 422 | afgekeurd | Frietkeuze aantal 2 per burger |
| BIET-FRIETAANTAL | 422 | afgekeurd | Frietkeuze aantal 2 per burger |
| LAM-PRIJS | 422 | afgekeurd | Onjuiste basisprijs/toeslag |
| BIET-PRIJS | 422 | afgekeurd | Onjuiste basisprijs/toeslag |
| LAM-VERKEERD | 422 | afgekeurd | Bowlmaat bij burger |
| BIET-VERKEERD | 422 | afgekeurd | Bowlmaat bij burger |
| BOWL-ZONDER | 422 | afgekeurd | Verplichte bowlmaat ontbreekt |
| BOWL-VERKEERD | 422 | afgekeurd | Burgerfriet in plaats van bowlmaat |

**17 nummers: 7 test_ok, 10 correct afgekeurd. Elk 0 verzendpogingen, kassabericht null en Lightspeed-order-ID null.** Bij alle geaccepteerde burger-/bowlregels zijn de verwerkte keuze-extra’s leeg, dus geen dubbele toeslag. De afzonderlijke bestaande ontvanger-rooktest `TEST-1795433254864` is afgekeurd voor een onbekend testproduct; ook daarvoor nul pogingen en geen kassabericht/order-ID.

## Reguliere extra’s

- Mappingsoort blijft `extra`. Externe sleutel: `gerechtcode|extracode` of specifieker `gerechtcode|definitief-kassaproduct-ID|extracode`.
- Productgebonden koppeling gaat vóór gerechtgebonden koppeling; een expliciet inactieve specifieke koppeling blokkeert fallback. Geen globale extra-fallback.
- `lightspeed_product_id` bevat voor extra’s de echte **optiewaarde-ID**, niet een willekeurig voorraadproduct. De actuele catalogus moet precies die waarde in de additions van het definitief gekozen product bevatten; de echte modifiergroep wordt daaruit gehaald.
- Testontvangst met overblijvende reguliere extra’s controleert gericht de actuele kaart en btw via GET, zonder kassabericht of poging. Catalogusstoring of onvoldoende bewijs geeft afkeuring, niet test_ok.
- Onbekende/verkeerde-gerecht/verkeerde-product opties, dubbele codes, dubbele optiewaarden en tegenstrijdige waarden in dezelfde groep blokkeren. Meervoudige en betaalde modifiers blijven dicht; alleen bewezen gratis opties met echte nulnetto/nulbruto zijn ondersteund.

## Beperkingen en controle

Er zijn **geen echte reguliere extra-koppelingen** toegevoegd: de opdracht staat alleen de twee geverifieerde combikoppelingen toe en gaf geen bewezen optiewaarde-ID’s. Die positieve toepasselijkheidsroute is volledig lokaal getest met expliciet fictieve catalogusfixtures; die zijn niet opgeslagen of naar Lightspeed gestuurd. Dit bewijst de controle, niet een echte saus-/toppingkoppeling.

De 17 testontvangsten bewijzen de opgeslagen koppelingen, normalisatie en bedragen, niet actuele Lightspeed-bezorgprijzen/btw of fysieke bonnen. De bestaande actuele prijs-/btwcontrole blijft verplicht vóór planning én verzending; bij verschil of ontbrekende betaalgegevens blijft verzending geblokkeerd.

Alleen `eilandbezorger-bestelling` en `eilandbezorger-beheer` uitgerold. Geen Lightspeed-schrijfacties, kassaorders, menukaartprijswijzigingen, printerwijzigingen of liveschakelaarwijzigingen. Live=false opnieuw teruggelezen. FR01 en andere proefvoorzieningen alleen netwerkloos geregressietest, niet uitgevoerd of aangepast.