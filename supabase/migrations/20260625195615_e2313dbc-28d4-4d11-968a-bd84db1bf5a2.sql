-- Herformuleer 'bijvullen diepvries' en 'bijvullen fruitlade' naar leesbaardere titels
UPDATE foh_daily_templates
SET title = 'Diepvries bijvullen: diepvriesfruit voor smoothies (check receptenformulier)'
WHERE title ILIKE '%bijvullen%diepvries%';

UPDATE foh_daily_templates
SET title = 'Fruitlade bijvullen: vers fruit voor sappen (check receptenformulier)'
WHERE title ILIKE '%bijvullen%fruitlade%';

-- Update ook actieve taken van vandaag zodat de wijziging direct zichtbaar is
UPDATE foh_tasks
SET title = 'Diepvries bijvullen: diepvriesfruit voor smoothies (check receptenformulier)'
WHERE title ILIKE '%bijvullen%diepvries%'
  AND archived = false;

UPDATE foh_tasks
SET title = 'Fruitlade bijvullen: vers fruit voor sappen (check receptenformulier)'
WHERE title ILIKE '%bijvullen%fruitlade%'
  AND archived = false;