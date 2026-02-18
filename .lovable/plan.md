

# Dagelijkse tussenlijst-taak toevoegen

## Nieuwe taak

**"Amuse checken evt aanpassen en communiceren met team"**

- Phase: `tussen`
- Category: `Binnen` (past bij de service-coordinatie taken zoals Zenchef check)
- Location: `Midsland`
- Priority: `2`
- Repeat type: `daily`
- Sort order: `29` (na "Check de notities van elke reservering in Zenchef" op 28, voor "Check & organiseer reserveringen" op 29 -- bestaande 29 schuift effectief een positie)

Dit plaatst de taak in het midden van de "Binnen" sectie, bij de andere coordinatie-taken -- niet bovenaan, maar wel zichtbaar.

## Technisch

Eén INSERT in `foh_daily_templates`. Geen code-aanpassingen nodig -- het bestaande systeem genereert de taak automatisch.

De "Rode wijn vacuüm trekken" taak van het vorige plan wordt ook meegenomen als dat nog niet is uitgevoerd.

