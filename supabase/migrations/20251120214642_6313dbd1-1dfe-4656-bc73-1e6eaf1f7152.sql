-- Add Tussenlijst (tussen phase) daily templates for Midsland location
-- 51 tasks split across 6 categories, maintaining exact order with sort_order 1-51

INSERT INTO public.foh_daily_templates (location, phase, title, category, priority, repeat_type, sort_order, estimated_minutes)
VALUES
  -- DEEL 1 - Bar Prep Check (9 tasks)
  ('Midsland', 'tussen', 'Bar unit (gesneden) van links naar rechts in unit: passievrucht - munt - gember - limoenpartjes - sinaasappel citroenschijfjes', 'Deel 1 - Bar Prep Check', 2, 'daily', 1, 5),
  ('Midsland', 'tussen', 'Vul ijsblokjes en crushed ice aan. 1/3e vol.', 'Deel 1 - Bar Prep Check', 2, 'daily', 2, 3),
  ('Midsland', 'tussen', 'Maak Jaapie mix (altijd 6 volle flessen onder de bar).', 'Deel 1 - Bar Prep Check', 2, 'daily', 3, 10),
  ('Midsland', 'tussen', 'Maak Poma mix – vodka en passoa (2 flessen onder de bar).', 'Deel 1 - Bar Prep Check', 2, 'daily', 4, 5),
  ('Midsland', 'tussen', 'Maak Esma mix – shanky''s wip & kahlua (2 flessen onder de bar).', 'Deel 1 - Bar Prep Check', 2, 'daily', 5, 5),
  ('Midsland', 'tussen', 'Leeg het Fritz kratje onder de bar.', 'Deel 1 - Bar Prep Check', 2, 'daily', 6, 2),
  ('Midsland', 'tussen', 'Leeg de afvalbakken achter de bar en de glasbak.', 'Deel 1 - Bar Prep Check', 2, 'daily', 7, 3),
  ('Midsland', 'tussen', 'Doekje over de bar: werkblad en gastkant.', 'Deel 1 - Bar Prep Check', 2, 'daily', 8, 5),
  ('Midsland', 'tussen', 'Fruitmand bar uitzoeken/bijvullen (FIFO).', 'Deel 1 - Bar Prep Check', 2, 'daily', 9, 3),
  
  -- DEEL 2 - Bijvullen (10 tasks)
  ('Midsland', 'tussen', 'Sterkedrank vriezer: 1 fles Salmari – 1 fles Limoncello – 1 fles Juttersbitter.', 'Deel 2 - Bijvullen', 2, 'daily', 10, 3),
  ('Midsland', 'tussen', 'Bierfusten: 2 van elk soort in bierkoeling.', 'Deel 2 - Bijvullen', 2, 'daily', 11, 5),
  ('Midsland', 'tussen', 'Wijn – kaartwijnen rood: per soort ±3 in wijnklimaatkast.', 'Deel 2 - Bijvullen', 2, 'daily', 12, 5),
  ('Midsland', 'tussen', 'Wijn – kaartwijnen wit: ±3 in koeling.', 'Deel 2 - Bijvullen', 2, 'daily', 13, 5),
  ('Midsland', 'tussen', 'Rode huisopen wijn op de bar: 3 flessen van elk.', 'Deel 2 - Bijvullen', 2, 'daily', 14, 3),
  ('Midsland', 'tussen', 'Witte huiswijnen & rosé in wijnkoeling: aanvullen tot vol.', 'Deel 2 - Bijvullen', 2, 'daily', 15, 3),
  ('Midsland', 'tussen', 'Bijvullen frisdranken – flesbier – melk – 5 kombucha – 5 grote gingerbeer – sterke drank koeling.', 'Deel 2 - Bijvullen', 2, 'daily', 16, 10),
  ('Midsland', 'tussen', 'Bijvullen sterke drank: van elk 2 op de bovenste plank (Bacardi, Vodka, Likeur 43, Kahlua, Passoa, Brick Gin, Seedlip).', 'Deel 2 - Bijvullen', 2, 'daily', 17, 5),
  ('Midsland', 'tussen', 'Homemade lemonade: van beide smaken 1 extra volle fles in de barkoeling.', 'Deel 2 - Bijvullen', 2, 'daily', 18, 3),
  ('Midsland', 'tussen', 'Bijvullen overig: koffiebonen (beide reservoirs vol) + extra zak - chocoladepotten - decafé - chai - kaneel & anijs - pepermunt - koekjes - rietjes - visitekaartjes - tandenstokers - olijfprikkers - bierviltjes - suikersiroop - citroensap - rietsuiker potje - suikerflesjes voor gasten', 'Deel 2 - Bijvullen', 2, 'daily', 19, 15),
  
  -- TERRAS (5 tasks)
  ('Midsland', 'tussen', 'Alle olielampjes bijvullen tot 1 cm onder de rand (niet te vol).', 'Terras', 2, 'daily', 20, 10),
  ('Midsland', 'tussen', 'Olielampjes aansteken.', 'Terras', 2, 'daily', 21, 5),
  ('Midsland', 'tussen', 'Terras opruimen.', 'Terras', 2, 'daily', 22, 10),
  ('Midsland', 'tussen', 'Kussentjes netjes leggen.', 'Terras', 2, 'daily', 23, 3),
  ('Midsland', 'tussen', 'Terrascheck: alles verzorgd en gezellig?', 'Terras', 2, 'daily', 24, 3),
  
  -- BINNEN (14 tasks)
  ('Midsland', 'tussen', 'Linnen servetten vouwen (genoeg voor 2 shifts).', 'Binnen', 2, 'daily', 25, 15),
  ('Midsland', 'tussen', 'Check: is de zaak netjes? (spelletjeshoek – kussens bank – stoelen recht – tijdschriftenhoek).', 'Binnen', 2, 'daily', 26, 5),
  ('Midsland', 'tussen', 'Lampen dimmen, zowel keuken als restaurant.', 'Binnen', 2, 'daily', 27, 2),
  ('Midsland', 'tussen', 'Check de notities van elke reservering in Zenchef.', 'Binnen', 2, 'daily', 28, 5),
  ('Midsland', 'tussen', 'Check en organiseer reserveringen in Zenchef (shiftleader).', 'Binnen', 2, 'daily', 29, 10),
  ('Midsland', 'tussen', 'Wachtlijst controleren → plaatsen waar mogelijk + bellen (ook als er geen plek is).', 'Binnen', 2, 'daily', 30, 10),
  ('Midsland', 'tussen', 'Mailbox controleren op te beantwoorden e-mails (shiftleader).', 'Binnen', 2, 'daily', 31, 10),
  ('Midsland', 'tussen', 'Doekje over alle tafels voordat je gaat indekken.', 'Binnen', 2, 'daily', 32, 10),
  ('Midsland', 'tussen', 'Lunchmenukaarten van tafel.', 'Binnen', 2, 'daily', 33, 2),
  ('Midsland', 'tussen', 'Tafels rechtzetten: 8 t/m 12 – uitlijnen met de lampen.', 'Binnen', 2, 'daily', 34, 5),
  ('Midsland', 'tussen', 'Om 16:00 indekken voor diner, controleren via Zenchef indeling.', 'Binnen', 2, 'daily', 35, 20),
  ('Midsland', 'tussen', 'Genoeg stoelen per persoon bij de reservering.', 'Binnen', 2, 'daily', 36, 3),
  ('Midsland', 'tussen', 'Zet avondplaylist aan (SONOS).', 'Binnen', 2, 'daily', 37, 2),
  ('Midsland', 'tussen', 'Kaarsjes check: waar nodig verwisselen + aansteken (inclusief stompkaarsen).', 'Binnen', 2, 'daily', 38, 10),
  
  -- HYGIËNE (8 tasks)
  ('Midsland', 'tussen', 'Sopje verversen naast de bar.', 'Hygiëne', 2, 'daily', 39, 2),
  ('Midsland', 'tussen', 'Was check: in de machine + aanzetten – was opvouwen – ophangen.', 'Hygiëne', 2, 'daily', 40, 10),
  ('Midsland', 'tussen', 'Toilet checken: SCHOON: bleek in wc-pot – ruimte afnemen met multireiniger – vloer dweilen. BIJVULLEN: toiletpapier – handdoekjes – zeep.', 'Hygiëne', 2, 'daily', 41, 15),
  ('Midsland', 'tussen', 'Afwas wegwerken (als er geen afwasser is).', 'Hygiëne', 2, 'daily', 42, 15),
  ('Midsland', 'tussen', 'Check of de afwaslade van de bar leeg is.', 'Hygiëne', 2, 'daily', 43, 3),
  ('Midsland', 'tussen', 'Emballage sorteren (juiste flesjes in juiste krat).', 'Hygiëne', 2, 'daily', 44, 10),
  ('Midsland', 'tussen', 'Volle kratten emballage op de Kooyman-kar zetten.', 'Hygiëne', 2, 'daily', 45, 5),
  ('Midsland', 'tussen', 'Bestellingen opruimen: uit doos in stelling plaatsen (FIFO).', 'Hygiëne', 2, 'daily', 46, 10),
  
  -- OVERDRACHT (5 tasks)
  ('Midsland', 'tussen', 'Overleg met de keuken: bijzonderheden diner?', 'Overdracht', 2, 'daily', 47, 5),
  ('Midsland', 'tussen', 'Bespreek met collega''s of je nog iets voor ze kunt betekenen.', 'Overdracht', 2, 'daily', 48, 5),
  ('Midsland', 'tussen', 'Rond 21:00 – muziekvolume omhoog (borreltijd!).', 'Overdracht', 2, 'daily', 49, 1),
  ('Midsland', 'tussen', 'Zijn de lampen gedimd (keuken + restaurant)?', 'Overdracht', 2, 'daily', 50, 2),
  ('Midsland', 'tussen', 'Uitklokken.', 'Overdracht', 2, 'daily', 51, 1)
ON CONFLICT DO NOTHING;