# MEP-beheer naar Instellingen

De MEP-module blijft gewoon zichtbaar in de zijbalk onder Keuken (net als de andere modules). Alleen het *beheer* (templates, handelingen, open dagen) verhuist naar Instellingen, zodat beheer overal op dezelfde plek zit.

## Wat er verandert

- Nieuwe route `/settings/mep` met exact het huidige beheerscherm (tabs Templates / Handelingen / Open dagen).
- Oude route `/kitchen/mep/beheer` blijft werken als redirect naar `/settings/mep`, zodat bestaande links en bladwijzers niet breken.
- Op de instellingenpagina komt onder "Beheer" een derde regel: **Mise-en-place** — "Templates, handelingen en open dagen per vestiging", met hetzelfde rij-ontwerp als Team en Bronnen & sync.
- Op `/kitchen/mep` blijft de beheerknop staan, maar die navigeert naar `/settings/mep`. De planningspagina zelf verandert verder niet.

## Praktijk

Keukenmedewerkers werken alleen in de planning; die verandert niet. Wie een template of gesloten dag wil aanpassen gaat via Instellingen — één vaste plek voor alle beheer, ook voor een nieuw teamlid te vinden zonder uitleg. Geen datawijziging, geen risico voor bestaande MEP-regels.

## Technisch

- `src/pages/kitchen/MepBeheer.tsx` verplaatsen naar `src/pages/settings/Mep.tsx` (inhoud ongewijzigd, alleen terug-navigatie naar `/settings`).
- `src/App.tsx`: route `/settings/mep` toevoegen binnen `ProtectedRoute` (zelfde guardniveau als `/settings/bronnen`); `/kitchen/mep/beheer` wordt een `<Navigate to="/settings/mep" replace />`.
- `src/pages/Settings.tsx`: link toevoegen in de Beheer-kaart.
- `src/pages/kitchen/MepPlanning.tsx`: `navigate('/kitchen/mep/beheer')` → `navigate('/settings/mep')`.
- Zijbalk (`AppSidebar.tsx`) blijft ongewijzigd: Mise-en-place staat er al als module.
