

# Ideeënbus e-mail activeren

## Huidige status

Alles is al gebouwd en gekoppeld:
- **IdeaBox.tsx** stuurt al e-mails naar josefien@, jorian@ en yorick@puravidafoodbar.nl
- **Email template** (`idea-box-notification.tsx`) bestaat met Pura Vida branding
- **Registry** heeft de template geregistreerd
- **Edge functions** (`send-transactional-email`, `process-email-queue`, etc.) bestaan

## Wat er nog moet gebeuren

Nu het e-maildomein is ingesteld, hoeven alleen de edge functions opnieuw gedeployed te worden zodat ze actief draaien met de juiste configuratie:

1. **Deploy alle e-mail edge functions**: `send-transactional-email`, `process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression`, `preview-transactional-email`
2. **Verificatie**: Een test-idee insturen om te bevestigen dat de e-mails aankomen

Geen code-wijzigingen nodig — alleen deployment.

