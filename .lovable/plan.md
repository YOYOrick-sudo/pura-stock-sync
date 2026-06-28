## Probleem

Bij klikken op ↑ / ↓ in **Subcategorieën beheren** (West) wordt de nieuwe volgorde wél naar de database geschreven, maar de UI verspringt niet meteen. Oorzaak: `handleMoveCategory` doet eerst 6+ sequentiële `upsert`-calls (per categorie één) en wacht dán op `invalidateQueries` → refetch. Tussen klik en refetch zie je de oude volgorde, waardoor het lijkt alsof er niets gebeurt. Bij snel achter elkaar klikken kunnen latere klikken ook op stale data werken.

## Fix (alleen West, subcategorie-beheer paneel)

1. **Optimistische update** — in `handleMoveCategory` direct na het swappen van de array `queryClient.setQueryData(['foh-category-order', userLocation], …)` aanroepen met de nieuwe volgorde (en sort_order-waarden als veelvouden van 10). UI verspringt dan onmiddellijk.

2. **Eén batched upsert i.p.v. een for-loop** — `persistCategoryOrder` herschrijven naar één `supabase.from('foh_category_order').upsert([...alle rijen...], { onConflict: 'location,department,category' })`. Sneller en atomair.

3. **Rollback bij fout** — als de upsert faalt, `setQueryData` terugzetten naar de vorige snapshot en een toast tonen. Bij succes alsnog `invalidateQueries` om met de server te syncen.

4. **Knoppen tijdens save kort uitschakelen** — kleine `isSavingOrder`-state zodat dubbele klikken tijdens de roundtrip geen race veroorzaken (knoppen `disabled` tijdens save).

## Niet aanraken

- Rename / delete / nieuwe-categorie-flows.
- Midsland-gedrag.
- Live takenlijst sortering en template-editor.
- Database-schema (`foh_category_order` blijft zoals het is).

## Verificatie

- ↑ op een rij → rij schuift onmiddellijk omhoog, nummer (1./2./…) update direct.
- Pagina hard verversen → volgorde blijft hetzelfde (= echt opgeslagen).
- ↑ op een rij met `(nieuw)` label → werkt ook, label verdwijnt na refetch want hij staat nu in `foh_category_order`.
- Snel 3x klikken → geen vreemde sprongen, eindvolgorde klopt met DB.
