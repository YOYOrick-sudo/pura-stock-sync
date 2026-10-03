# Voorraadronde West — vijf productaanpassingen

## Wat er verandert

1. **Tomatenjam** (werkbank, Midden onder): reserve-aantal van 1 naar **0** — er hoeft geen reserve meer in de onderlade te liggen.
2. **Bananenpannenkoeken** (werkbank): vulnorm van vol naar **half** — een halve bak is prima, pas daarna aanvullen.
3. **Bananencake**: uit de telling halen (werkbank, koelcel én vriezer) omdat het rustig is. Wordt **gearchiveerd, niet verwijderd** — later weer aanzetten kan met één klik via de instellingen of door mij.
4. **Falafel** (werkbank): vulnorm van vol naar **bodem** — pas bij een bodempje aanvullen, bij half niet.
5. **Döner kebab** (werkbank): vulnorm van vol naar **bodem** — bij een bodempje aanvullen, bij half niet.

## Technisch

- Alleen data-aanpassingen in `koelcel_check_items` (geen codewijziging, geen nieuwe migratie nodig — de vulnorm 'bodem' bestaat al):
  - Tomatenjam werkbank (`81262625`): `reserve_doel` 1 → 0
  - Bananenpannenkoeken werkbank (`2feaab8d`): `vulnorm` vol → half
  - Bananencake (`f0e3a9ab` werkbank, `b8661a78` koelcel, `92431f62` vriezer): `actief` → false
  - Falafel werkbank (`9bd1c59a`): `vulnorm` vol → bodem
  - Döner kebab werkbank (`cfea34c1`): `vulnorm` vol → bodem
- Bestaande tellingen en historie blijven ongemoeid.
- Regel in `migratie_logboek` voor de bananencake-archivering (reden: rustig, later weer actief te zetten).

## Verificatie

- Databasecontrole dat alle vijf wijzigingen zijn opgeslagen.
- Live test op telefoonformaat (390px) met het West-testaccount: bananencake verdwenen uit de ronde, tomatenjam zonder reserve-eis, en bij een proeftelling "half" op falafel/döner géén aanvulactie, bij "bodempje" wél.
- Testaccount daarna weer uitschakelen.
