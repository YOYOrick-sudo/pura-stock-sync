# App werkt altijd, ook na uren stilstaan

## Wat er gisteravond gebeurde

In de printwachtrij staat gisteren als laatste een sticker om 21:36 (Nederlandse tijd), netjes geprint. Daarna staat er niets: geen mislukte opdracht, geen wachtende opdracht. De printserver in West geeft nu ook gewoon "actief".

De printopdracht die jij wilde maken is dus nooit aangekomen. De printer was niet het probleem — de app op de iPad was na uren slapen nog niet wakker en je tik liep dood.

Oorzaak: slaapt de iPad urenlang, dan verloopt de inlogsleutel van de app. Die wordt pas vernieuwd nádat het scherm al zichtbaar is. Tik je in die eerste seconden, dan vertrekt het verzoek met een verlopen sleutel. Er is niets dat dat opvangt: geen nieuwe poging, en de knop blijft hangen.

## Uitgangspunt

Geen meldingen, geen "even wachten", geen herstelbalk. Je opent de app en hij werkt. Al het herstel gebeurt onzichtbaar, achter je tik aan.

## Wat we bouwen

1. **Onzichtbaar wakker worden.** Zodra de app terugkomt op de voorgrond, vernieuwt hij direct en stil de inlogsleutel (als die verlopen of bijna verlopen is), bouwt de live-verbinding opnieuw op en haalt de gegevens van het scherm waar je op staat opnieuw op. Je ziet alleen je scherm, zoals je het achterliet.

2. **Elke actie herstelt zichzelf.** Tik je op printen (of opslaan, afvinken) terwijl de app nog aan het bijkomen is, dan wacht die actie intern kort op de verse sleutel en gaat daarna gewoon door. Mislukt hij toch, dan probeert de app het één keer automatisch opnieuw met een nieuwe sleutel. In de praktijk merk je hier niets van behalve dat het werkt.

3. **Warm blijven tijdens dienst.** Zolang het scherm aanstaat, houdt de app zichzelf fris met een lichte controle op de achtergrond. Zo kom je overdag nooit in een koude app.

4. **Nieuwe versie stil ophalen.** Draait de iPad nog op een oude versie terwijl er inmiddels gepubliceerd is, dan laadt de app die zelf bij het wakker worden, zolang er geen invoer openstaat. Scheelt handmatig afsluiten en heropenen op de tablets.

5. **Alleen iets zeggen als het écht niet lukt.** Is er bijvoorbeeld geen internet, dan krijg je één korte melding "Niet verstuurd — probeer opnieuw" in plaats van een knop die eindeloos draait. Geen statusbalken, geen tussenmeldingen.

## Wat dit in de praktijk betekent

- iPad uren uit, je opent 's avonds de app en tikt op printen: de sticker komt eruit, zonder tussenstap.
- Wifi even weg: zelfde routine, dus geen dode knoppen.
- Alleen bij een echte storing zie je één duidelijke melding.

Risico klein: er verandert niets aan de database, de printserver of de printflow. Alleen hoe de app terugkomt uit slaap en hoe acties met fouten omgaan. Het eerdere probleem van uitloggen bij wakker worden vermijden we: de sleutel wordt alleen ververst als hij bijna of al verlopen is, nooit geforceerd.

## Technische uitwerking

- Nieuwe `src/lib/appWake.ts`: `zorgVoorSessie()` — gedeelde, gedebouncede promise die `supabase.auth.getSession()` leest, bij `expires_at` binnen 60s `refreshSession()` doet, `supabase.realtime.connect()` aanroept en het resultaat cachet tot de volgende achtergrondronde. Geen UI, geen state die rendert.
- `useVersHouden` in `src/App.tsx` roept bij `visibilitychange`/`online` eerst `zorgVoorSessie()` aan en daarna `queryClient.invalidateQueries({ type: 'active' })`. Bestaande 30s-throttle en `stopAutoRefresh` bij achtergrond blijven.
- `useCreatePrintJob`, `useCreateStickerPrintJob` en MEP-afronden: `await zorgVoorSessie()` vóór de insert, insert door `withTimeout` (15s), één automatische retry na geforceerde `refreshSession()` bij 401/netwerkfout, `onSettled` zodat de knop altijd vrijkomt. Toast alleen bij definitieve fout.
- Warmhouden: interval van 4 minuten dat alleen loopt bij `visibilityState === 'visible'` en `zorgVoorSessie()` aanroept.
- Versiecontrole: build-hash uit `index.html` ophalen bij wakker worden; wijkt die af, dan `location.reload()` mits er geen openstaande invoer/dialoog is.
- Geen wijzigingen in database, RLS, edge functions of print-bridge.

## Verificatie

Playwright als eigenaar op West: app laden, achtergrond simuleren met een verlopen sessie, terugkeren, direct op printen tikken zonder wachten, en bevestigen dat er een nieuwe rij in de printwachtrij staat en er geen melding in beeld kwam.
