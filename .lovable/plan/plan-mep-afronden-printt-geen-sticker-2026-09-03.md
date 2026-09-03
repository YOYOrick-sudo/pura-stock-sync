# Plan: MEP afronden printt geen sticker

## Categorie
Data-/flowwijziging: afronden schrijft naar `productie_batches` en de stickerflow naar `print_jobs`. Een bug hier raakt de keukenworkflow direct, dus zwaarder dan een pure UI-fix.

## Diagnose
In `MepAfrondDialog.tsx` staat `sticker` default op `true` en `stickerNaam` wordt gezet op `taak.titel`. Na **Klaar** wordt eerst `onAfronden` aangeroepen en daarna — als `sticker && stickerNaam.trim()` — `useCreateStickerPrintJob` aangeroepen. Toch komt er volgens het team geen sticker uit de printer.

Mogelijke oorzaken:
1. De sticker-print mutatie faalt stil (bijvoorbeeld `sticker_producten_bump` RPC of `print_jobs` insert) en wordt opgeslokt door hetzelfde `try/catch` als `onAfronden`, waardoor alleen een generieke "Afronden mislukt" verschijnt.
2. `stickerNaam` is in bepaalde gevallen leeg na openen van de popup.
3. De `print_jobs`-rij wordt wel aangemaakt maar de print-bridge pikt hem niet op.
4. De gebruiker tikt op de groene vink in de taaklijst, maar er is een tweede snel-afrond-pad dat de popup omzeilt.

## Bouwstappen
1. **Reproduceren en loggen**
   - Open MEP op West als owner, maak een testtaak aan en rond af via de popup.
   - Bekijk console logs en netwerkverzoeken op het moment van **Klaar**.
   - Controleer in de database of er een `print_jobs`-rij ontstaat met de juiste `label_omschrijving`.

2. **Oorzaak verhelpen**
   - Als de sticker-mutatie faalt: scheid de foutafhandeling van `onAfronden` en `printSticker` zodat de gebruiker een concrete melding krijgt en de taak alsnog afgerond blijft.
   - Als `stickerNaam` leeg kan zijn: forceren dat de naam altijd de taaktitel gebruikt tenzij bewust gewijzigd, en blokkeren/tonen als er niets staat.
   - Als de popup niet opent of een ander pad de taak direct afrondt: zorgen dat alleen de popup met sticker-opties de afronding doet, of een duidelijke fallback biedt.

3. **UX-verbetering**
   - Toon bij succes expliciet "Sticker naar printer gestuurd" (komt al uit `useCreateStickerPrintJob`, maar alleen als alles slaagt).
   - Als sticker-print faalt maar afronden lukt: toon een aparte waarschuwing zodat de gebruiker weet dat de taak wel klaar is maar de sticker handmatig moet.

4. **Verifiëren**
   - Afronden van een recept-taak + sticker printt.
   - Afronden van een vrije taak + sticker printt.
   - Console bevat geen onverwachte errors.
   - Build slaagt.

## Praktijk en risico
Op de keuken-iPad moet afronden één tik blijven en een sticker moet betrouwbaar volgen. Als de sticker faalt maar de taak als afgerond wordt gemarkeerd, mist het team het etiket op het halffabricaat. De fix scheidt daarom de twee acties foutafhandelingstechnisch, zodat een printfout nooit ongemerkt blijft.
