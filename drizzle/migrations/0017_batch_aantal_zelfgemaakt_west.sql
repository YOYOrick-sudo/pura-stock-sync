ALTER TABLE public.koelcel_check_items ADD COLUMN IF NOT EXISTS batch_aantal numeric;

COMMENT ON COLUMN public.koelcel_check_items.batch_aantal IS 'Hoeveel er in een keer gemaakt wordt (MEP-batch). Leeg = huidige berekening.';

-- Batchgroottes voor zelfgemaakte producten in West
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Zuurdesem stokbrood (in 3en snijden)';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Eimengsel (scrambled eggs)';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Falafel';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Gekookte eieren (bio)';
UPDATE public.koelcel_check_items SET batch_aantal = 8 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Aubergine';
UPDATE public.koelcel_check_items SET batch_aantal = 4 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Geroosterde groenten (paprika, courgette, venkel)';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam IN ('Gesneden bloemkool','Gesneden paprika','Rode peper');
UPDATE public.koelcel_check_items SET batch_aantal = 8 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Granaatappels';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND plek='koelcel' AND naam IN ('Chimichurrimayonaise','Knoflook-kurkumamayonaise','Zeewier-algenmayonaise','Hummus');
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Mayonaises (flessen bijvullen)';
UPDATE public.koelcel_check_items SET batch_aantal = 1 WHERE vestiging='West' AND actief AND bron='zelf_west' AND naam='Feta verkruimeld';

-- Doner kebab: zelf gemaakt in West, gevacumeerde pakjes
UPDATE public.koelcel_check_items
SET bron='vriezer', doel_aantal=2, doel_aantal_druk=3, eenheid='pakje', formaat='gevacumeerd pakje'
WHERE vestiging='West' AND actief AND naam='Döner kebab' AND plek='koelcel';

UPDATE public.koelcel_check_items
SET bron='zelf_west', doel_aantal=6, doel_aantal_druk=8, eenheid='pakje', formaat='gevacumeerd pakje', batch_aantal=6
WHERE vestiging='West' AND actief AND naam='Döner kebab' AND plek='vriezer';

INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, reden)
VALUES ('Batchgrootte per zelfgemaakt product + doner kebab vriescel/koelcel', 'koelcel_check_items', 'MEP-taken uit de voorraadronde vragen om een hele batch; doner wordt zelf gemaakt en ligt gevacumeerd in koelcel (2) en vriescel (6)');