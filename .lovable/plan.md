Toevoegen van 6 nieuwe taken aan de "Sanitair"-categorie in de West sluitlijst (voorkant).

Dit omvat:
1. **Deurhendel schoonmaken**
2. **Spoelbakje schoonmaken**
3. **Wanden rondom toilet schoonmaken**
4. **Toiletpot schoonmaken (boven, onder zeikant)**
5. **Toiletpapier Bijvullen**
6. **Papieren handoekjes Bijvullen**

Technische aanpak:
- Insert de 6 taken in `foh_daily_templates` (location='West', phase='sluit', department='voorkant', category='Sanitair', template_name='Sluit', is_active=true), met sort_orders na de bestaande "Toilet schoonmaken" (290) en de laatste taak in de lijst (300). Nieuwe sort_orders: 310, 320, 330, 340, 350, 360.
- Insert dezelfde 6 taken in `foh_tasks` voor **vandaag** (28 juni 2026), zodat ze direct zichtbaar zijn in de actieve lijst.
- De "Sanitair"-categorie bestaat al in `foh_category_order` (sort_order 50), dus geen wijzigingen nodig aan de categorievolgorde.
- Geen code-wijzigingen nodig; puur data-aanvulling.