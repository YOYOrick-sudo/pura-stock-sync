# Keuken-sluitlijst West: vaste startvolgorde

Alleen West, alleen tab Keuken, fase Sluit. Midsland en de open-lijst blijven ongewijzigd.

## Nieuwe volgorde bovenaan de keuken-sluitlijst

```text
1. Opzetkoeling
   [ ] Bakjes verkleinen
   [ ] Sla en rucola aanvullen in opzetkoeling
2. Au bain-marie
   [ ] Au bain-marie uitzetten
   [ ] Inhoud eruit halen en door de vaat
   [ ] Water + scheutje azijn verversen indien vies
   [ ] Genoeg water, tot onderkant bakjes  (gemarkeerd als belangrijk)
   -> daarna de bestaande sticker-controle per product
3. Voorraadronde (zoals nu)
4. Overige keukentaken (zoals nu)
```

- Opzetkoeling komt als eerste blok, vóór de voorraadronde.
- De vier bain-marie-stappen staan in hetzelfde blok als de stickers, erboven. Het blok staat direct na opzetkoeling.
- Stap "tot onderkant bakjes" krijgt een rustige waarschuwingsmarkering (geen extra tekst).
- Afvinken werkt zoals de overige taken: grote vakjes (44px), doorgestreept als klaar, teller in de kop (bv. 2/6).

## Wat het in de praktijk doet
- Nieuw teamlid ziet direct waar hij begint; geen leidinggevende nodig.
- Vergeet iemand iets, dan blijft de teller open staan; niets wordt geblokkeerd.
- Afvinkstatus wordt per dag bewaard en gaat niet verloren bij wifi-hapering of herladen.

## Technisch
- Opzetkoeling + bain-marie-stappen als vaste stappen in code (zoals de bestaande bain-marie-controle), opgeslagen per vestiging+datum; geen wijziging aan templates of de 04:00-reset.
- `FohTasks.tsx`: volgorde sluit-keuken wordt `[samenTop, opzetkoeling, bainMarie, voorraad, eigen, samenBottom]`.
- `BainMarie.tsx` (`BainMarieSluit`): vier stappen bovenaan, teller telt stappen + stickers samen.
- NL/EN-teksten voor de nieuwe stappen.
- Geen database-wijziging, printflow ongewijzigd.

Vraag: wil je dat de opzetkoeling-stappen later ook in "Templates beheren" aanpasbaar zijn? Dan maak ik ze als gewone taken in plaats van vaste stappen.
