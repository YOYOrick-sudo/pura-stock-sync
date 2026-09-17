# Terugkijken: overzicht van dagbeoordelingen

## Wat er al is
De antwoorden (rustig / gemiddeld / druk voor ontbijt, lunch, diner) worden al opgeslagen per dag en vestiging. Ze zijn nu alleen zichtbaar als chips in Kas-controle, verspreid over de dagregels. Er is geen plek om gericht terug te kijken.

## Voorstel: tabblad "Beoordelingen" in Kas-controle
Een tweede tab bovenin Kas-controle (naast het huidige overzicht), zodat alles rond de dagafsluiting op één plek blijft. Geen nieuwe menu-ingang, geen extra ruis in de zijbalk.

### Wat je daar ziet
1. **Samenvatting bovenaan** voor de gekozen periode en vestiging:
   - Per moment (ontbijt / lunch / diner): hoe vaak rustig, gemiddeld, druk — als drie gekleurde tellers.
   - Zodat je in één oogopslag ziet: "diners waren deze maand 12× druk, 8× gemiddeld".
2. **Chronologische lijst eronder** — nieuwste dag bovenaan, scrollen = terug in de tijd:
   - Per regel: dag + datum, vestiging, drie chips (O/L/D met kleur), en een streepje als een moment niet is ingevuld.
   - Dagen zonder beoordeling komen niet in de lijst (wel zichtbaar in de samenvatting als "niet ingevuld").
3. **Dezelfde filters als het bestaande overzicht**: vestiging + periode (deze week / vorige week / deze maand / eigen datums). De filters gelden voor beide tabbladen.

### Bewust simpel
- Geen grafieken of kalenders in deze stap — een lijst met kleuren leest op een iPad het snelst.
- Geen bewerk- of verwijderknoppen; wie vergist zit, vult de dag opnieuw in via de popup (overschrijft automatisch).
- Alleen zichtbaar voor owner/manager (Kas-controle is dat al).

### Later mogelijk (niet nu)
Koppelen aan omzet per dag (druk + omzet naast elkaar) en aan de bezetting-analyse. Daarvoor moet deze historie eerst een paar weken groeien.

## Technische aanpak
- Alleen `src/pages/KasControle.tsx`: tabblad erbij (bestaande tabs-styling uit het design system), de `dag_beleving`-data wordt al opgehaald voor de chips — diezelfde data voedt het nieuwe tabblad. Geen database- of rechtenwijziging nodig.
- Samenvatting en lijst zijn eenvoudige afleidingen van de bestaande data (useMemo), geen nieuwe queries.
- Verificatie: typecheck + build; daarna in preview controleren dat tabblad, tellers en lijst kloppen met testdata (ik voeg tijdelijk een paar testbeoordelingen toe via de database en verwijder ze daarna niet — ze zijn herkenbaar als test).

## Standaardisatie-suggestie (één)
Neem "beoordelingen terugkijken" op in een vast moment, bijvoorbeeld wekelijks bij het rooster maken: twee minuten scrollen geeft direct gevoel bij vorige week.
