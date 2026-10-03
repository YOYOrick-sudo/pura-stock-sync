# Reservelade Links onder → Opzetkoeling

## Wat de gebruiker wil
- De lade "Links onder" (nu reservelade, alleen op vrijdag geteld) heet voortaan **Opzetkoeling**.
- De lade is nu **niet in gebruik** als reserve.
- Later moet de lade via de instellingen weer als reservelade aangezet kunnen worden — dat scherm bestaat al (Koelwerkbank indelen: naam, rol en "in gebruik" per lade aanpasbaar).

## Aanpassingen

### 1. Database: lade hernoemen en buiten gebruik
- `voorraad_lades` (West, kolom 1 / rij 3): naam `Links onder` → `Opzetkoeling`, `actief` → `false`.
- Items die aan deze lade hangen blijven ongemoeid (niets verwijderen); ze verdwijnen uit de ronde zolang de lade niet actief is.

### 2. VoorraadRonde: vrijdag-ritme niet meer op naam herkennen
- Nu: `lades.find(l => l.naam === 'links onder')` — breekt na hernoemen.
- Nieuw: herken de reservelade op **positie + rol** (`kolom = 1, rij = 3, rol = 'reserve'`) in plaats van op naam.
- Gevolg: zodra iemand in de instellingen de lade weer actief zet met rol "reservelade", werkt het vrijdag-ritme automatisch weer — zonder codewijziging.

### 3. Zichtbaarheid in de ronde
- Inactieve lades tonen nu al ingeklapt als "Niet in gebruik" in het indelingsscherm en verdwijnen uit de telronde; dat gedrag blijft.

## Testen
- Telefoonformaat (390px): voorraadronde opent zonder de lade Opzetkoeling; vrijdag-ritme nergens meer actief.
- Instellingen → Koelwerkbank indelen: lade heet Opzetkoeling, staat op "Niet in gebruik"; terugzetten op "in gebruik" + rol reservelade toont hem weer in de ronde (met vrijdag-ritme).
- Build foutloos; testaccount daarna weer inactief.

## Technische details
- DB: `UPDATE voorraad_lades SET naam='Opzetkoeling', actief=false WHERE id='a2dd6a2b-5ae6-4c98-8b4d-f348f18fc5bc'` + migratie_logboek-regel.
- Code: `src/components/foh/VoorraadRonde.tsx` (~regel 858-861): naam-match vervangen door positie/rol-match; tekst "elke vrijdag" blijft.
