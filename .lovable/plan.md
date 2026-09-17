# Overdracht automatisch opslaan + MEP-venster sluit met opslaan

## Deel 1 — Overdracht: automatisch opslaan, alleen een subtiele wisknop

## Wat er verandert

Nu moet je op "Opslaan" of "Annuleren" drukken (of uit het veld klikken) voordat de overdracht echt bewaard is. Dat wordt:

1. **Automatisch opslaan.** Tijdens het typen wordt de tekst na een korte pauze (ongeveer 1,5 seconde stilte) vanzelf opgeslagen. Ook bij het verlaten van het veld en bij het sluiten van de app wordt wat er staat bewaard.
2. **Knoppen weg.** "Opslaan" en "Annuleren" verdwijnen. Er blijft één subtiele wisknop over, die alleen zichtbaar is zolang je in het tekstveld staat en er tekst staat. Daarmee begin je opnieuw met een leeg veld; dat wordt ook meteen opgeslagen.
3. **Statusregel.** Onderin blijft "Laatst bijgewerkt: ..." staan; tijdens het opslaan staat er kort "Opslaan...", daarna "Opgeslagen".
4. **Concept blijft.** Het bestaande lokale concept (bescherming bij vastlopen) blijft werken en wordt gewist zodra opslaan gelukt is.

## Wat dit in de praktijk doet

- Teamlid typt tijdens de dienst en hoeft nergens meer op te drukken — tekst is nooit meer kwijt door vergeten opslaan.
- Meerdere tablets: de overdracht wordt nog steeds live bijgewerkt. Om te voorkomen dat halve zinnen over en weer springen, wordt het veld op een tablet waar iemand actief typt niet overschreven door de serverversie; zodra je klaar bent en het veld verlaat, geldt weer de laatst opgeslagen tekst.
- Wisknop is bewust klein en alleen zichtbaar tijdens het typen, zodat niemand hem per ongeluk raakt. Tikdoel blijft minimaal 44px.
- Risico: vaker schrijven naar de database. Door alleen op te slaan bij een pauze én alleen als de tekst echt veranderd is, blijft dat een paar regels per dienst.

## Techniek

- Alleen `src/components/HandoverCard.tsx`. Geen database-, RLS- of routewijzigingen, geen nieuwe pakketten.
- Debounced autosave (1500 ms) op `memoText`, plus opslaan bij `blur` en bij `visibilitychange`/`pagehide`.
- Insert in `handover_memos` blijft ongewijzigd; alleen bij daadwerkelijke verandering t.o.v. laatst opgeslagen tekst.
- `isEditing` (focus) stuurt zowel het onderdrukken van de serversync als de zichtbaarheid van de wisknop.
- Opslagstatus als lokale state (`idle | saving | saved`) in plaats van toasts, om ruis tijdens het typen te voorkomen.

## Deel 2 — Mise en place: venster sluiten door ernaast te tikken slaat op

Nu sluit het venster waarin je handeling, persoon, prioriteit en aantal instelt alleen via het kruisje of "Opslaan". Tik je ernaast, dan gaat het dicht en zijn je keuzes weg.

Nieuw gedrag: tikken naast het venster (of Escape) **bewaart** eerst de gemaakte keuzes en sluit daarna. Precies hetzelfde als op "Opslaan" drukken. Het kruisje doet hetzelfde. Is er niets veranderd, dan sluit het gewoon zonder schrijfactie.

Praktijk: in de keuken tikt men vaak naast een venster om het weg te krijgen. Dat mag geen werk kosten. Risico is klein — de enige verandering is dat wegtikken bewaart in plaats van weggooit; niets wordt verwijderd.

Techniek: alleen `src/components/kitchen/MepTaakBewerken.tsx`. Eén gedeelde afsluitfunctie die bij wijziging `onOpslaan` aanroept en daarna sluit, aangehangen aan `onOpenChange`, `onPointerDownOutside`, `onEscapeKeyDown` en de Opslaan-knop. Dubbele opslag voorkomen met de bestaande `bezig`-vlag.

## Verificatie

- Typen in overdracht → niets aanraken → na pauze verschijnt "Opgeslagen"; herladen toont de tekst.
- Wisknop alleen zichtbaar met focus in het veld en tekst aanwezig; klikken maakt leeg en slaat leeg op.
- Tweede tablet ziet de bijgewerkte tekst; typen wordt niet onderbroken.
- MEP-taak openen, handeling + persoon kiezen, naast het venster tikken → venster dicht, keuzes staan op de taak.
- MEP-taak openen en direct ernaast tikken → dicht, geen wijziging.
- Build groen.
