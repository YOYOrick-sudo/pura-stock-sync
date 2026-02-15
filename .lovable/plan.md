
# Fix: Dashboard Flikkering Stoppen

## Probleem
Er zijn twee Supabase clients actief die allebei auth state bijhouden, wat een race condition veroorzaakt (pagina springt continu heen en weer).

## Oplossing (2 kleine wijzigingen)

### 1. `src/pages/foh/FohAnalytics.tsx`
- Verander import van `'@/lib/supabase'` naar `'@/integrations/supabase/client'`

### 2. Verwijder `src/lib/supabase.ts`
- Dit duplicaat bestand wordt nergens meer gebruikt na stap 1

## Gebruikersaccounts
De accounts "pura west" en "pura mids" zitten veilig in de database en worden **niet** aangeraakt. Dit verwijdert alleen een dubbel code-bestand dat de flikkering veroorzaakt.
