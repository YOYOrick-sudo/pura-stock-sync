# Engelse takenlijst: vertalen op betekenis, niet woord voor woord

## Doel
De Nederlandse taak blijft leidend. Elke Engelse tekst moet zeggen **wat je moet doen en waarom**, zoals een Engelstalige collega het in de horeca zou zeggen. Geen letterlijke woordvertaling.

Voorbeeld: "Sinaasappels halveren" werd "Halve oranges" en moet worden "Cut oranges in half".

## Aanpak
1. **Alles opnieuw nalopen.** Ik haal alle 387 vaste taken en hun omschrijvingen op, met de Nederlandse tekst, het onderdeel (bar, keuken, terras...) en de fase (openen/sluiten). Die context is nodig om de betekenis goed te pakken.
2. **Vertalen met vaste regels:**
   - Begin met een duidelijk werkwoord: Wipe, Refill, Check, Prep, Turn off, Restock.
   - Gebruik gewone horecataal: "aanvullen" → restock/top up, "afnemen" → wipe down, "MEP" → prep, "vitrine" → display counter, "bain-marie" blijft bain-marie.
   - Pura Vida-namen en productnamen (Daily, Foodbar, gerechten) vertaal ik niet.
   - Kort en duidelijk, net als de Nederlandse tekst. Niets toevoegen wat er niet staat.
3. **Twijfelgevallen markeren.** Als de Nederlandse tekst dubbelzinnig is, zet ik de taak op een korte lijst die ik je laat zien. Ik ga niet gokken.
4. **Ik controleer zelf.** Ik lees alle uitkomsten na op letterlijke fouten (zoals "Halve oranges") en verbeter die voordat iets wordt opgeslagen.
5. **Opslaan en bijwerken.** De verbeterde teksten komen bij de vaste taken en bij de takenlijst van vandaag, zodat je het meteen ziet.
6. **Testen.** Ik zet de lijst op EN in West en in Midsland, bij Openen en Sluiten, en controleer een steekproef van 30 taken naast het Nederlands.

## Wat er niet verandert
- De Nederlandse teksten, de volgorde, de nummering en het afvinken blijven zoals ze zijn.
- De NL/EN-knop werkt hetzelfde.
- Nieuwe taken zonder Engelse tekst tonen gewoon de Nederlandse tekst.

## Risico
- **Verkeerd begrepen taak:** als een Engelstalige collega een taak verkeerd begrijpt, blijft er iets liggen. Daarom leg ik de twijfelgevallen aan jou voor.
- **Later aangepaste taken:** pas je later een Nederlandse taak aan, dan past de Engelse tekst zich niet vanzelf aan. Dat blijft zo tot je de Engelse tekst zelf aanpast in Templates Beheren.

## Technisch
- Alleen inhoud wordt bijgewerkt: title_en/description_en in foh_daily_templates en de open foh_tasks van vandaag. Er komen geen nieuwe velden, en rechten en RLS veranderen niet.
- Vertalen gaat in batches via de AI-gateway, met een prompt op betekenis en een woordenlijst. Elke batch krijgt de categorie en fase mee. Elk antwoord koppel ik terug via de echte id, niet via de volgorde in de batch.
