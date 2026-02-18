

# Plan: Design System Migratie naar Pura Vida OS v6.0

Dit plan vervangt het huidige groene "Polar/Sea" design system door het oranje "Sunset Orange" Pura Vida OS design system uit de geuploadde documentatie.

---

## Wat verandert er

### Kleuren
- **Primary**: Groen (#1B7867) wordt Sunset Orange (#E27726)
- **Gray scale**: Slate wordt Midnight Slate (nieuwe hex waarden: 0:#FFFFFF tot 950:#0F1318)
- **Semantic kleuren**: Blijven grotendeels gelijk (success, warning, error, info)
- **Sidebar**: Witte achtergrond met oranje active states (was: groen)

### Typografie
- **Display font**: Instrument Sans toevoegen (voor titels, headings)
- **Mono font**: Geist Mono toevoegen (voor bedragen, data, IDs)
- **Body font**: Inter blijft (al aanwezig)

### Border Radius
- sm: 12px, md: 14px (buttons/inputs), lg: 16px, xl: 20px (cards), 2xl: 24px (modals)
- Minimaal 12px overal (behalve checkbox 4px)

### Shadows
- Lichtere, subtielere shadows conform het nieuwe systeem
- Focus ring: oranje (rgba(226,119,38,0.2))

---

## Bestanden die worden aangepast

### 1. index.html
- Google Fonts link uitbreiden met Instrument Sans en Geist Mono

### 2. src/index.css
- Alle CSS custom properties (--primary, --accent, --background, etc.) updaten naar oranje palette
- HSL waarden herberekenen voor het nieuwe kleurenschema
- Dark mode variabelen updaten

### 3. tailwind.config.ts
- `pv` namespace kleuren vervangen door nieuwe orange/midnight-slate tokens
- Font families uitbreiden: `display` (Instrument Sans), `mono` (Geist Mono)
- Border radius waarden updaten
- Shadow waarden updaten

### 4. src/components/polar/colors.ts
- Alle kleurconstanten updaten naar het nieuwe palette
- Brand primary: #E27726 (was #1B7867)
- Gray scale naar midnight slate waarden

---

## Wat NIET verandert
- Bestaande component structuur (shadcn/ui, Polar components)
- Routing, hooks, pagina's
- Database en backend
- Functionele logica

---

## Technische Details

### Nieuwe CSS Root Variables (Light Mode)

```text
--primary:        25 76% 52%    (was: 163 65% 26%)     -> #E27726
--primary-hover:  25 88% 42%    (was: 163 65% 21%)     -> #C9630E  
--accent:         25 76% 52%    (wordt zelfde als primary)
--background:     210 17% 98%   -> #F8F9FA (Midnight Slate 50)
--foreground:     218 33% 18%   -> #282E3A (Midnight Slate 800)
--muted:          210 20% 96%   -> #F1F3F5 (Midnight Slate 75)
--border:         220 13% 91%   -> #EAECF0 (Midnight Slate 100)
--ring:           25 76% 52%    -> orange focus ring
```

### Nieuwe Tailwind pv Namespace

```text
pv-primary-50:  #FFF7ED    pv-primary-500: #E27726
pv-primary-600: #C9630E    pv-primary-700: #A5500D
pv-gray-50:     #F8F9FA    pv-gray-100: #EAECF0
pv-gray-200:    #C1C5CF    pv-gray-400: #636878
pv-gray-800:    #282E3A    pv-gray-900: #1A1F28
```

### Font Families

```text
font-sans:    'Inter', system-ui, sans-serif
font-display: 'Instrument Sans', 'Inter', sans-serif
font-mono:    'Geist Mono', 'SF Mono', monospace
```

### Border Radius

```text
polar-sm:  12px (was 8px)
polar-md:  14px (was 12px)  -> buttons, inputs
polar-lg:  16px (was 16px)  -> cards
polar-xl:  20px (was 20px)  -> dropdowns
polar-2xl: 24px (was 24px)  -> modals
```

---

## Opmerking over het DOCX bestand

Het DOCX bestand bevat een ouder groen design system (DM Sans, JetBrains Mono, groene primary). Het JSX v2 bestand is nieuwer (v6.0) en completer. Dit plan volgt het JSX v2 bestand als de autoritatieve bron.

Het kleurpaletten-bestand (teal/sage/emerald vergelijker) is een exploratief document en wordt niet overgenomen - het oranje systeem uit het JSX v2 bestand is de keuze.

