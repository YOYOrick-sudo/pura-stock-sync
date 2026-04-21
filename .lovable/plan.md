

# Fix: Ideeënbus emails worden niet verzonden

## Diagnose
1. **Hoofdoorzaak**: Lovable Emails staat **uitgeschakeld** voor dit project. Alle email-pogingen eindigen in de DLQ met `"Emails disabled for this project"`.
2. **Domein is OK**: `notify.puravidafoodbar.nl` is geverifieerd en klaar voor gebruik.
3. **Recente inzendingen worden niet eens gequeued**: De idee van 4 april staat in `idea_box_submissions` maar heeft géén bijbehorende rij in `email_send_log`. De laatste log-entries zijn van 28 maart (toen de feature voor het laatst werkte). Dit suggereert dat de `supabase.functions.invoke('send-transactional-email')` aanroep silent faalt (waarschijnlijk 403 emails_disabled) en de error wordt niet aan de gebruiker getoond.

## Oplossing — 2 stappen

### Stap 1: Lovable Emails weer aanzetten
Het project heeft een verified email domein, maar de email-functionaliteit staat uit. Ik schakel deze opnieuw in zodat:
- De `send-transactional-email` edge function emails accepteert i.p.v. 403 te gooien
- Auth emails (login, password reset) blijven ook gewoon werken
- Bestaande transactionele templates (zoals `idea-box-notification`) direct werken

### Stap 2: Foutafhandeling verbeteren in `IdeaBox.tsx`
Het huidige `handleSubmit` in `src/components/dashboard/IdeaBox.tsx` toont `toast.success` ook als de email-invocaties falen, omdat de errors in `Promise.all` niet worden gecontroleerd op het response-veld (`error` van `functions.invoke`). Ik pas dit aan zodat:
- We per `invoke()` ook `response.error` checken (niet alleen exceptions)
- Bij gedeeltelijke fouten een waarschuwende toast tonen i.p.v. valse success
- Errors gelogd worden naar de console voor debugging

### Verificatie na de fix
Na het inschakelen test ik door:
- Een test-idee in te sturen en te checken of er 3 nieuwe rijen in `email_send_log` komen met status `pending` → `sent`
- Eventueel een rij in DLQ wijst op een ander probleem (dan kijken we naar specifieke error)

## Omvang
- 1 toggle (Lovable Emails inschakelen — geen code)
- 1 bestand aangepast (`IdeaBox.tsx` — betere error handling, ~10 regels)
- Geen database wijzigingen, geen template wijzigingen
- Geen impact op andere modules

