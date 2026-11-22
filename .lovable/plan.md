# Midsland: bestaande betaalwijze eilandbezorger koppelen

- **Categorie:** gerichte functiecorrectie en twee bestaande configuratiewaarden; geen schema/RLS-wijziging.
- Corrigeer alleen de betaalwijzen-uitlezing in `supabase/functions/eilandbezorger-beheer/index.ts` naar GET `/rest/onlineordering/paymenttype`, met bestaande Midsland-toegang via centraal tokenbeheer.
- Laat de bestaande eigenaarscontrole intact. Voeg een gerichte uitleesoptie aan `kassa_instellingen` toe zodat deze controle geen klanten, bedrijfsstructuur of orders opvraagt.
- Voeg een kleine lokale test naast de functie toe voor exacte route, één GET en foutstatus. Rol alleen `eilandbezorger-beheer` uit en voer de gerichte beheeractie uit.
- Alleen bij één ondubbelzinnige geschikte betaalwijze ‘eilandbezorger’: sla `id` en `typeId` op als `lightspeed_betaalwijze_id` en `lightspeed_betaalwijze_type_id` in de bestaande Midsland-rij van `externe_kassa_config`. Lees beide terug. Andere waarden ongemoeid laten.
- Rapporteer naam, IDs en bron; bij fout de feitelijke HTTP-status. Bij 429 geen directe herhaling, bij ambiguïteit niets opslaan.
- Liveverzending blijft uit. Geen testorder, nieuwe betaalwijze of klantmutatie; geen frontendpublicatie.
- **Praktijk/risico:** de koppeling krijgt de juiste bestaande betaalwijze, maar automatisch accepteren/voltooien blijft een afzonderlijke apparaatcontrole in Lightspeed. Een verkeerde match kan betalingen verkeerd boeken; daarom alleen opslaan na één bevestigde match. De vaste klant-ID blijft een aparte voorwaarde voor de fysieke proef.