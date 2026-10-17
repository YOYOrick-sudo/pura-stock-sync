# Hoe vol het moet zijn: als plaatje, waar het vandaan komt: als tekst

## Idee
De kok ziet in één oogopslag een klein bakje met hoe vol het minstens moet zijn, en leest daarachter wat hij doet als er te weinig is.

```text
Zoetzure gember
[bakje ½ gevuld]   Te weinig: aanvullen uit koelcel

Gesneden paprika
[bakje bodempje]   Te weinig: Naar MEP (snijden)

Mayonaise
[bakje vol]        Te weinig: aanvullen uit koelcel
```

## Wat verandert
1. **Hoe vol het moet zijn wordt een plaatje:** een klein bakje (zijaanzicht, open bovenkant, ronde hoeken) dat vol, half of met een bodempje groen gevuld is. Een dunne streep markeert het minimum. De tekst "Moet vol zijn" / "Minstens half vol" / "Bodempje is genoeg" verdwijnt uit beeld en blijft alleen voor schermlezers en in het info-icoon.
2. **Wat je doet als het te weinig is blijft tekst**, zoals nu: "Aanvullen uit koelcel", "Ontdooien uit vriescel", "Bestellen bij Midsland", "Naar MEP (snijden)", enz.
3. Het info-icoon legt de drie bakjes één keer uit (vol / half / bodempje).
4. Na een actie blijft de uitkomst staan zoals nu ("Op de MEP voor morgen", enz.).

## Wat niet verandert
Knoppen, keten, instellingen en wat er wordt opgeslagen blijven hetzelfde.

## Technisch
- `VulPeil.tsx` vervangen door een bakje-icoon (ca. 18x16px, rand `border-muted-foreground/40`, vulling `bg-primary`, hoogte 100% / 50% / 20%), met `aria-label` uit `aanvulTekst`.
- `AfvinkRonde.tsx`: tekst naast het peil weghalen; bakje + "Te weinig: ..." op één regel. InfoKnop-tekst bijwerken met uitleg van de drie bakjes.
- `sluitronde.ts`: `peilBlokjes` wordt een vulpercentage (100/50/20); test aanpassen.
- Verificatie: tests draaien, screenshots van Sluiten-tab Keuken West op iPad en telefoon.
