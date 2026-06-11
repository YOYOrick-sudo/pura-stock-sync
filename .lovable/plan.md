## Probleem
Bij klik op **Admin** voelt het login-scherm traag/janky. Oorzaak: de Dialog en de password-input zitten in `FohTasks.tsx` (3300+ regels). Elke statewijziging (`setPasswordDialogOpen`, `setPasswordInput` per toets) triggert een re-render van de hele takenlijst-tree (taken, realtime, queries, dnd-kit). Dat blokkeert de Dialog-open-animatie van Radix.

## Oplossing
Extract de password-dialog naar een eigen klein component **`AdminPasswordDialog.tsx`** met:
- Lokale `useState` voor het wachtwoord (geen parent re-renders per toets).
- Props: `open`, `onOpenChange`, `onSuccess`.
- `React.memo` zodat re-renders van parent het niet raken.
- `autoFocus` op input + reset password bij sluiten.

In `FohTasks.tsx`:
- Vervang het inline `<Dialog>` blok (regels ~2848–2916) door `<AdminPasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} onSuccess={() => { setAdminPanelOpen(true); toast.success('Admin panel geopend'); }} />`.
- Verwijder `passwordInput` state uit FohTasks (niet meer nodig).

## Resultaat
- Opening triggert nog maar 1 lichte re-render (state in parent voor `passwordDialogOpen`); de input-typing render-cyclus zit nu volledig binnen het kleine dialog-component.
- Radix open-animatie kan zonder concurrentie met de zware takenlijst-render lopen → vloeiend.
- Geen functionele wijziging: zelfde wachtwoord (`0000`), zelfde toasts, zelfde gedrag.

## Scope
- Nieuw bestand: `src/components/foh/AdminPasswordDialog.tsx` (~70 regels).
- Edit `src/components/foh/FohTasks.tsx`: import toevoegen, dialog-blok vervangen, `passwordInput` state verwijderen.

## Verificatie
- Klik Admin → dialog opent direct met focus in input.
- Typen voelt soepel.
- Enter of "Bevestigen" met `0000` → admin panel open + toast.
- Foute code → error toast, dialog blijft open.
- Annuleren of escape → dialog dicht, input gereset.