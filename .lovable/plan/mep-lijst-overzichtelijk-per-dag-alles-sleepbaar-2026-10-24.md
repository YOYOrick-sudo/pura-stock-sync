# MEP-lijst: overzichtelijk per dag, alles sleepbaar

## Wat het team ziet
- "Alle taken" wordt opgedeeld in rustige dagblokken, in deze volgorde:
  - **Te laat** (rood kopje, alleen als er iets openstaat van eerdere dagen)
  - **Vandaag** (met eigen teller, bijv. 4/9)
  - **Zondag 25 okt**, **Woensdag 28 okt**, enz. — één kopje per dag
- Het datum-labeltje op elke rij ("Zondag 25 Okt.") verdwijnt: de dag staat al in het kopje. Rijen worden daardoor korter en rustiger.
- Elke taak is sleepbaar via het greepje links, ook die van andere dagen:
  - Slepen binnen een dag = volgorde aanpassen.
  - Slepen naar een ander dagblok = taak verplaatsen naar die dag (bijv. ei koken van zondag naar vandaag). Korte melding: "Ei koken staat nu op vandaag".
- Lege dagen krijgen geen blok; "Afgerond" blijft onderaan, ingeklapt-rustig zoals nu.
- Rijen: naam groter en vetter, handeling en aantal als één grijze regel eronder ("Bereiden · 1 stuks"), prullenbak kleiner en minder rood zodat het groene afvinkvak de duidelijkste knop is. Tikdoelen blijven minstens 44px.
- Per persoon en Per handeling blijven zoals nu (wel zonder het datumlabel; daar blijft een klein daglabel staan omdat er geen dagkopjes zijn).

## Praktijk
- Kok op de iPad ziet direct wat vandaag moet en wat later komt, zonder elke rij te lezen.
- Risico: per ongeluk een taak naar een andere dag slepen. Oplossing: melding met "Ongedaan maken".
- Verplaatsen naar een gesloten dag kan niet: dat blok bestaat niet in de lijst.
- Voortgang bovenaan blijft alleen vandaag tellen.

## Technisch
- `src/pages/kitchen/MepDag.tsx`: in weergave "alles" groepen bouwen per `taak_datum` (te laat / datum / latere data). Eén `DndContext` over alle dagblokken met een `SortableContext` per blok en droppable blok-koppen; bij drop in ander blok `bijwerken({ id, taak_datum, volgorde })`, binnen blok `herordenen`.
- `TaakRij`: datumbadge alleen tonen buiten "alles"-weergave; layout naam + subregel; sleepbaar voor alle open taken.
- `useMepTaken` mutatie `bijwerken` hergebruiken (verwerkt al verschuiving van datum in de cache); geen database- of RLS-wijziging.
- Toast met ongedaan maken zet oude `taak_datum`/`volgorde` terug.

## Verificatie
- Build groen; op iPad-formaat: dagkopjes zichtbaar, slepen binnen vandaag, slepen van zondag naar vandaag, ongedaan maken, testtaak daarna opruimen.
