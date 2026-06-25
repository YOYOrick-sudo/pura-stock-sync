## Plan

1. **Oorzaak aanpakken in plaats van alleen duration aanpassen**
   - De huidige Dialog gebruikt `animate-in` van `tailwindcss-animate`, maar in `src/index.css` staat óók een eigen `.animate-in` met `transform: translateY(...)`.
   - Daardoor vechten animatie-utilities met elkaar en wordt de popup houterig/onnatuurlijk, vooral op de zware kassatellingpagina.

2. **Dialog-animatie vervangen door één gecontroleerde CSS-animatie**
   - Maak voor Dialog en AlertDialog eigen classes zoals `dialog-overlay-smooth` en `dialog-content-smooth`.
   - Geen mix meer van `animate-in`, `fade-in-0`, `zoom-in-*` en globale `.animate-in`.
   - Alleen compositor-vriendelijke animaties gebruiken: `opacity` + `transform` met `translate3d(...) scale(...)`.
   - `prefers-reduced-motion` respecteren.

3. **Admin Toegang-popup lichter maken**
   - `AdminPasswordDialog` blijft geïsoleerd, maar krijgt geen extra inline styles die onnodig opnieuw berekend worden.
   - Focus blijft uitgesteld tot na opening, zodat het toetsenbord/focus niet tegelijk met de animatie layout veroorzaakt.

4. **Kassatelling-render verminderen bij openen van Kas-controle**
   - Nu worden `Kassa` en `KassatellingOverdag` allebei altijd gerenderd, ook al is maar één tab zichtbaar. Dat maakt de pagina zwaar tijdens het openen van de popup.
   - Aanpassen naar: alleen actieve kassatelling-tab renderen; `KasControleContent` pas renderen na correcte code.
   - Dit voorkomt dat een popup-opening tegelijk duizenden inputs/tabellen hoeft te behouden of herberekenen.

5. **Controleren op de juiste plek**
   - Daarna via browsercontrole op `/kassatelling`: klikken op `Kas-controle`, popup openen/sluiten, en controleren dat hij zonder hapering verschijnt.

## Technisch

Aan te passen bestanden:
- `src/index.css`
- `src/components/ui/dialog.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/foh/AdminPasswordDialog.tsx`
- `src/pages/Kassatelling.tsx`

Belangrijk: geen backend- of kassalogica wijzigen; alleen render/animatiegedrag.