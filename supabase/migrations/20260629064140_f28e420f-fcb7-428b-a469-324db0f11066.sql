-- Voorkom dubbele actieve template-taken op dezelfde datum
-- Eerst eventuele bestaande duplicaten (oudere kopieën) archiveren
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY template_id, due_date ORDER BY completed DESC, created_at ASC) AS rn
  FROM foh_tasks
  WHERE archived = false
    AND template_id IS NOT NULL
)
UPDATE foh_tasks SET archived = true
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Unieke partial index: per actieve template-taak maximaal één per dag
CREATE UNIQUE INDEX IF NOT EXISTS uniq_foh_tasks_active_template_due
  ON public.foh_tasks (template_id, due_date)
  WHERE archived = false AND template_id IS NOT NULL;