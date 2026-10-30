# Meedenken: mist / backorder bij eindcheck (geen bouw)

Eens met het voorstel: "mist" als standaard, "backorder" alleen met bewijs. Dat houdt het bord eerlijk.

**1. Tonen (eenvoudigst)**
- Eindcheck per leverancier in Onderweg: alleen regels met restant, compacte rij: naam · restant-chip ("2 doos") · tweeknopsschakelaar `Mist | Nageleverd` (Mist vooraf gekozen, als enige uitzondering op "niet vooraf kleuren", want het is de regel).
- Kies je Nageleverd: rij klapt in de DetailLade open met 3 bronknoppen (Pakbon / Mail / Bevestiging), notitieveld verplicht, datum optioneel.
- Eén hoofdknop onderaan: "Levering afronden (3)". Kooyman-regels tonen een klein "automatisch"-icoon, zonder keuze.

**2. Valkuilen in de huidige frontend**
- `deelsGeleverd` (useBestelbord) zet het restant nu al direct als nieuwe open regel (`bron: 'restant'`, `restant_van`) terug op het bord. Naast de nieuwe RPC ontstaat zo dubbel restant: één keer via de oude flow, één keer via de eindcheck. Achter de vlag moet de oude "deels"-knop uit, of de RPC moet bestaande restant-regels herkennen.
- "Mist" betekent: opnieuw bestellen nodig, dus komt terug op het bord. "Backorder" betekent: niet opnieuw bestellen, maar wel in Onderweg laten staan. Anders bestelt iemand het opnieuw bij een andere leverancier (dubbele order).
- `levering_status` kent nu alleen `geleverd | niet_geleverd | deels`; het type en de filters (Geleverd-kaart, de stip "te checken", `onderwegVoorItem`) moeten de nieuwe staten meenemen, anders verdwijnen backorders uit beeld of tellen ze dubbel in onderweg-voorraad.
- `terugNaarBesteld` draait nu alleen de eigen regel terug, niet een restant-regel. Na de eindcheck kan dat wezen achterlaten.
- Backorder zonder datum blijft eeuwig staan: na X dagen terugzetten als "mist" en/of melding.

**3. Schatting frontend**
Ongeveer 10–14 uur: eindcheck-scherm en rijen 4–5 u, lade met bron/notitie 2 u, vlag en uitschakelen van de oude deels-flow 2 u, aanpassen van types/filters/onderweg-telling 2–3 u, tests 1–2 u.

Niets gewijzigd of gepubliceerd.
