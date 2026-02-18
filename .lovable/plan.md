

# Fix: Taaknummering corrigeren

## Probleem
De `sort_order` waarden in de database zijn opgeslagen in stappen van 10 (10, 20, 30, 40...) om ruimte te laten voor drag-and-drop herordening. De huidige code doet `sort_order + 1`, wat nummers oplevert als 11, 21, 31, 41... in plaats van 1, 2, 3, 4.

## Oplossing
Gebruik de array-index binnen elke categorie als vast nummer. De taken zijn al gesorteerd op `sort_order`, dus de index geeft automatisch het juiste volgnummer. Omdat taken per categorie worden gegroepeerd en gerenderd, begint de nummering per categorie opnieuw bij 1.

Om het nummer vast te houden bij afvinken: tel de positie op basis van alle taken in de categorie (inclusief voltooide), niet alleen de zichtbare.

## Wijziging

**Bestand: `src/components/foh/FohTasks.tsx` (regel 2225)**

Van:
```
taskNumber={task.sort_order != null ? task.sort_order + 1 : index + 1}
```

Naar:
```
taskNumber={index + 1}
```

Dit werkt correct omdat:
- Taken zijn al gesorteerd op `sort_order` voordat ze worden gerenderd
- De index binnen de categorie geeft het juiste volgnummer (1, 2, 3...)
- Het nummer blijft stabiel zolang de sortering niet verandert

Maar om te voorkomen dat nummers opschuiven bij afvinken, moeten we de index berekenen over ALLE taken in de categorie (niet alleen onvoltooide). Dit betekent dat we de `categoryTasks` variabele moeten aanpassen zodat voltooide taken ook worden meegeteld in de nummering maar visueel als afgevinkt worden getoond (wat al het geval is - de checkbox toggle werkt al inline).

Ik zal de code controleren of `categoryTasks` al alle taken bevat of alleen niet-voltooide. Als het al alle taken bevat, is `index + 1` voldoende.
