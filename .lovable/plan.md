## Doel
Voorkomen dat het beeld verspringt bij het wisselen tussen Locatie en Persoonlijk. In plaats van tabs + aparte locatiekiezer wordt het één rij van 3 gelijke icoonknoppen bovenaan het formulier.

## Wijzigingen (`src/pages/Auth.tsx`)

1. **State vereenvoudigen** — vervang `mode` + `location` door één `selection`-state met drie waardes:
   - `'daily'` → West (gedeelde locatie-login)
   - `'foodbar'` → Midsland (gedeelde locatie-login)
   - `'personal'` → persoonlijke login (toont e-mailveld)

2. **Kiezer** — vervang het huidige 2-koloms tab-blok én het 2-koloms locatieblok door één `grid-cols-3` met drie identieke icoonknoppen (zelfde stijl als de huidige locatietegels: icoon boven, label eronder, groene border+achtergrond bij actief):
   - Daily → `Building2`
   - Foodbar → `Store`
   - Persoonlijk → `UserRound`

3. **Formulier stabiel houden** — het e-mailveld verschijnt alléén als "Persoonlijk" gekozen is, direct boven het wachtwoordveld. De rest van het formulier (wachtwoord, inlogknop, hint-tekst) blijft altijd op dezelfde plek, dus geen sprong meer bij wisselen tussen Daily/Foodbar. De extra hoogte bij Persoonlijk (één inputveld erbij) blijft — dat is onvermijdelijk, maar de kop en kiezer bewegen niet meer.

4. **Login-logica** — `handleLogin` blijft functioneel gelijk:
   - `daily`/`foodbar` → mapt naar West/Midsland en gebruikt de bestaande shared e-mails en locatie-check tegen `user_roles`.
   - `personal` → gebruikt `personalEmail` zoals nu.

5. **Hint-tekst** onderaan past zich aan: bij Daily/Foodbar "Gebruik Persoonlijk voor je eigen medewerkeraccount.", bij Persoonlijk "Log in met je eigen e-mailadres en wachtwoord."

## Buiten scope
- Geen wijzigingen aan auth-flow, rollen, redirects of styling elders.
- Geen nieuwe icons/assets; alleen bestaande lucide-icons.