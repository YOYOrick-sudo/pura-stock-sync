# App weer direct bruikbaar na lange inactiviteit

## Wat er gisteravond gebeurde

In de printwachtrij staat gisteren als laatste een sticker om 21:36 (Nederlandse tijd), netjes geprint. Daarna staat er niets meer: geen mislukte opdracht, geen wachtende opdracht. De printserver in West geeft nu ook gewoon "actief" terug.

Met andere woorden: de printopdracht die je wilde maken is nooit in het systeem aangekomen. De printer was niet het probleem — de app op de iPad was na uren slapen nog niet "wakker" en het tikken op printen liep dood.

Waarom dat kan: als de iPad urenlang slaapt, verloopt de inlogsleutel van de app. Bij het terugkeren wordt die pas vernieuwd nádat het scherm al zichtbaar is. Tik je in die eerste seconden op een knop, dan gaat het verzoek weg met een verlopen sleutel. Er is nu niets dat dat opvangt: geen melding, geen nieuwe poging, en de knop blijft in "bezig" hangen.

## Wat we bouwen

1. **Wakker-worden-routine.** Komt de app terug op de voorgrond na langere inactiviteit, dan herstelt de app eerst in de achtergrond de verbinding: inlogsleutel vernieuwen als die verlopen is of bijna verloopt, live-verbinding opnieuw opbouwen, schermdata verversen.

2. **Zichtbare statusstrip tijdens herstel.** Een smalle balk bovenin: "Verbinding herstellen…". Verdwijnt vanzelf zodra alles rond is (normaal binnen een paar seconden). Lukt het niet binnen 10 seconden, dan komt er een grote knop "Opnieuw proberen" in beeld. Niemand staat dan te tikken op een scherm dat stiekem niets doet.

3. **Acties wachten netjes op herstel, in plaats van te mislukken.** Print- en opslagacties die vlak na het wakker worden gebeuren, wachten kort op het herstel en gaan daarna alsnog door. Mislukt het toch, dan volgt één automatische nieuwe poging en anders een duidelijke melding: "Niet verstuurd — probeer opnieuw". Nooit meer een knop die eindeloos blijft draaien.

4. **Warm blijven tijdens dienst.** Zolang het scherm zichtbaar is, houdt de app zichzelf op de achtergrond fris (lichte controle elke paar minuten). Dat maakt de kans klein dat je overdag ooit in een koude app terechtkomt.

5. **Nieuwe versie ophalen na lange slaap.** Draait de iPad nog op een oude versie van de app terwijl er inmiddels is gepubliceerd, dan haalt de app die bij het wakker worden zelf op. Scheelt het handmatig afsluiten en heropenen van de app op de tablets.

## Wat dit in de praktijk betekent

- iPad urenlang uit, je opent 's avonds de app: je ziet kort "Verbinding herstellen…", daarna werkt printen gewoon.
- Wifi even weg: dezelfde routine draait, dus ook dan geen dode knoppen.
- Lukt herstel echt niet (bijvoorbeeld internet plat), dan zie je dat meteen in plaats van te wachten op niets.

Risico: klein. Er verandert niets aan de database, de printserver of de printflow zelf — alleen aan hoe de app zich gedraagt bij terugkomst en hoe knoppen met fouten omgaan. Het uitloggen-bij-wakker-worden-probleem van eerder vermijden we: de sleutel wordt alleen ververst als hij echt bijna of al verlopen is, nooit geforceerd.

## Technische uitwerking

- Nieuwe `src/lib/appWake.ts`: `wachtOpHerstel()` (promise, gedeeld/gedebounced) die `supabase.auth.getSession()` leest, bij `expires_at` binnen 60s `refreshSession()` uitvoert, `supabase.realtime.connect()` aanroept en resultaat cachet tot de volgende achtergrondronde.
- `useVersHouden` in `src/App.tsx` roept `wachtOpHerstel()` aan bij `visibilitychange`/`online` en pas daarna `queryClient.invalidateQueries({ type: 'active' })`. Bestaande 30s-throttle en `stopAutoRefresh` bij achtergrond blijven.
- Nieuwe `HerstelBalk`-component (in bestaande layout, boven de content) die de herstelstatus uit een kleine context/store toont, met knop "Opnieuw proberen" na `TRAAG_NA_MS = 10_000`.
- `useCreatePrintJob` (en `useCreateStickerPrintJob`, MEP-afronden): `await wachtOpHerstel()` vóór de insert, insert door `withTimeout` (15s), één retry bij netwerk-/401-fout na een geforceerde refresh, altijd `onSettled` zodat de knop vrijkomt.
- Versiecontrole: build-hash in `index.html`/meta uitlezen bij herstel; wijkt die af van de geladen versie, dan `location.reload()` — alleen als er geen openstaande invoer is.
- Geen wijzigingen in database, RLS, edge functions of print-bridge.

## Verificatie

Playwright als eigenaar op West: app laden, tabblad 10 minuten "verborgen" simuleren met verlopen sessie, terugkeren, herstelbalk zien verdwijnen, sticker printen en de nieuwe rij in de printwachtrij bevestigen.
