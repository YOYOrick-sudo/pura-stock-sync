# Zak-datum bij au bain-marie: echte datum kiezen

## Probleem

Bij "Vandaag (nieuw)" vraagt de app nu de datum van de ontdooi-sticker via zeven dagknoppen (vandaag t/m 6 dagen terug). Een zak ligt vaak langer in de koelcel, dus de juiste datum staat er simpelweg niet tussen.

## Wat er komt

De vraag "Datum op de zak?" krijgt een echte datumkeuze, in twee stappen die allebei snel zijn:

1. **Snelknoppen** voor de meest voorkomende gevallen: Vandaag, Gisteren, Eergisteren.
2. **Knop "Andere datum"** opent een maandkalender (maandag eerst, Nederlandse dag- en maandnamen). Je tikt één dag aan en de vraag sluit meteen.

Regels in de kalender:
- Toekomstige dagen zijn niet aan te tikken — een zak kan niet uit de toekomst komen.
- Verder terug bladeren mag onbeperkt; standaard opent hij op deze maand.
- De gekozen datum is de enige gevulde knop; er staat vooraf niets geselecteerd.

Na het kiezen staat de datum gewoon mee in de registratie en op de sticker ("Zak ontdooid: di 02/09"), precies zoals nu.

Alles blijft geschikt voor de iPad: tikdoelen van minimaal 44px, geen hover-afhankelijkheid, één tik per keuze.

## Technisch

- `BainMarie.tsx`: in het zak-blok de zeven dagknoppen vervangen door drie snelknoppen plus een `Popover` met de bestaande `Calendar` (`mode="single"`, `locale` nl, `weekStartsOn` maandag, `disabled` op datums na vandaag, `className="p-3 pointer-events-auto"`). Gekozen datum gaat als ISO-string naar de bestaande `startNieuw(p, iso)`.
- Geen nieuwe libraries: `Calendar`, `Popover` en `date-fns` zitten al in het project.
- Geen database- of RLS-wijziging; `ontdooid_datum` bestaat al.
- Testen in de preview: kip → "Vandaag" → snelknop en kalenderkeuze (ook een datum van weken terug), controleren dat de status klopt en dat de sticker in de sluitlijst de juiste "Zak ontdooid"-regel bevat; testdata daarna opruimen.
