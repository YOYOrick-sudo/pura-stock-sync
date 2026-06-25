
-- Rename West voorkant tasks: shorter, clearer, fix typos
DO $$
DECLARE
  rename_map jsonb := '{
    "30c59b7a-9334-46ff-aa9a-aa668556bc96": "Inklokken",
    "41988c1a-c491-4d29-9595-aa9214123a37": "Koffiemachine uit eco-stand",
    "71e339a4-18c8-47b1-9b54-fe06cd0bd97e": "Kussens naar terras",
    "a96916dd-108a-474b-ae07-404331edf5c6": "Bakjes en plantjes op tafels",
    "017bf012-7ea0-4027-b81d-8d42b115c910": "Tafels schoonmaken (binnen + buiten)",
    "9f95622c-2c24-4aec-bd2d-3c52bafde494": "Terras vegen",
    "85bd26da-0138-4564-93e7-ceed83fb40b2": "Stofzuigen en dweilen",
    "b415f2db-9908-4f7c-8bd1-2ace1c31d6af": "Kassa tellen",
    "96cb4ba7-2fa4-4674-8467-2b1dcff681fe": "Smoothies bijvullen",
    "34e1850b-e675-440e-b184-98ce248175e6": "Waterkaraf vullen",
    "db28778a-7d60-49b7-b384-0661cffcf39c": "Fruit bijsnijden, deksels eraf",
    "68218cfa-141c-4d59-9ecb-8a93dd527cb9": "Sinaasappels halveren",
    "9e6a4f3c-74cb-4331-97ae-476a0e63a438": "Fles water bij juicer",
    "b0402c76-5e3f-4a5c-a358-265f92c4a300": "Mini-gardes in glaasje water",
    "8af6782d-62b2-4006-9619-58da91c5ea15": "Siropen op bar",
    "6d39fd67-1533-4f9a-8fa5-d34fc4da1ae9": "Muntblaadjes op bar",
    "eec63516-a467-4242-ac42-e6080b367e7f": "Blenders + kannen schoon (handwas!)",
    "13d4b96a-c327-4e8d-aecf-cf4a428870bf": "Juicer schoonmaken (handwas!)",
    "144e42f7-258e-42cc-b540-beda01c70986": "Juspers schoon",
    "5dcce6d2-74b9-4739-99e7-7fa88c917444": "Lades schoon",
    "69ff9dae-17d5-4f27-bedc-1f8a197aaded": "Limonadeflessen in koeling",
    "ce28c4de-5ebb-4f80-9a5a-3180114b1501": "Restwater karaf → bamboeplant",
    "8284f038-4711-4ca1-ba27-aa8eab3a8500": "Melk en frisdrank bijvullen",
    "fc20103a-adb3-4450-a29f-4374214e8c43": "Fruit + vriesfruit bijvullen",
    "7ad04ac4-8b20-4fe5-8be9-5606e29462c8": "Koffievoorraad bijvullen",
    "e634d6e5-0fb9-4ed0-ba2b-0d90cf5f6ec1": "Smoothie-pakken bijvullen",
    "da860e6a-fb0a-4a08-8f4b-6f839c849f5f": "Deksels op voorgesneden fruit",
    "12bde78b-6840-4b15-8719-f8baa8b2fbdb": "Dienbladen schoon",
    "496e204d-432a-4c66-baf9-6f4ac17955fc": "Tangen zoet/hartig schoon (handwas!)",
    "bb7ba01e-c8cd-486f-9e05-ece139b9b2f3": "Melkkannetjes in vaat",
    "314ad021-7357-47c3-94f6-289837ed1beb": "Melkstation schoon + rooster in vaat",
    "fd8b8fff-99d5-44f8-9cae-78724a0f70ab": "Take-away bijvullen",
    "07ba26d6-f0e9-4b31-8624-5ffb6194d15c": "Kussens naar binnen",
    "f9a8e947-15bb-463c-bec4-a2f988d62ca0": "Terrasbakjes in grijze bak (naar binnen)",
    "ac9d4c51-b243-4efc-be80-3b56d5247d9f": "Plantjes in grijze bak (naar binnen)",
    "57381cd4-942a-403a-820d-f29f877268ca": "Bord naar binnen",
    "762bd1b5-ec93-40cd-b59c-9c81099586d4": "Toilet schoonmaken"
  }'::jsonb;
  k text;
BEGIN
  FOR k IN SELECT jsonb_object_keys(rename_map) LOOP
    UPDATE public.foh_daily_templates
       SET title = rename_map->>k
     WHERE id = k::uuid;
    UPDATE public.foh_tasks
       SET title = rename_map->>k
     WHERE template_id = k::uuid
       AND archived = false;
  END LOOP;
END $$;
