## Probleem

Wijzigingen in de Template-editor worden alleen opgeslagen in `foh_daily_templates`, maar niet doorgevoerd in de al gegenereerde `foh_tasks` van vandaag. Daardoor blijft een al aangemaakte taak (bv. "Limonadeflessen in koeling") in het overzicht staan, ook al heet hij in de admin nu "Limonadeflessen Aanvullen (1 van ieder op reserve in de koelcel)".

## Oplossing

`handleSaveTemplateEdits` in `src/components/foh/FohTasks.tsx` uitbreiden zodat elke template-mutatie ook de bijbehorende actieve taak van vandaag bijwerkt.

### Per actie

1. **Update bestaande template-taak** → ook `foh_tasks` updaten waar:
   - `template_id = task.id`
   - `due_date = vandaag (NL)`
   - `archived = false`
   - `completed_at IS NULL` (afgevinkte taken niet aanraken — die zijn al "gedaan")
   
   Velden: `title`, `category`, `description`, `estimated_minutes`, `sort_order`.

2. **Nieuwe template-taak ingevoegd** → na de `insert` van de template direct ook een `foh_tasks`-rij voor vandaag aanmaken met `template_id = nieuwe template id`, `due_date = vandaag`, juiste `location`/`phase`/`department`/`category`/`sort_order`/`title`. (Zelfde shape als de DB-trigger `create_task_from_new_template` doet — die werkt alleen bij weekly/dow-match dus we doen het hier expliciet.)

3. **Verwijderde template-taak** → corresponderende open taak van vandaag soft-deleten (`archived = true` waar `template_id IN (...)`, `due_date = vandaag`, `completed_at IS NULL`). Afgevinkte taken laten staan voor de historie.

4. **Categorie-rename via picker** in de editor: titels blijven hetzelfde, maar `category` op de template wijzigt. De update onder punt 1 dekt dit al (category wordt mee-gesynchroniseerd naar `foh_tasks`).

Na afloop `queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] })` (staat er al) zodat de UI ververst.

### Veiligheid

- Alleen taken van **vandaag** (`due_date = today NL`) en alleen **niet-afgevinkte**, **niet-gearchiveerde** rijen worden aangeraakt. Historische data en lopende voortgang blijven intact.
- Edge function `generate-waste-tasks` / dagelijkse reset (04:00) wordt niet aangepast — die genereert morgen automatisch op basis van de bijgewerkte template.

### Bestanden

- `src/components/foh/FohTasks.tsx` — alleen `handleSaveTemplateEdits` aanpassen.

Geen schema-wijzigingen nodig.
