## Plan: Wisselkassa aanvragen knop (Midsland)

Volledig automatisch via **Twilio SMS** — geen WhatsApp Business approval nodig, werkt direct, ~€0,07 per bericht (≈ €3-4 per jaar bij wekelijks gebruik).

### Wat gaat er gebeuren

1. **Twilio koppelen** via de connector — je krijgt een prompt om een Twilio account aan te maken of bestaande te koppelen (gratis trial geeft je een nummer + credits)
2. **Secret toevoegen**: `TWILIO_FROM_NUMBER` (jouw Twilio nummer, bv. `+316XXXXXXXX`)
3. **Database tabel** `wisselkassa_requests` om aanvragen te loggen (locatie, aanvrager, tijdstip, status, Twilio message SID)
4. **Edge function** `request-wisselkassa`:
   - Valideert ingelogde gebruiker
   - Check: alleen Midsland-users mogen aanvragen
   - Rate limit: max 1 aanvraag per 4 uur per locatie
   - Stuurt SMS via Twilio gateway naar `+31620608796`
   - Logt resultaat in database
5. **UI knop** in Kassatelling pagina (alleen zichtbaar voor Midsland):
   - "Nieuwe wisselkassa aanvragen" knop
   - Bevestigings-dialog: "Weet je zeker dat je een nieuwe wisselkassa wilt aanvragen bij Helga?"
   - Loading state + toast feedback ("Aanvraag verstuurd ✓" of foutmelding)

### SMS bericht naar Helga
> Graag een nieuwe wisselkassa voor Pura Midsland. Aangevraagd door: {naam}. Datum: {datum + tijd}

### Wat jij moet doen
- **Stap 1**: Bij het koppelen van Twilio → account aanmaken op twilio.com (gratis, ~€15 trial credit), Nederlands nummer kopen (~€1/maand) of trial nummer gebruiken
- **Stap 2**: Twilio nummer invullen als secret wanneer ik erom vraag

### Volgorde van uitvoering
1. Twilio connector koppelen (jouw actie)
2. `TWILIO_FROM_NUMBER` secret toevoegen (jouw actie)
3. Database migratie
4. Edge function bouwen
5. UI knop in Kassatelling
6. Test versturen

Klaar om te starten? Dan trigger ik als eerste de Twilio connector koppeling.