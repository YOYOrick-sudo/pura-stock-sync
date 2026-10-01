# Zijbalk op de iPad stabiel maken

## Wat er nu misgaat (gevonden in de code)
1. **Te hoog voor het scherm.** De zijbalk rekent met `100vh`. In Safari op de iPad is dat de hoogte *zonder* adresbalk en tabbalk, dus de zijbalk is groter dan het zichtbare deel. Onderaan vallen de uitlogknop en de dag/nacht-knop dan buiten beeld. Ook de veilige randen (statusbalk, thuisbalk) worden niet meegerekend.
2. **Ineens weg.** De app wisselt hard tussen "vaste zijbalk" en "menu-knop" op precies 744px breedte. Een iPad mini staand is exact 744px; bij Split View, Slide Over, draaien of terugkomen uit de achtergrond meldt Safari soms kort een kleinere breedte. Dan verdwijnt de zijbalk en verschijnt het hamburger-menu, soms zonder terug te springen.
3. **Inklapstand vergeten.** Ingeklapt/uitgeklapt wordt per pagina opnieuw gestart, dus na elke navigatie springt hij weer open (voelt als "verspringen").

## Wat ik ga doen
- Hoogte op het **echte zichtbare scherm** baseren (`100dvh`) en de veilige randen boven en onder meetellen, zodat de onderste knoppen altijd in beeld zijn. Menu-lijst blijft zelf scrollbaar als er veel items zijn.
- **Stabiele schermbreedte-detectie**: één meetpunt (`matchMedia`), kleine marge zodat iPad mini staand (744px) betrouwbaar de zijbalk houdt, en korte demping zodat een tijdelijke breedte-sprong bij terugkomen uit de achtergrond of draaien niet de layout omgooit.
- **Inklapstand onthouden** op het apparaat, zodat hij blijft zoals je hem zet.
- Op smalle iPad-breedte (staand, 744–900px) de zijbalk standaard ingeklapt (alleen iconen), zodat de takenlijst genoeg ruimte houdt.

## Testen
Live in de preview op iPad mini staand (744×1133), iPad staand (820×1180) en liggend (1180×820), plus telefoon (390px): zijbalk past volledig, uitlogknop zichtbaar, geen wisseling bij draaien/resize, inklapstand blijft na navigeren.

## Technisch
- `src/components/polar/Sidebar.tsx`: height `calc(100dvh - 24px - var(--safe-top) - var(--safe-bottom))`, top/margin met safe-top.
- `src/components/SidebarLayout.tsx`: wrapper `100dvh`.
- `src/hooks/use-mobile.tsx`: matchMedia-gebaseerd, debounce ~150ms, negeert resize terwijl `document.hidden`.
- `src/components/AppSidebar.tsx`: collapsed in localStorage; default ingeklapt < 900px.
- Geen data- of logica-wijzigingen.
