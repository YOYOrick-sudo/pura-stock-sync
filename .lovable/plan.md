# Iets groter en beter leesbaar op de iPad

## Wat er verandert
- **Vinkvakjes iets groter** in de hele takenlijst (gewone taken én sluitronde): 20px wordt 24px op iPad/desktop, 24px wordt 26px op telefoon. Tikvlak blijft 44px.
- **Titels iets groter**: taaknaam en productnaam van 15px naar 16px, overal gelijk. De grijze regel eronder van 12px naar 13px.
- **"Naar MEP" en "Bron op" als kleine kaart**: lichte achtergrond, ronde hoeken (14px), dunne rand, icoon + tekst, 44px hoog. "Naar MEP" met een groene tint (taak voor morgen), "Bron op" met een neutrale grijze kaart. Ze vallen op, maar zijn niet zo zwaar als de oude grote knoppen.
- "Herstel" blijft een rustige tekstknop.

## Wat niet verandert
Werking, volgorde, database en kleuren uit het design system blijven hetzelfde. Alleen opmaak.

## Technisch
- `FohTasks.tsx` taakrij: checkbox-span 20→24 (desktop) / 24→26 (mobiel), vinkje-svg mee schalen, titel fontSize 15→16.
- `AfvinkRonde.tsx`: vakje `sm:h-6 sm:w-6`, mobiel `h-[26px] w-[26px]`; naam `text-[16px]`, uitleg `text-[13px]`; MEP-knop `rounded-[14px] border border-primary/20 bg-primary/10 text-primary`, Bron op `rounded-[14px] border border-border bg-muted/60 text-foreground`, beide `h-11 px-3`.
- Verificatie: screenshot iPad (1024px) en telefoon (402px) van Sluiten-tab Keuken West.
