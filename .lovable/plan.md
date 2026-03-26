

# Ideeënbus met e-mail op het Dashboard

## Wat wordt er gebouwd

Een simpele, anonieme "Ideeënbus" widget op het dashboard waar teamleden een idee kunnen typen en versturen. Het idee wordt per e-mail verstuurd naar het MT-team (josefien@puravidafoodbar.nl, jorian@puravidafoodbar.nl, yorick@puravidafoodbar.nl).

## Aanpak

Omdat er nog geen e-mail infrastructuur is opgezet in dit project, moet die eerst worden aangemaakt. Daarna wordt een edge function gebruikt om de e-mails te versturen.

### Stap 1: E-mail domein en infrastructuur

- E-mail domein instellen (puravidafoodbar.nl) via het setup-dialoog
- E-mail infrastructuur aanmaken (queue, tabellen, cron job)
- Transactional e-mail scaffold uitvoeren

### Stap 2: E-mail template

- Template: "idea-box" in `_shared/transactional-email-templates/`
- Onderwerp: "Nieuw idee via Ideeënbus"
- Inhoud: het idee-tekst, vestiging, datum/tijd
- Ontvangers: de 3 MT-adressen (hardcoded in template)
- Anoniem: geen naam of gebruikersinfo

### Stap 3: Database tabel

- `idea_box_submissions` tabel met: `id`, `idea_text`, `location`, `created_at`
- RLS: iedereen (authenticated) mag inserten, niemand mag lezen (privacy)
- Dient als audit log

### Stap 4: Dashboard widget

- Compact kaartje onder de KPI-grid, naast of onder de HandoverCard
- Textarea (max 500 tekens) + "Verstuur" knop
- Na versturen: idee opslaan in DB + edge function aanroepen voor e-mail
- Succesmelding: "Bedankt! Je idee is anoniem verstuurd naar het MT."
- Styling past bij het Pura Vida design (cream achtergrond, groene accenten)

## Technisch

| Onderdeel | Detail |
|-----------|--------|
| E-mail setup | `setup_email_infra` + `scaffold_transactional_email` |
| Template | `idea-box.tsx` - React Email component |
| Database | `idea_box_submissions` tabel + RLS |
| Edge function | `send-transactional-email` (bestaand na scaffold) |
| Frontend | `IdeaBox` component in Dashboard.tsx |
| Ontvangers | josefien@, jorian@, yorick@ puravidafoodbar.nl |

