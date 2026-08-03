# West-takenlijst: secties Bediening / Keuken / Samen

Doel: de West-lijst opdelen in drie vaste secties met eigen kop en voortgang, met daarbinnen de bestaande categorieën. "Bijvullen & legen" wordt gesplitst in "Bijvullen bar" (Bediening) en "Bijvullen keuken" (Keuken).

## Sectie-indeling (goedgekeurd)

**Bediening**
1. Deel 1 (alleen open)
2. Bar
3. Bijvullen bar (nieuw)
4. Schoonmaak Bar
5. shop
6. Terras

**Keuken**
1. Ontdooien (vriezer -> koelcel)  — bovenaan
2. Keuken
3. Bijvullen keuken (nieuw)

**Samen / Laatste loodjes**
1. Sanitair
2. Extra
3. Algemeen
4. Laatste Loodjes

## Splitsing "Bijvullen & legen" (21 taken)

Naar **Bijvullen bar** (13):
Bananencake aanvullen vanuit vitrine · Broodbakken aanvullen (Pita, brioche, deugniet) · Fruit garnering aanvullen (FIFO) · Fruit koellade aanvullen · Fruit vrieslade aanvullen · Glasbak legen · Koffiebonen bijvullen in hopper · Kokosmelk bijvullen · Limonadeflessen aanvullen · Melk en frisdrank bijvullen · Sinaasappelsap bijvullen · Smoothies maken voor de volgende dag · Takeaway bekers & deksels

Naar **Bijvullen keuken** (8):
Bananenpannenkoeken aanvullen vanuit vriezer · Forel aanvullen · Gerookte zalm aanvullen · Op reserve hoge 1/9e bak (Hüttenkäse, cranberry, kokosyoghurt, avocado spread) · Op reserve midden 1/9e (relish, wortelspread, pesto) · Toppings pas aanvullen · Zuurdesem stokbrood in 3en snijden · Check MEP lijst whiteboard (open-fase)

## Fase "Periodiek"

Gecontroleerd: `foh_category_order` bevat alleen rijen voor open/tussen/borrel/sluit (een check-constraint laat geen andere waarde toe) en West heeft momenteel geen actieve periodieke taken (`phase IS NULL`). Er is dus niets extra's mee te nemen; periodieke taken blijven buiten de sectie-indeling en worden onderaan als eigen blok getoond.


## Technisch

Het bestaande `department`-veld wordt voor West hergebruikt met de waarden `bediening`, `keuken`, `samen` (Midsland/overige locaties blijven `voorkant`/`achterkant`, ongewijzigd). Geen nieuwe kolommen nodig; `foh_tasks`, `foh_daily_templates` en `foh_category_order` hebben allemaal al `department`.

### Migratie-SQL (uit te voeren na akkoord)

