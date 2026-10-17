# Twee opties voor "hoe vol moet de bak minstens zijn"

Kies er één. De rest (knoppen, keten, opslag) blijft hetzelfde.

## Optie A: Drie bakjes naast elkaar, het juiste is gekleurd
```text
Zoetzure gember
[ ▢  ◧  ■ ]  Minstens half      Te weinig: aanvullen uit koelcel
   bodem half vol
```
- Altijd dezelfde drie kleine bakjes (bodem, half, vol) op een rij.
- Alleen het minimum is groen gevuld; de andere twee zijn lichtgrijs omlijnd.
- Je ziet direct de schaal én waar dit product op zit, zonder streep te hoeven lezen.
- Past bij de regel "alleen de gekozen optie is gevuld".

## Optie B: Liggende meter met markering, als een brandstofmeter
```text
Zoetzure gember
[■■■■■■|░░░░░░]  Min. ½         Te weinig: aanvullen uit koelcel
 leeg        vol
```
- Eén brede, platte balk (ca. 64x10px) van leeg naar vol.
- Groen tot het minimum, daarna grijs, met een dikke streep op het minimum.
- Leest als een tankmeter: "minstens tot hier". Neemt weinig hoogte in, rustig in lange lijsten.

## Advies
Optie A: de kok ziet de drie standen altijd naast elkaar, dus geen twijfel of half groen "half" of "bijna leeg" is.

## Technisch
- Alleen `VulPeil.tsx` en de regel in `AfvinkRonde.tsx` aanpassen; tokens `bg-primary`, `border-muted-foreground/40`.
- `peilKort` blijft; tests ongewijzigd draaien.
- Screenshots Sluiten → Keuken West op iPad en telefoon.
