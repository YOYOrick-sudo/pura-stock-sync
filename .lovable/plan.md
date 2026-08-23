# Allergenen in de recepturen

Doel: bij elk recept zichtbaar welke van de 14 wettelijke allergenen erin zitten — automatisch afgeleid uit de ingrediënten, met de mogelijkheid om per recept te corrigeren. Ook nieuwe recepten krijgen dit meteen.

## Uitgangspunt

De 14 EU-allergenen: gluten, schaaldieren, ei, vis, pinda, soja, melk, noten, selderij, mosterd, sesam, sulfiet, lupine, weekdieren.

Bron van waarheid = het **ingrediënt**, niet het recept. Zet je bij "Like mayonaise" één keer de allergenen goed, dan kloppen alle recepten waar het in zit meteen. Per recept kun je daarna nog handmatig een allergeen toevoegen (bijv. kruisbesmetting: "kan sporen bevatten") of juist wegstrepen.

## Wat je straks ziet

- **Receptdetail**: een blok "Allergenen" met gekleurde badges. Per allergeen kun je uitklappen welk ingrediënt het veroorzaakt ("Gluten — via Knapperkoek").
- **Receptformulier**: terwijl je ingrediënten toevoegt, updatet het allergenenblok live. Ingrediënten waarvan de allergenen nog nooit zijn vastgesteld krijgen een oranje "nog niet gecontroleerd"-markering, zodat een leeg allergenenveld nooit als "veilig" wordt gelezen.
- **Receptenlijst**: kleine allergenen-icoontjes per rij (optioneel filter later).
- **Ingrediëntenbeheer** (`/kitchen/ingredienten`): per ingrediënt de allergenen aanvinken, plus een status "gecontroleerd / onbekend".
- **Sticker/print**: buiten scope voor nu, maar de data is er straks voor beschikbaar.

## Bestaande recepten vullen

Een probleem in de huidige data: van de 99 ingrediëntregels zijn er maar 41 gekoppeld aan de ingrediëntenlijst; 47 losse namen (zoals "Oregano", "Uchibori sushisu") staan alleen als tekst. Die worden eerst opgeschoond en gekoppeld, anders blijft de allergenenafleiding half leeg.

Daarna vullen we de allergenen in twee stappen:
1. **Automatische eerste inschatting** met AI over alle ingrediëntnamen (met kennis van veelgebruikte horecaproducten zoals Uchibori sushisu → soja/gluten/sulfiet, Like mayonaise → mosterd, Knapperkoek → gluten). Elke suggestie krijgt status "onbevestigd".
2. **Jij bevestigt** in het ingrediëntenbeheer per ingrediënt met één klik. Pas na bevestiging telt een ingrediënt als gecontroleerd. Dit is bewust: allergeneninfo is wettelijk, dus AI mag voorstellen maar niet beslissen.

Het gaat om ongeveer 70 unieke ingrediënten — dat is in één sessie door te lopen.

## Nieuwe recepten in de toekomst

- Nieuw ingrediënt intypen → direct een allergenenvraag in de combobox, met AI-voorstel als startpunt.
- Recept opslaan met nog niet-gecontroleerde ingrediënten mag wel, maar het recept toont dan een duidelijke waarschuwing "allergeneninfo onvolledig".
- Een overzicht "ingrediënten zonder allergenencheck" in het ingrediëntenbeheer, zodat de lijst nooit stilletjes vervuilt.

## Technisch

**Database (migratie)**
- `allergen` enum met de 14 codes.
- `ingredienten_master`: `allergenen allergen[] not null default '{}'`, `allergenen_status text not null default 'onbekend'` ('onbekend' | 'ai_voorstel' | 'bevestigd'), `allergenen_bron text`, `allergenen_bijgewerkt_op`.
- `recipes`: `allergenen_extra allergen[]`, `allergenen_uitgesloten allergen[]`, `allergenen_notitie text` voor handmatige correcties per recept.
- View `v_recept_allergenen` (`security_invoker = true`): per recept de unie van ingrediëntallergenen + extra − uitgesloten, plus een `onbekende_ingredienten`-teller. GRANTs volgens bestaand patroon.

**Data-opschoning (run_sql)**
- Losse ingrediëntnamen normaliseren en koppelen aan `ingredienten_master` (nieuwe masters aanmaken waar nodig), `recept_ingredienten.ingredient_id` vullen.

**Edge function `suggest-allergenen`**
- Lovable AI Gateway (`google/gemini-3-flash-preview`), zelfde patroon als `suggest-recipe-category`.
- Input: lijst ingrediëntnamen (batch, max ~25 per call). Output: per naam een array allergeencodes + korte reden.
- Statusafhandeling volgens gateway-contract (429/402/403 netjes teruggeven, geen blinde retries). Wordt handmatig aangeroepen vanuit het beheerscherm, geen achtergrondcron.

**Frontend**
- `src/lib/allergenen.ts`: codes, Nederlandse labels, iconen/kleuren.
- `src/hooks/useAllergenen.ts`: ophalen/muteren per ingrediënt + bulk AI-suggestie.
- `useRecipes.ts` uitbreiden zodat detail en lijst de afgeleide allergenen meelezen.
- Aanpassingen in `RecipeDetail.tsx`, `RecipeForm.tsx`, `Recipes.tsx`, `Ingredienten.tsx`, `IngredientCombobox.tsx`.

## Volgorde van bouwen

1. Migratie + view + GRANTs.
2. Ingrediëntkoppeling opschonen.
3. Ingrediëntenbeheer met allergenen aanvinken + statuskolom.
4. AI-suggestiefunctie en bulkactie "vul voorstellen".
5. Receptdetail, receptformulier en lijst tonen de allergenen.
6. Doorloop van alle bestaande recepten en bevestiging van de suggesties.
