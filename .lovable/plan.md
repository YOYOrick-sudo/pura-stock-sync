## Doel
Vaat-afsluittaken toevoegen aan **Laatste Loodjes** in West (sluit). Laatste Loodjes wordt dé gezamenlijke afsluit-categorie voor zowel bediening als keuken — onderaan de unified lijst, ongeacht voor-/achterkant.

## Plaatsing
Categorie **Laatste Loodjes** bestaat al onder voorkant (lampen koel/vries uit, was draaien/ophangen). Daar voegen we de vaattaken aan toe, zodat alles in één blok onderaan de lijst staat.

## Logische volgorde binnen Laatste Loodjes
Workflow van "opruimen → schoonmaken → checken → vloer als laatste":

1. Lampen koelcel en vriescel uit *(bestaand)*
2. Was draaien / was ophangen *(bestaand)*
3. **Prullenbakken schoonmaken** *(nieuw)*
4. **Vaatwas-hoek schoon & leeg — alles opgeborgen?** *(nieuw)*
5. **Binnen- en buitenkant vaatwasser schoonmaken** *(nieuw)*
6. **Onderkant aan- en afvoertafel schoonmaken** *(nieuw)*
7. **Zeep & naglans vaatwasser checken (evt. vervangen)** *(nieuw)*
8. **Vloer vegen, daarna schrobben met vloerreiniger** *(nieuw)* — bewust laatst, want vloer doe je nadat al het andere klaar is

## Technisch
- 6 nieuwe rows in `foh_daily_templates` (location=`west`, department=`voorkant`, phase=`sluit`, category=`Laatste Loodjes`, template_name=`Sluit`, is_active=true, met oplopende `sort_order`).
- Bestaande sort_order van lampen/was blijven; nieuwe taken krijgen hogere sort_order zodat ze daarna komen.
- Door bestaande sync-trigger verschijnen ze meteen in vandaag's actieve `foh_tasks`.
- Geen UI-wijzigingen nodig.
