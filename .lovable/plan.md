## Onderzoek

Het probleem is een **houterige, niet-vloeiende popup-animatie** die zich voordoet bij **meerdere dialogs** in de app (kas-controle wachtwoord, detail-modal, admin dialogs, etc.). De gebruiker meldt dat de popups "vastlopen" bij het openen, niet soepel in beeld komen.

Oorzaak gevonden in `src/components/ui/dialog.tsx`:
- De `DialogContent` combineert **fade + zoom-95 + slide-from-top-48%** tegelijk met `duration-200`.
- De `slide-from-top-[48%]` in combinatie met `translate-y-[-50%]` (centreer-truc) zorgt voor een onnatuurlijke "sprong" — het element komt van boven en schuift tegelijk naar het midden, wat het hapjerige gevoel geeft.
- Dit is de **centrale shadcn Dialog component**; álle popups in de app erven dit gedrag.

## Aanpassing

Alleen `src/components/ui/dialog.tsx` aanpassen:

1. **Slide-animaties verwijderen** uit `DialogContent` (`slide-in-from-top-[48%]`, `slide-out-to-top-[48%]` etc.). Alleen fade + subtiele zoom behouden.
2. **Zoom subtieler**: `zoom-in-95` → `zoom-in-97` (rustiger schaal van 97% → 100%).
3. **Duration verhogen**: `duration-200` → `duration-300` voor een vloeiendere beweging.
4. **Overlay meeliften**: `DialogOverlay` krijgt ook `duration-300` zodat achtergrond en content synchroon faden.

## Resultaat

- Popup verschijnt met een rustige **fade + lichte zoom vanuit het centrum** (geen sprong meer van bovenaf).
- Werkt automatisch voor **alle dialogs** in de app — geen losse fixes per scherm nodig.
- Geen functionele wijzigingen, alleen visueel/animatie.

## Wijzigingen

- `src/components/ui/dialog.tsx` — CSS classes op `DialogOverlay` en `DialogContent` aanpassen.

## Verificatie

- Kas-controle wachtwoord-popup opent vloeiend.
- Detail-modal in kas-controle opent vloeiend.
- Overige dialogs (admin, templates, etc.) blijven werken en zien er rustiger uit.