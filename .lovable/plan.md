# Koelcel-check West: van whiteboard naar sluitlijst + MEP-koppeling

## Doel
Het whiteboard "Voorraad koelcel" verdwijnt. De backup-voorraadcontrole komt op de sluitlijst van de keuken (West), en wat ontbreekt gaat met één tik automatisch naar de mise-en-place — zodat het team zonder leidinggevende nooit een handmatige overstap hoeft te maken.

## Hoe het eruitziet (sluitlijst West)
Onderaan de sluitfase van de takenlijst komt een eigen blok **"Voorraad koelcel"** met per product één regel:

```text
Gesneden bloemkool   1x   [ ✓ Aanwezig ] [ + Naar MEP ]
Alle sauzen          1x   [ ✓ Aanwezig ] [ + Naar MEP ]
Zalm                 2x   [ ✓ Aanwezig ] [ + Naar MEP ]
...
```

- **✓ Aanwezig**: item wordt groen, klaar.
- **+ Naar MEP**: item wordt oranje én er staat direct een MEP-taak klaar (bijv. "Gesneden bloemkool", handeling *Aanvullen*, aantal 1x, prio Normaal). De volgende ochtend pakt iemand die taak op zoals elke MEP-taak.
- Statussen zijn realtime zichtbaar op beide iPads; per dag reset de check automatisch (zelfde ritme als de takenlijst, 04:00/05:00).
- Het blok telt mee in het voortgangsgevoel van sluiten: kleine voortgangsbalk in de blokheader.

## Vriezer → ontdooien (voorbereid, items volgen)
Zelfde mechanisme, tweede blok **"Uit de vriezer (ontdooien)"**: item afvinken betekent "uit de vriezer gehaald, in de koelcel gelegd". De bijbehorende MEP-taak krijgt handeling *Ontdooien*; bij afronden van die taak print de bestaande sticker-flow een **"Ontdooid"**-sticker. De lijst met vriezer-items voeg ik toe zodra de foto binnen is — het blok en de logica worden nu al gebouwd.

## Beheer
- De itemlijst (naam, doelaantal zoals 1x/2x, volgorde, actief) is beheerbaar via **Instellingen → MEP/Voorraad-check** (nieuwe tab), zodat het whiteboard nooit meer terugkomt maar de lijst wel aanpasbaar blijft.
- Alleen West: het blok verschijnt niet in Midsland.

## Technisch (ter info)
- Nieuwe tabel `koelcel_check_items` (vestiging, naam, doel_aantal, eenheid, type koelcel/vriezer, volgorde, actief) met RLS + grants zoals andere tabellen; seed met de 11 whiteboard-items: gesneden bloemkool, alle sauzen, kaas (belegen), brioche, kebab, tempeh, kip, visses(?), tom yum(?), 2x zalm, forel. *Onduidelijke regels markeer ik en vraag ik na.*
- Dagelijkse status in `koelcel_checks` (datum, item, status, door wie) — historie blijft bewaard, niets wordt hard verwijderd.
- "Naar MEP" maakt een rij in `mep_taken` via de bestaande flow (handeling + aantal apart, nooit in de titel) en dedupliceert: staat het item vandaag al open op de MEP, dan geen dubbele taak maar een melding.
- Geen nieuwe libraries; hergebruik van MEP-, sticker- en takenlijst-patronen, optimistic updates, 44px tikdoelen.

## Risico's en randgevallen
- **Vergeten in te vullen**: de check reset dagelijks; wat niet is afgevinkt blijft zichtbaar als "niet gecontroleerd" tot sluiten, zodat het niet stilletjes verdwijnt.
- **Dinsdag (West dicht)**: het blok volgt de bestaande sluitlijst-logica voor gesloten dagen.
- **Dubbele MEP-taken**: dedupe op item + openstaande taak voorkomt stapeling.
- **Foutje tikken**: een afgevinkte status is terug te zetten (tik opnieuw); een aangemaakte MEP-taak blijft dan staan maar is via MEP te verwijderen.

## Verificatie
- Bouw + typecheck groen.
- Test met West-account: blok zichtbaar in sluitfase, ✓ en "Naar MEP" werken, MEP-taak verschijnt met juiste handeling/aantal, dedupe werkt, status syncs naar tweede scherm, volgende dag is de check weer leeg.
- Midsland ziet niets nieuws.
