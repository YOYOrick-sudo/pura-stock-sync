# Voorraadronde: MEP-aanduiding subtieler en rechts in de rij

## Wat er nu is
In de voorraadronde staat bij elk product waarvoor vandaag al een MEP-taak bestaat een amber chipje "wordt gemaakt (MEP)" onder de productnaam, in dezelfde rij als "onderweg" en "op het bestelbord". Alle drie zijn ze amber en opvallend; de MEP-aanduiding is geen waarschuwing maar een mededeling en oogt daardoor vaag en te luid.

## Wijziging (alleen src/components/foh/VoorraadRonde.tsx)

1. **Tekst en kleur** — de MEP-aanduiding wordt een rustig chipje met de tekst `op de MEP`, in zachte groene stijl (`bg-primary/10`, tekst `text-primary`, 11px, afgerond) — informatie, geen waarschuwing.
2. **Plek** — het chipje verhuist van onder de productnaam naar **rechts in de kopregel van de productrij**, uitgelijnd zoals het bestaande "bijvullen"-chipje in de vulnorm-kaarten (dus op dezelfde hoogte als de productnaam, aan de rechterkant).
3. **"onderweg" en "op het bestelbord" blijven staan** zoals ze zijn: die zijn wél acties/aandacht nodig en horen amber onder de naam. Alleen de MEP-aanduiding wordt subtieler.

### Waar het chipje komt (drie weergaven in TelRegel)
- **Gewone telregel** (reserve / hele bakken): klein chipje rechts in de kopregel, tussen de productnaam en de ronde +/- knop.
- **Vulnorm-kaart** (vol/half/bodempje/leeg): rechts in de kopregel, naast het eventuele "bijvullen"-chipje.
- **"Onderweg"-kaart** (besteld, nog niet binnen): rechts in de kopregel, vóór het truck-icoontje.

## Geen wijziging aan
- MEP-logica, tellingen, bestelbord, bonnen: niets aan gedrag, alleen weergave.
- Geen database- of migratiewerk.

## Testen
- Typecheck en build.
- Visueel nagaan in de preview (voorraadronde, Keuken): met een bestaande MEP-taak van vandaag het chipje "op de MEP" rechts in de rij checken op alle drie de weergaven; testdata daarna weer opruimen.
