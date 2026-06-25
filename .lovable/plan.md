Ik heb gericht gekeken naar de popups in `/kassatelling` en `kas-controle`. De vorige wijziging zat alleen in de normale `Dialog`, maar de kassatelling gebruikt óók `AlertDialog` voor verzenden/succes. Die heeft nog steeds een slide-from-top animatie + backdrop blur, wat juist het houterige effect kan geven. Daarnaast rendert de zware kassatelling-pagina opnieuw op hetzelfde moment dat de wachtwoord-popup opent.

Plan:

1. **Alle popup-animaties gelijk trekken**
   - `Dialog` en `AlertDialog` dezelfde rustige animatie geven: fade + subtiele scale vanuit het midden.
   - De slide-in/slide-out beweging uit `AlertDialog` verwijderen.
   - `backdrop-blur` uit `AlertDialog` halen, omdat dat op tablets/iPads vaak zichtbaar hapert.
   - `transform-gpu` / `will-change-transform` toevoegen zodat de browser de animatie soepeler uitvoert.

2. **Kas-controle wachtwoord-popup ontlasten**
   - De zware tab-content in `Kassatelling.tsx` memoizen/scheiden, zodat het openen van de wachtwoord-popup niet tegelijk de hele kassatelling opnieuw rendert.
   - De callbacks voor de wachtwoord-popup stabiel maken met `useCallback`, zodat `AdminPasswordDialog` echt geïsoleerd blijft.

3. **Focus soepeler maken bij wachtwoord-popup**
   - De input niet direct in dezelfde render-frame hard focussen, maar pas net na mount/animatiestart.
   - Dit voorkomt dat focus/layout werk de opening zichtbaar blokkeert.

4. **Console-waarschuwing oplossen**
   - De Radix-waarschuwing `Missing Description` netjes oplossen met een verborgen beschrijving bij de admin-popup.
   - Dit is niet de hoofdreden van de hapering, maar het voorkomt extra warnings bij openen.

5. **Verifiëren**
   - In de preview testen op `/kassatelling`:
     - Kas-controle wachtwoord-popup openen/sluiten.
     - Succes-popup van kassatelling controleren.
     - Detail-popup in Kas-controle openen.
   - Controleren dat de popups niet meer vanaf boven schuiven en geen console-warning meer geven.