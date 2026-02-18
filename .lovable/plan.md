
# Fix: Dubbele Header, Takenlijst Zichtbaarheid & Sidebar Items Verbergen

## 1. Dubbele header op HR Inbox (`/hr`)

**Probleem:** De `HrInbox` pagina zit in `SidebarLayout` (die een `PolarHeader` rendert met titel), en heeft daarnaast een eigen `<h1>HR Inbox</h1>` header. Dat geeft twee headers.

**Oplossing:** Verwijder de eigen header uit `HrInbox.tsx` (de h1 + subtitle + button row). De PolarHeader toont al de paginatitel. De "Nieuwe Kandidaat" button verplaatsen we naar boven de quick stats. Daarnaast moet `/hr` toegevoegd worden aan de titles map in `SidebarLayout.tsx` zodat "HR Inbox" als titel verschijnt.

---

## 2. Takenlijst elementen niet goed zichtbaar

**Probleem:** Uit de session replay blijkt dat taken als loading skeletons (`animate-pulse`) worden getoond en niet laden. Dit komt waarschijnlijk doordat de ingelogde gebruiker geen data terugkrijgt (RLS of query issue). Dit is een data/auth probleem, geen styling issue.

**Oplossing:** Controleren of de takenlijst correct laadt na inloggen. Geen codewijziging nodig tenzij er een bug in de query zit.

---

## 3. Rooster verbergen uit sidebar

**Oplossing:** Verwijder het "Rooster" item uit `allNavigationItems` in `AppSidebar.tsx`. De route `/rooster` blijft bestaan maar is niet meer zichtbaar in de sidebar.

---

## 4. HR Inbox verbergen uit sidebar

**Oplossing:** Verwijder het "HR Inbox" item uit `allNavigationItems` in `AppSidebar.tsx`. De route `/hr` blijft bestaan maar is niet meer zichtbaar in de sidebar.

---

## Technische details

### Bestand 1: `src/components/AppSidebar.tsx`
- Verwijder het object met `title: 'Rooster'` (regels 51-56)
- Verwijder het object met `title: 'HR Inbox'` (regels 57-62)

### Bestand 2: `src/components/SidebarLayout.tsx`
- Voeg `/hr` toe aan de `titles` map (voor het geval iemand direct navigeert): `'/hr': 'HR Inbox'`

### Bestand 3: `src/pages/hr/HrInbox.tsx`
- Verwijder de dubbele header-sectie (regels 28-37: de flex row met h1 "HR Inbox" en de "Nieuwe Kandidaat" button)
- Verplaats de "Nieuwe Kandidaat" button naar boven de quick stats grid, als losse row
