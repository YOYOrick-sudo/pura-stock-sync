# Midsland-printproeven FR01 en DE01 — uitsluitend voorbereiding

## Afbakening
Categorie: edge function / operationele logica. Geen migraties, rollenwijzigingen, aanmelding als Yorick, klant- of order-POST, echte proef, live-vlagwijziging, printer-/profielwijziging of frontendpublicatie.

De bestaande gegevens zijn uitsluitend gelezen: reguliere verzending staat uit; beide referenties ontbreken; FR01 is gekoppeld aan 4636994 / F-a12 / 700 cent en Ginger Beer aan 4636894 / Kd-a11 / 490 cent. De bestaande vaste klant en betaalwijze blijven ongewijzigd.

## FR01
- Voeg één vaste proef toe: `PV-PRINT-MID-20261122-FR01`, 1× Zoete Aardappel Friet, €7,00, geen extra, gastnaam `Pura Test`, note `TEST FR01 – NIET BEREIDEN`.
- Latere actie: `{"actie":"print_proef_fr01","referentie":"PV-PRINT-MID-20261122-FR01","bevestiging":true}`.
- Hergebruik de GB07-eigenaarscontrole, oorspronkelijke eigenaar, vaste klant 13597022, Eilandbezorger 285794/type 4, afhaaltype, actuele prijs-/btw-controle en Amsterdamse datum-/venstercontrole.
- Eigen permanente order-ID en poging-ID; vooraf geen bestaande order of poging; atomaire claim; maximaal één kassaverzoek, ook bij gelijktijdigheid of een verloren antwoord. Geen hervatting of gewone herverzending.
- Voorbereiding maakt geen order of poging aan. De datumgrens blijft 22 november 2026 Amsterdam; na middernacht blokkeren, niet stilzwijgend verlengen.

## DE01: gestopt bij twijfel
De bestaande schrijver gebruikt uitsluitend `takeaway`. Er is nog geen geverifieerd L-Series API-bewijs dat dezelfde klantorder als `delivery` zonder adres/contactgegevens geen bezorg- of dispatchgedrag oproept. Een lokaal onderschept bericht bewijst dit niet.

Daarom nu geen uitvoerbare DE01-proef toevoegen en geen `delivery`-wijziging doorvoeren. `PV-PRINT-MID-20261122-DE01` blijft ongebruikt. Voor DE01 is eerst gerichte bevestiging van het L-Series schema én het ontbreken van bezorg-/dispatchgedrag nodig; geen fysieke proef gebruiken om die veiligheid te gokken.

## Uitrolbesluit dat akkoord vereist
FR01 moet óók uitgesloten worden van de bestaande partnerontvangst en gewone verzendpaden. Die uitsluiting zit in gedeelde code die afzonderlijk wordt meegeleverd met beide functies. Alleen `eilandbezorger-beheer` uitrollen laat de actieve `eilandbezorger-bestelling` de nieuwe referentie niet herkennen.

Voor volledige bescherming is daarom de minimale veilige uitrol **`eilandbezorger-beheer` én `eilandbezorger-bestelling`**. De tweede krijgt uitsluitend de nieuwe vaste referentie-uitsluiting; geen gewone bestelstroom wijzigen. Dit is ruimer dan de gevraagde beheerfunctie-uitrol en wordt niet zonder akkoord uitgevoerd.

## Verificatie
- Netwerkloze tests van de echte beheer- en ontvangsthandlers: exacte FR01-regel/betaalarray, geen extra, juiste notitie, eigenaar versus manager/staff/partner, gewijzigde prijs/PLU/configuratie, ontbrekende klant, live-aan, eerdere order/poging, parallelle acties, timeout en geen tweede verzoek.
- Bevestig dat GB01–GB07 en hun controles ongewijzigd blijven; bestaande relevante regressietests en functiecontroles uitvoeren.
- Na toegestane uitrol uitsluitend een ongeldige, onbevestigde actie controleren: geen order/poging/prijsverzoek; live-uit en nul nieuwe proefregels teruglezen. Geen echte actie uitvoeren.

## Praktijk en latere uitvoering
Yorick voert later in de reguliere preview de vaste FR01-actie uit, na een afzonderlijke uitvoeropdracht en beveiligde eigenaarsaanmelding. Alleen hij controleert de daadwerkelijke keuken-/klantbon op de aanwezige kassa. De proef kan een keukenbon veroorzaken: de tekst NIET BEREIDEN moet zichtbaar zijn en het team moet weten dat dit geen productieopdracht is. Bij onzekere uitkomst nooit opnieuw verzenden; alleen de bestaande poging uitlezen.

Openstaande beslissingen: akkoord op de noodzakelijke uitrol van de tweede functie; DE01 blijft geblokkeerd wegens ontbrekend bewijs van de veilige bezorgvariant.