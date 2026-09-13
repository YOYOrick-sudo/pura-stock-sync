# Dagbeoordeling na kassasluiting ("Hoe was de dag?")

## Doel
Na het versturen van de sluit-kassatelling verschijnt een korte, snelle vragenlijst: hoe druk was ontbijt / lunch / diner? Keuze uit **Rustig – Gemiddeld – Druk** per moment. Zo bouwen jullie een historie op van drukte per dag, later te koppelen aan omzet en bezetting (sluit aan bij de bezetting-vs-omzet-analyse).

## Waarom zo
- Invullen kost 3 tikken; verplichten frustreert, dus **overslaan kan altijd**.
- Apart van de kassatelling zelf: de telling blijft puur financieel, de beoordeling is een losse laag.
- Opgeslagen per dag + vestiging, zodat het later analyseerbaar is (per weekdag, seizoen, moment van de dag).

## Wat er komt

### 1. Nieuwe tabel `dag_beleving`
- Kolommen: `id`, `date`, `location`, `ontbijt` / `lunch` / `diner` (tekst: rustig | gemiddeld | druk, mag leeg), `notitie` (optioneel, kort), `created_by`, `created_at`.
- Uniek op (date, location) — opnieuw invullen overschrijft, geen dubbele rijen.
- RLS: invoeren voor ingelogden van de eigen vestiging; lezen voor owner/manager.
- Migratie met GRANTs volgens de standaard.

### 2. Popup na succesvol versturen sluit-telling (`Kassa.tsx`)
- Verschijnt ná het bestaande succesvenster (of erin verwerkt als extra stap).
- Drie rijen (Ontbijt / Lunch / Diner) met elk drie grote tikknoppen: Rustig / Gemiddeld / Druk — kleurcodering (groen/oranje/rood uit het design system).
- Knoppen "Opslaan" en "Overslaan". Minimaal 44px tikdoelen (keuken-iPad-norm).
- Alleen bij **sluit**-telling, niet bij openen (dan is de dag nog niet geweest).
- Wifi-hapering: mislukt opslaan, dan rustige melding — de kassatelling zelf is al veilig opgeslagen.

### 3. Zichtbaar in Kas-controle
- Bij de dagregel in Kas-controle (de nieuwe gegroepeerde weergave) tonen we de drie beoordelingen als kleine chips (bijv. O: druk · L: gemiddeld · D: rustig).
- Later (aparte stap) koppelen aan omzet/bezetting — nu alleen vastleggen en tonen.

## Bewust niet in deze stap
- Geen verplichte velden, geen extra schermen in het telproces zelf.
- Geen analyse- of grafiekscherm nog; eerst data verzamelen.
- Geen wijziging aan het telproces of de verzendlogica (met timeout) zelf.

## Risico's en praktijk
- Risico: team slaat het structureel over → data gaten. Acceptabel; beter dan verplichten in een drukke avond.
- Risico: meerdere tellers op één dag → upsert op (date, location) voorkomt dubbele rijen; laatste invoer geldt.
- Praktijk: wie sluit, beoordeelt — dat is de persoon die de dag heeft meegemaakt.

## Technische aanpak
- 1 migratie: `create table public.dag_beleving` + GRANTs + RLS + unique constraint.
- `src/pages/Kassa.tsx`: na geslaagde insert de beoordelingsstap tonen; upsert in `dag_beleving`.
- `src/pages/KasControle.tsx`: dagregels verrijken met beoordeling (join op date+location in de bestaande query, client-side samenvoegen).
- Verificatie: typecheck + build; daarna in preview een sluit-telling versturen (testvestiging) en controleren dat de popup komt, opslaan werkt, overslaan werkt, en Kas-controle de chips toont.

## Standaardisatie-suggestie (één)
Maak er een vaste afsluiter van de dienst: degene die de kassa sluit tikt ook de dagbeoordeling aan. Dan groeit de historie vanzelf mee zonder extra vergaderingen of papieren formulieren.
