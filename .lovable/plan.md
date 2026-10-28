# Bestellijst in dezelfde stijl als MEP

Doel: de bestellijst voelt als MEP en Recepten — rustige kop, één compacte invoerregel, lijst direct zichtbaar. Werking blijft gelijk (aantal, verpakking, dubbelcheck, ongedaan maken, archiveren).

## Wat verandert
1. **Kop zoals MEP**: links "Bestellijst" met eronder "West · 4 nog bestellen · 2 besteld". Geen losse uitlegzin meer. Zelfde breedte als MEP (geen smalle kolom).
2. **Eén compacte invoerregel** (zoals "Taak toevoegen" bij MEP), zonder grote kaart:
   `[Wat is op?] [− 1 +] [stuks ▾] [Erbij]`
   - Verpakking als één knop met keuzelijstje i.p.v. 8 grote knoppen naast elkaar.
   - Op telefoon breekt de regel netjes in twee.
   - Eerdere producten verschijnen pas als je typt, als kleine suggesties onder het veld.
3. **Lijst zoals MEP-taken**: rond afvinkrondje links (afvinken = besteld), naam + vet "2 doos", datum/"Sluitlijst" klein eronder, kruisje rechts (toch niet nodig). Geen grote groene "Besteld"-knop per regel meer.
4. **Besteld**: ingeklapt blok onderaan "Besteld (12)", doorgestreept zoals afgevinkte MEP-taken; terugvinken zet hem weer open.
5. Tikdoelen blijven minimaal 44px; bewerken via tik op de regel blijft.

## Praktijk
- Sneller: product typen, Enter, klaar; lijst staat direct bovenaan in beeld.
- Risico: afvinken in plaats van knop kan per ongeluk gebeuren — daarom blijft "Ongedaan maken" in de melding.
- Geen wijziging aan gegevens of koppelingen; alleen het scherm.

## Technisch
- Alleen `src/pages/kitchen/Bestelbord.tsx`; hergebruik bestaande Button/Input/Select/Collapsible en de rijstijl uit `MepDag.tsx`.
- Hook `useBestelbord.ts` ongewijzigd.
