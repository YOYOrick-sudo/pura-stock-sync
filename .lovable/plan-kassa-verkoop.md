# Plan: verkoop per product per dag (Lightspeed)

Status: gebouwd 29 okt 2026.

1. Test: `GET /resto/rest/financial/receipt` bevat `items[]` per bon (prodId, productId/PLU, productName, amount, totalPrice, totalPriceWithoutVat, discountPrice, …). Geen detail-endpoint nodig.
2. Tabel `kassa_verkoop_dag` (vestiging, datum, lightspeed_product_id = prodId, productnaam, aantal, omzet_excl, omzet_incl, updated_at), uniek op (vestiging, datum, product). RLS lezen zoals `omzet_uren`; schrijven alleen service role.
3. `lightspeed-sync` runSync: na `omzet_uren` ook verkoop voor volledig opgehaalde werkdagen (werkdag tot alleen als tot = vandaag). Upsert + oude rijen van die dagen verwijderen (vervangen, nooit optellen).
4. `type: backfill_verkoop`: één chunk van 7 dagen per aanroep vanaf 2025-01-01, cursor in `sync_runs.state`, haalt 1 extra dag op voor na-middernacht-bonnen, gebruikt job-lease per vestiging. Raakt `omzet_uren` niet.
5. Geen UI.
