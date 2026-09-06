# Knop "Nieuwe wisselkassa aanvragen" bij Kascontrole

## Doel
Bij Kascontrole een knop die met één druk een vast sjabloonbericht verstuurt dat er een nieuwe wisselkassa moet komen — automatisch, zonder dat de medewerker iets hoeft te typen.

## Belangrijke technische realiteit
Automatisch posten in een WhatsApp-**groep** kan niet: de officiële WhatsApp Business API (Meta Cloud API) ondersteunt geen groepen. Alleen berichten aan individuele nummers zijn mogelijk. Daarom:

- Het bericht gaat automatisch naar **Helga's eigen WhatsApp-nummer** via de Meta Cloud API.
- Zij kan het zo doorsturen naar de groep. Volledig automatisch groepsberichten bestaan niet in WhatsApp.

## Wat we bouwen

1. **Knop in Kascontrole** (`src/pages/KasControle.tsx`)
   - Grote knop "Nieuwe wisselkassa aanvragen" (44px+ tikdoel) in de kop van het scherm.
   - Popup met: vestiging (vooraf ingevuld op actieve vestiging), eventueel korte toelichting (optioneel), knop "Aanvraag versturen".
   - Na verzenden: duidelijke bevestiging "Aanvraag verstuurd naar Helga". Bij mislukken: foutmelding met retry.

2. **Edge function `wisselkassa-aanvraag`**
   - Valideert input (vestiging, optionele toelichting).
   - Verstuurt sjabloonbericht via Meta WhatsApp Cloud API naar Helga's nummer:
     "Wisselkassa-aanvraag — [Vestiging], [datum/tijd]. Er moet een nieuwe wisselkassa komen. Aangevraagd door [naam]. [toelichting]"
   - Logt elke aanvraag (vestiging, aanvrager, tijdstip, status) zodat je kunt terugzien wat er is aangevraagd.

3. **Eenmalige Meta-setup (door eigenaar, wij begeleiden)**
   - Meta Business-account + WhatsApp Business-app aanmaken (developers.facebook.com).
   - Telefoonnummer koppelen (kan een los/sim-only nummer zijn, niet het bestaande winkelnummer).
   - Berichtsjabloon indienen bij Meta (goedkeuring duurt meestal < 24 uur).
   - Secrets toevoegen: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, Helga's nummer.

## Praktijk-check
- **Wie/wanneer:** degene die kascontrole doet en merkt dat het wisselgeld op is; één tik, klaar.
- **Als niemand het gebruikt:** geen risico; knop staat er alleen.
- **Kosten:** Meta rekent per gesprek; bij dit volume (enkele aanvragen per maand) gratis.
- **Risico:** Meta-setup is het enige struikelblok; tot die klaar is kan de knop nog niet echt versturen. Alternatief als Meta te zwaar is: Telegram-groepsbot (wél volledig automatisch groepsberichten, gratis) of e-mail.

## Verificatie
- Knop zichtbaar in Kascontrole voor beide vestigingen.
- Testbericht daadwerkelijk ontvangen op Helga's nummer.
- Aanvraag gelogd en terug te zien.
- Build groen.
