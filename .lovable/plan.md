## Doel
De takenlijst voelt visueel iets intuitiever aan. Afgestudeerde taken worden subtieler weergegeven (minder groen/afleidend) en de lijst krijgt een lichte hiërarchie-boost.

## Wijzigingen (West als voorbeeld, Midsland blijft onaangeroerd qua structuur)

### 1. Afgestudeerde taken — subtiel & neutraal
- **Achtergrond**: Groene tint (`--primary / 0.04`) vervangen door neutrale grijze tint (`--muted / 0.5` of `--border / 0.3`) zodat het niet meer opvalt als een "kleurstatus".
- **Checkbox**: Groene vulling vervangen door subtiele grijze vulling (`--muted-foreground / 0.2`) met een grijs check-icoon, of een simpel leeg kader met grijze check.
- **Tekst**: Lichtere opacity (0.45 i.p.v. 0.7) zodat voltooide taken echt naar de achtergrond zakken. Line-through blijft.
- **Hover**: Geen groene hover-tint meer op afgestudeerde rijen.

### 2. Lijst-hiërarchie verfijnen (West flat-list)
- **Sectie-header "Bediening" / "Keuken"**: Iets meer visueel gewicht — bijv. een dunne linkerbalk (`4px` primary) of een iets donkerder achtergrond (`--card`) zodat de scheiding tussen voorkant/achterkant meteen duidelijk is.
- **Ruimte tussen taken**: Padding/lichte separator blijft, maar de "voltooid"-status is nu visueel een aparte "laag" wat de open taken meer laat spreken.
- **Taaknummering**: Behouden, maar afgestudeerde nummers krijgen dezelfde grijze muted-styling.

### 3. Technisch
- Alleen de styling-properties in `SortableTaskItem` en de periodieke taak-rendering aanpassen.
- Geen gedragswijzigingen: volgorde, drag-and-drop, checkbox-klick, reset-tijden, templates — alles blijft identiek.
- West ziet het resultaat direct; Midsland gebruikt dezelfde component dus ook direct de nieuwe completed-styling.

### Voorbeeld in West
West toont een flat-list met twee secties (Bediening + Keuken). Na de wijziging zien afgestudeerde taken er uit als "uitgegrijze" rijen die visueel duidelijk achter de open taken staan, in plaats van half-groen. De sectie-headers krijgen een subtiele extra accentuering zodat de lijst in 1 oogopslag leesbaar is.