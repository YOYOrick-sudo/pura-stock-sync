## Probleem
De sidebar zit aan de onderkant tegen het scherm geplakt — geen grijze marge zoals bovenaan. Oorzaak: de wrapper in `SidebarLayout.tsx` voegt `paddingTop: 16px` toe boven op de eigen `margin: 12px 0 12px 12px` van de sidebar én `height: calc(100vh - 24px)`. Totaal wordt > 100vh, dus de onderkant valt buiten beeld.

## Fix
Symmetrische "zwevende" rail met gelijke ruimte boven én onder.

**`src/components/SidebarLayout.tsx`** (regel 50)
- Verwijder `paddingTop: '16px'` van de sticky wrapper. Wrapper blijft `position: sticky; top: 0; height: 100vh; align-self: flex-start`.

**`src/components/polar/Sidebar.tsx`** (regel ~112-115)
- `height: calc(100vh - 24px)` blijft.
- `margin: '12px'` (gelijk rondom: top 12, bottom 12, left 12, right 12) i.p.v. `'12px 0 12px 12px'` — geeft ook ademruimte tussen sidebar en content.

Resultaat: 12px grijze ruimte boven, onder, links en rechts van de sidebar-card — perfect symmetrisch zoals in het voorbeeld.