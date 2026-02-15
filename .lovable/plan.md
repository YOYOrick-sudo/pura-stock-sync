

# Plan: Restyle Dashboard volgens Pura Vida OS v6.0

## Overzicht

De Dashboard pagina wordt volledig hergestyled. De huidige cards gebruiken `PolarKPICard` met oranje achtergronden (#FFF7ED) en missen de v6.0 stat card specificaties (witte achtergrond, border, accent bar, icon container). De pagina mist ook een page header.

---

## Wijzigingen

### 1. `src/pages/Dashboard.tsx` - Volledig herschrijven render + card componenten

**Page Header toevoegen:**
- Titel: "Dashboard" - 24px/700 Instrument Sans, kleur #1A1F28, letter-spacing -0.02em
- Subtitel: locatie naam + huidige datum - 14px Inter, kleur #636878
- Border-bottom 1px #D5D8E0, paddingBottom 20px

**Stat Cards vervangen (DashboardCard, VoorraadCard, DeliveryCard):**
- Verwijder PolarKPICard dependency voor deze cards
- Nieuwe inline stat card styling conform v6.0 spec:
  - Container: bg white, border 1px #D5D8E0, radius 20px, shadow-sm
  - 3px accent bar bovenaan (full-width, vlakke kleur per card)
  - Icoon container: 36x36px, radius 12px, vlakke bg (12% opacity van accent), icoon 18px
  - Label: 12px/500 Inter uppercase, kleur #636878, tracking 0.03em
  - Waarde: 28px/700 Instrument Sans, kleur #1A1F28, tracking -0.03em
  - Content tekst: 13px Inter #303542
  - Hover: shadow-md + translateY(-1px), transition 0.15s (alleen klikbare cards)
- Accent kleuren per card:
  - Openstaande Taken: primary (#E27726)
  - Weer: info (#3B82F6)
  - Bestellingen/Telling/Levering: warning (#F59E0B)

**Layout aanpassen:**
- max-w-7xl vervangen door max-width: 1200px, margin: 0 auto
- Padding: 32px horizontaal, 28px verticaal
- Grid gap: 14px (conform stat card grid spec)
- Secties gap: 40px

### 2. `src/components/dashboard/WeatherWidget.tsx` - Restyle

- Achtergrond: wit (#FFFFFF) ipv #FFF7ED
- Border: 1px solid #D5D8E0
- Radius: 20px
- Shadow-sm
- 3px accent bar bovenaan (kleur #3B82F6 - info)
- Icoon container: 36x36px, radius 12px, bg rgba(59,130,246,0.12)
- Label: 12px/500 uppercase Inter, tracking 0.03em, kleur #636878
- Temperatuur waarde: 28px/700 Instrument Sans, kleur #1A1F28
- Wind/neerslag tekst: 13px Inter #636878
- Hover: shadow-md + translateY(-1px)

### 3. `src/components/HandoverCard.tsx` - Restyle

- Achtergrond: wit (#FFFFFF) ipv #FFF7ED
- Border: 1px solid #D5D8E0
- Radius: 20px
- Shadow-xs (lichter dan stat cards)
- Padding: 20px
- Titel: 14px/600 Inter #282E3A
- Subtitel: 12px Inter #636878 (ipv #73747B)
- Bericht tekst: 13px Inter #303542 (ipv 15px)
- Timestamp: 12px Inter #636878

---

## Technische details

### Verwijderde dependencies
- `PolarKPICard` import wordt verwijderd uit Dashboard.tsx (component blijft bestaan voor ander gebruik)

### Kleur vervanging
Alle oude kleuren worden vervangen:
- #73747B wordt #636878 (gray-400)
- #36373A wordt #303542 (gray-700)
- #17171C wordt #1A1F28 (gray-900)
- #ECEDED wordt #EAECF0 (gray-100)
- Alle `bg: '#FFF7ED'` op cards wordt `bg: '#FFFFFF'` met border

### Geen wijzigingen aan
- Data queries en realtime subscriptions blijven ongewijzigd
- Business logica (quotes, helpers) blijft ongewijzigd
- PolarKPICard component zelf wordt niet gewijzigd (gebruikt elders)
- SidebarLayout wrapper blijft

