-- Vulgraad uit de formaatnaam halen en in het doelaantal verwerken (West, actief)
INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'voorraadronde-formaat', 'koelcel_check_items', id,
       'Vulgraad uit formaatnaam gehaald en verwerkt in doelaantal',
       formaat || ' | doel ' || doel_aantal::text
FROM public.koelcel_check_items
WHERE vestiging = 'West' AND actief AND formaat ~* ',\s*(half vol|1/3 vol)$';

UPDATE public.koelcel_check_items
SET doel_aantal = ROUND(doel_aantal * 0.5, 2),
    doel_aantal_druk = CASE WHEN doel_aantal_druk IS NULL THEN NULL ELSE ROUND(doel_aantal_druk * 0.5, 2) END,
    formaat = btrim(regexp_replace(formaat, ',\s*(half vol|1/3 vol)$', ''))
WHERE vestiging = 'West' AND actief
  AND formaat ~* ',\s*(half vol|1/3 vol)$';

UPDATE public.koelcel_check_items
SET formaat = btrim(regexp_replace(formaat, ',\s*vol$', ''))
WHERE vestiging = 'West' AND actief AND formaat ~* ',\s*vol$';

UPDATE public.koelcel_check_items
SET formaat = regexp_replace(formaat, '\s*halfhoog$', ' midden')
WHERE vestiging = 'West' AND actief AND formaat ~* '\s*halfhoog$';