```sql
-- 1. Bijvullen splitsen in templates (West)
UPDATE public.foh_daily_templates SET category = 'Bijvullen keuken'
WHERE location='West' AND category='Bijvullen & legen' AND (
  title ILIKE 'Bananenpannenkoeken%' OR title ILIKE 'Forel%' OR title ILIKE 'Gerookte zalm%'
  OR title ILIKE 'Op reserve%' OR title ILIKE 'Zuudesem%' OR title ILIKE 'Zuurdesem%'
  OR title ILIKE 'Check MEP lijst%');

UPDATE public.foh_daily_templates SET category = 'Bijvullen bar'
WHERE location='West' AND category='Bijvullen & legen';

-- 2. Zelfde splitsing voor lopende (niet-gearchiveerde) taken
UPDATE public.foh_tasks SET category='Bijvullen keuken'
WHERE location='West' AND category='Bijvullen & legen' AND archived=false AND (
  title ILIKE 'Bananenpannenkoeken%' OR title ILIKE 'Forel%' OR title ILIKE 'Gerookte zalm%'
  OR title ILIKE 'Op reserve%' OR title ILIKE 'Zuudesem%' OR title ILIKE 'Zuurdesem%'
  OR title ILIKE 'Check MEP lijst%');

UPDATE public.foh_tasks SET category='Bijvullen bar'
WHERE location='West' AND category='Bijvullen & legen' AND archived=false;

-- 3. Department zetten per categorie (templates + taken)
WITH m(cat, dept) AS (VALUES
  ('Deel 1','bediening'),('Bar','bediening'),('Bijvullen bar','bediening'),
  ('Schoonmaak Bar','bediening'),('shop','bediening'),('Terras','bediening'),
  ('Ontdooien (vriezer → koelcel)','keuken'),('Keuken','keuken'),('Bijvullen keuken','keuken'),
  ('Sanitair','samen'),('Extra','samen'),('Algemeen','samen'),('Laatste Loodjes','samen'))
UPDATE public.foh_daily_templates t SET department = m.dept
FROM m WHERE t.location='West' AND lower(t.category)=lower(m.cat);

WITH m(cat, dept) AS (VALUES
  ('Deel 1','bediening'),('Bar','bediening'),('Bijvullen bar','bediening'),
  ('Schoonmaak Bar','bediening'),('shop','bediening'),('Terras','bediening'),
  ('Ontdooien (vriezer → koelcel)','keuken'),('Keuken','keuken'),('Bijvullen keuken','keuken'),
  ('Sanitair','samen'),('Extra','samen'),('Algemeen','samen'),('Laatste Loodjes','samen'))
UPDATE public.foh_tasks t SET department = m.dept
FROM m WHERE t.location='West' AND lower(t.category)=lower(m.cat);

-- 4. Volgorde-tabel herbouwen voor West (alle fases), sectie-volgorde in sort_order
DELETE FROM public.foh_category_order WHERE location='West';

INSERT INTO public.foh_category_order (location, department, phase, category, sort_order)
SELECT 'West', v.dept, p.phase, v.cat, v.ord
FROM (VALUES ('open'),('tussen'),('borrel'),('sluit')) AS p(phase),
(VALUES
  ('bediening','Deel 1',10),('bediening','Bar',20),('bediening','Bijvullen bar',30),
  ('bediening','Schoonmaak Bar',40),('bediening','shop',50),('bediening','Terras',60),
  ('keuken','Ontdooien (vriezer → koelcel)',10),('keuken','Keuken',20),('keuken','Bijvullen keuken',30),
  ('samen','Sanitair',10),('samen','Extra',20),('samen','Algemeen',30),('samen','Laatste Loodjes',40)
) AS v(dept,cat,ord);
```

### Frontend-aanpassingen

- `src/lib/foh-category-order.ts`: `Department` uitbreiden met `'bediening' | 'keuken' | 'samen'`; helpers generiek maken over departments.
- `src/components/foh/FohTasks.tsx`: West rendert drie sectiekoppen (Bediening / Keuken / Samen) met eigen voortgangsbalk en inklapbaarheid; binnen elke sectie de categorieën op `sort_order`. Midsland-gedrag ongewijzigd.
- `src/pages/TakenBeheer.tsx`: voor West een sectiekeuze (Bediening/Keuken/Samen) i.p.v. de vaste `voorkant`; categorie-volgorde en hernoemen/verwijderen per sectie.
- `src/components/foh/ListManager.tsx`: nieuwe taak krijgt automatisch het department van de gekozen categorie.
- `supabase/functions/reset-daily-tasks`: department mee overnemen vanuit template bij dagelijkse generatie (controleren; zo niet, toevoegen).

### Verificatie na uitvoering

1. Query: 0 rijen `foh_daily_templates`/`foh_tasks` (West, niet-gearchiveerd) met `category='Bijvullen & legen'` of `department='voorkant'`.
2. `/taken-bediening` West toont drie secties in de juiste volgorde, Ontdooien bovenaan in Keuken.
3. Categorie verplaatsen in `/taken/beheer` slaat direct door naar de live lijst binnen de eigen sectie.
