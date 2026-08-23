# Allergenen: tekstregel weg + zoveel mogelijk automatisch

## 1. Antwoord op je vraag

Het systeem weet wél per ingrediënt welke allergenen erin zitten: dat staat op de ingrediëntenlijst (Keuken → Ingrediënten), waar alle 63 producten zijn ingevuld (45 bevestigd, 18 nog als AI-voorstel). Een recept telt die automatisch op via de gekoppelde ingrediënten.

De enige zwakke plek: typ je bij een nieuw recept een ingrediënt dat nog niet in de lijst staat, dan weet het systeem er niets van en telt het stil als "niets". Dat lossen we op met automatiek in plaats van handwerk.

## 2. Tekstregel weghalen

In het receptdetail vervalt de regel "Automatisch afgeleid uit de ingrediënten. Controleer bij twijfel altijd het productetiket." Badges en de waarschuwing "x ingrediënten niet gecontroleerd" blijven.

## 3. Automatisch, met jij als eindcontrole

Zoveel mogelijk gaat vanzelf; jij hoeft alleen te bevestigen waar het wettelijk moet.

- **Live meetellen**: terwijl je ingrediënten toevoegt in het receptformulier, updatet het allergenenblok direct — nog voor opslaan.
- **Nieuw ingrediënt = direct AI-invulling**: typ je een naam die nog niet bestaat, dan draait de AI-suggestie automatisch op de achtergrond en zijn de allergenen meteen ingevuld met status "voorstel". Je hoeft niets te openen. Wil je corrigeren, dan klik je op de badge.
- **Automatische check bij opslaan**: recept opslaan triggert een stille AI-pass over alle nog niet ingevulde ingrediënten. Bij terugkomst tonen de recepten meteen allergenen.
- **Eén klik bevestigen**: op de ingrediëntenpagina en in het receptformulier staat bij een voorstel één knop "Klopt" (status → bevestigd). Geen dialoog nodig voor het normale geval; de bestaande bewerk-dialoog blijft voor uitzonderingen.
- **Signaal per rij**: groen = bevestigd, oranje = AI-voorstel (telt mee, maar nog niet gecontroleerd), rood = niet gekoppeld. Rood komt straks bijna niet meer voor omdat elk nieuw ingrediënt automatisch een master krijgt.
- **Correctie per recept**: extra allergeen toevoegen (kruisbesmetting) of uitsluiten, plus notitie — die velden bestaan al in de database.

Bewust niet volledig automatisch: het definitieve stempel "gecontroleerd" blijft menselijk. Allergeneninfo is wettelijk; AI mag voorstellen, niet beslissen. Een recept met alleen voorstellen werkt wel gewoon en toont een zachte waarschuwing.

## 4. Wat is wijsheid

Ingrediënt = bron van waarheid, recept = optelsom. Eén keer per product goed = klopt in alle recepten. De AI doet het typewerk, jij doet de check — dat is de snelste route die ook correct blijft.

## Technisch

- Nieuwe edge function `suggest-allergenen`: Lovable AI Gateway (`google/gemini-3-flash-preview`), zelfde patroon als `suggest-recipe-category`. Input: lijst ingrediëntnamen (batch max ~25). Output per naam: allergeencodes, sporen, korte reden. Nette afhandeling van 429/402.
- `RecipeDetail.tsx`: disclaimer verwijderen.
- `RecipeForm.tsx`: allergenenblok dat client-side afleidt uit `ingredient_id`s via `useIngredientAllergenen()`; statusindicator per rij; "Klopt"-knop; override-velden naar `recipes.allergenen_extra` / `allergenen_uitgesloten` / `allergenen_notitie` via de bestaande hook; debounced aanroep van `suggest-allergenen` voor nieuwe/lege ingrediënten en een stille pass bij opslaan.
- `IngredientCombobox.tsx`: nieuw ingrediënt aanmaken triggert automatisch de AI-suggestie; statusbadge per optie.
- `Ingredienten.tsx`: bulkactie "vul voorstellen aan" en één-klik bevestigen in de lijst.
- Hergebruik `AllergenenBadges`, `AllergenenEditDialog`, `useAllergenen`. Geen databasemigratie nodig.
