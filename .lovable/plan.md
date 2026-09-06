# Knop "Nieuwe wisselkassa aanvragen" bij Kascontrole — via e-mail

## Doel
Bij Kascontrole een knop die met één druk een vast sjabloonbericht **per e-mail** naar Helga stuurt dat er een nieuwe wisselkassa moet komen. (WhatsApp-groep kan niet automatisch; e-mail gekozen door eigenaar.)

## Wat we bouwen

1. **Knop in Kascontrole** (`src/pages/KasControle.tsx`)
   - Knop "Nieuwe wisselkassa aanvragen" in de kop van het scherm, 44px+ tikdoel.
   - Popup: vestiging vooraf ingevuld op actieve vestiging, optioneel korte toelichting, knop "Aanvraag versturen".
   - Bevestiging na verzenden; foutmelding met retry bij mislukken.

2. **Verzending via bestaand mailsysteem**
   - E-maildomain-status controleren (`notify.puravidafoodbar.nl` wordt al gebruikt voor o.a. de ideeënbus).
   - Nieuwe e-mailsjabloon `wisselkassa-aanvraag` in de bestaande template-structuur:
     Onderwerp: "Wisselkassa-aanvraag — [Vestiging]"
     Inhoud: vestiging, datum/tijd, naam aanvrager, optionele toelichting.
   - Verzenden via de bestaande `send-transactional-email` edge function met idempotency-sleutel.
   - **Nodig van jou:** het e-mailadres van Helga (wordt als instelling/secret opgeslagen, niet hardcoded in de app).

3. **Logging**
   - Elke aanvraag loggen (vestiging, aanvrager, tijdstip) zodat je kunt terugzien wat er is aangevraagd — in lijn met "historie is data".

## Praktijk-check
- **Wie/wanneer:** wie kascontrole doet en merkt dat het wisselgeld op is; één tik, klaar.
- **Risico:** geen — e-mailinfra bestaat al; geen nieuwe externe dienst.
- Helga kan zich eventueel uitschrijven via de verplichte afmeldlink onderaan; vermeld haar dat, anders stopt het stilletjes.

## Verificatie
- Knop zichtbaar in Kascontrole voor beide vestigingen.
- Testmail daadwerkelijk verzonden en in de verzendlog zichtbaar.
- Build groen.
