## Login-scherm polish: Soft Shadow Card

### Doel
De login-pagina (`/`) voorzien van een **Soft Shadow Card**-uitstraling in lijn met enterprise SaaS zoals Notion/Linear: de card "drijft" zacht boven een iets rijkere achtergrond, met een gelaagde, diffuuse schaduw (geen harde randen).

### Wijzigingen
1. **`src/pages/Auth.tsx`**
   - Achtergrondkleur van de pagina iets warmer/donkerder zetten voor contrast (bijv. `#EBEAE6` i.p.v. huidige `#F5F5F4`).
   - De login-card voorzien van een **multi-layered box-shadow** in plaats van de huidige `shadow-sm`:
     - Laag 1: grote, zachte diffuuse schaduw (`0 20px 40px -12px rgba(0,0,0,0.08)`)
     - Laag 2: middelgrote schaduw (`0 8px 16px -8px rgba(0,0,0,0.04)`)
     - Laag 3: fijne ondergrond (`0 1px 2px rgba(0,0,0,0.02)`)
   - Optioneel: border van de card lichter of subtiel highlight (`border-white/50`) voor extra diepte.

2. **`src/index.css` (optioneel)**
   - Alleen indien nodig: een nieuwe utility-token toevoegen voor hergebruik van de schaduw, bijv. `--shadow-login`.

### Scope
- Alleen visuele aanpassingen op de login-pagina.
- Geen functionaliteit, routing, of auth-logica wijzigen.

### Verificatie
- Screenshot van `/` controleren: card drijft zichtbaar boven achtergrond, schaduw is diffuus zonder harde randen.