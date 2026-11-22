# Btw-correctie Eilandbezorger — alleen voorbereiding en uitrol

## Bevestigde bron
De bestaande eigenaaractie `kaart` heeft via centraal Midsland-tokenbeheer alle 1.154 producten gelezen. Product 4636894, Naturfrisk Ginger beer, PLU Kd-a11 heeft:
- `deliveryPrice`: 4.90 euro.
- `deliveryPriceWithoutVat`: 4.4954 euro.
- `deliveryTaxClass`: `BUILTIN-9.0`.
- De gewone en afhaalprijzen hebben dezelfde bruto-/nettowaarden en btw-klasse.

De officiële L-Series Online Ordering-documentatie vereist `unitPrice`, `unitPriceWithoutVat`, `totalPrice`, `totalPriceWithoutVat`. Modifiers gebruiken een ander schema: onder andere `modifierId`, `modifierValueId`, `price` en `priceWithoutVat`; de huidige productId/amount/unitPrice-opbouw is hiervoor niet bewezen correct.

## Wat verandert
1. Eén gedeelde prijscontrole leest de actuele Midsland-kaart via bestaand tokenbeheer, met een kortlevende, vestigingsgebonden cache en gebundelde uitlezing. Geen nieuwe tabel of gewijzigde productkoppelingen. Bestaande koppelingen krijgen hun nettogegevens door hun Lightspeed-ID aan de actuele kaart te koppelen; ontbrekende nettogegevens zijn geen vrijbrief voor verzending.
2. Gebruik uitsluitend bewezen bezorgprijsvelden. Controleer bruto tegen de gekoppelde/ontvangen prijs en netto tegen de bevestigde bezorg-btw. Leid netto alleen af wanneer een expliciet bevestigde bezorgklasse en tarief dat toelaten. Nulprijzen zijn geldig; ontbrekende, afwijkende of tegenstrijdige waarden blokkeren vóór registratie van een Lightspeed-verzendpoging.
3. Pas dezelfde controle toe op ontvangst/planning en onmiddellijk vóór echte verzending. Testmodus doet geen Lightspeed-verzoek en blijft via lokale fixtures testbaar. Geen incomplete kassaberichten opslaan alsof ze verzendklaar zijn. Historische invoer, duplicaatcontrole en proefbescherming blijven intact.
4. Formaat wordt één definitief kassaproduct, zonder dubbele toeslag. Extra’s worden alleen geschreven bij bewezen catalogusrelatie, juiste prijs/btw en bevestigd L-Series-schema; onduidelijke product-extra/modifierkoppelingen blokkeren met reden, niet met verzonnen identifiers.
5. De gedeelde schrijver levert numerieke eurobedragen. Stuknetto blijft op de bevestigde catalogusprecisie; regelnetto wordt na vermenigvuldiging op centen afgerond. Voor Ginger Beer: één regel 4.90 bruto / 4.4954 stuknetto / 4.50 totaalnetto; drie stuks 14.70 bruto / 13.49 totaalnetto. De betaling blijft een lijst, één stuk precies 4.90 op 285794/type 4.

## Praktische gevolgen en grenzen
Het team hoeft niets extra in te vullen. Bij een onvolledige kaart of storing blijft de bestelling zichtbaar geblokkeerd met reden; er volgt geen onzekere keukenbon. De cache is beperkt in tijd en omvang, niet een groeiende bestelgeschiedenis. Geen fallback op een willekeurig tarief bij een drukke dienst.

GB01 en GB02 en alle pogingen blijven ongewijzigd; gewone live blijft uit. Geen nieuwe fysieke proef, order-POST, klantactie of frontendpublicatie. Alleen catalogus-GET’s indien nodig voor bewijs.

## Tests en afronding
- Onderschepte daadwerkelijke HTTP-body via ontvangst/planning en de gedeelde zendroute: Ginger Beer één/meerdere stuks, afronding, verschillende tarieven, nulprijzen, ontbrekend/afwijkend netto/tarief, formaten en bewezen/onduidelijke extra’s.
- Testmodus nul Lightspeed-verzoeken; ontbrekende catalogusdata nul orderpogingen; bestaande historische duplicaten en GB01/GB02-idempotentie blijven beschermd.
- Draai gerichte regressietests en leg bronrespons, schema en voorbeeldbody vast in documentatie.
- Rol uitsluitend `eilandbezorger-bestelling` en `eilandbezorger-beheer` uit met hun gedeelde schrijver; rapporteer deploymentbewijs en eventuele beperkingen van actieve bronverificatie.
- Rapporteer gewijzigde bestanden, bewezen prijzen, voorbeeldregel/betaallijst en werkelijke testuitslagen. Geen echte kassaproef als verificatie.

## Technische afbakening
Wijzig alleen de benodigde Eilandbezorger-functies/shared helpers, bijbehorende lokale tests, aansluit-/bronbeschrijving, AGENTS.md en roadmap. Geen migratie, rollen, nieuwe library, secrets, frontend of andere functies.