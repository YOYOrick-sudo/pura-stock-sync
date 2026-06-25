Ik heb de echte oorzaak gevonden: de dialog staat op `left: 50%` / `top: 50%`, maar de vaste `translate(-50%, -50%)` ontbreekt in de normale CSS-state. Die translate zit nu alleen tijdelijk in de keyframe-animatie. Zodra de animatie klaar is, valt `transform` weg en maakt de popup een zichtbare sprong. Dat verklaart waarom het ondanks eerdere animatie-aanpassingen nog steeds “spact”.

Plan:
1. **Dialog-positionering structureel fixen**
   - Zet de centrering permanent op `DialogContent` en `AlertDialogContent`.
   - De animatie mag daarna alleen nog opacity/scale animeren, zonder de basispositie kwijt te raken.

2. **Animatie robuust maken**
   - Gebruik één compositor-vriendelijke transform-stack via CSS-variabelen of een permanente `translate3d(-50%, -50%, 0)`.
   - Voeg waar nodig `animation-fill-mode: both` toe, zodat er geen eind-frame jump ontstaat.

3. **AdminPasswordDialog lichter maken bij openen**
   - Laat focus pas ná de open-transition gebeuren, zoals nu bedoeld, maar zonder layout-jump.
   - Behoud de geïsoleerde password-state zodat typen niet de zware kassatelling opnieuw rendert.

4. **Controle op andere popups**
   - Pas dezelfde fix toe op `AlertDialog`, zodat bevestigingspopups niet hetzelfde probleem houden.
   - Laat popovers/tooltips ongemoeid, behalve als ze dezelfde jump veroorzaken.

5. **Verifiëren in de preview**
   - Test specifiek `/kassatelling` → `Kas-controle` → wachtwoordpopup openen/sluiten.
   - Controleer dat de popup niet meer springt na het openen en dat de sluitanimatie normaal blijft.