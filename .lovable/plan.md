

# Audit & Fix Plan: Pura Vida OS v6.0 Compliance

## Kritiek Probleem: App Werkt Niet

De hele applicatie is momenteel **onbruikbaar** door een database fout. De `user_roles` tabel heeft RLS-policies die zichzelf aanroepen (oneindige recursie), waardoor elke query naar `user_roles` een 500 error geeft. Zonder deze tabel werkt inloggen, rolcontrole en navigatie niet.

**Fout in database logs:** `infinite recursion detected in policy for relation "user_roles"`

### Oorzaak
1. De SELECT policy "Managers and owners can view roles in same location" doet een subquery op dezelfde `user_roles` tabel
2. De `has_role()` functie doet ook een query op `user_roles`, waardoor INSERT/UPDATE/DELETE policies ook recursie veroorzaken

### Fix (database migratie)
- Verwijder de problematische policies
- Maak de `has_role()` functie opnieuw aan met `SECURITY DEFINER` (omzeilt RLS)
- Maak nieuwe policies die `auth.uid()` direct vergelijken zonder subqueries op dezelfde tabel, of die de `SECURITY DEFINER` functie gebruiken

---

## Visuele Audit: Bevindingen

### 1. Legacy kleur #73747B (188 voorkomens in 13 bestanden)
De oude secondary text kleur `#73747B` moet worden vervangen door de v6.0 Midnight Slate equivalenten:
- `#73747B` wordt `#636878` (gray-400) voor secondary text
- Of `#8D93A0` (gray-300) voor tertiary/placeholder text

**Bestanden met legacy kleuren:**
- `src/components/polar/KPICard.tsx`
- `src/components/polar/Dialog.tsx`
- `src/components/polar/FormCard.tsx`
- `src/components/polar/DatePicker.tsx`
- `src/pages/StyleGuide.tsx`
- `src/components/AppSidebar.tsx` (in de code dialog: `color: '#73747B'`)
- Plus 7 andere bestanden

### 2. ServiceTasks component (`src/components/service/ServiceTasks.tsx`)
Dit component gebruikt Shadcn defaults in plaats van v6.0 inline styling:
- Badge gebruikt `bg-green-100 text-green-600` (Tailwind generic) in plaats van v6.0 status kleuren
- Geen Instrument Sans voor titels
- Emoji `📅` gebruikt in plaats van Lucide icoon (Calendar)
- Geen loading skeleton state (toont alleen "Laden..." tekst)
- TabsList met `bg-white` class in plaats van v6.0 segmented control styling

### 3. ServiceModule (`src/pages/service/ServiceModule.tsx`)
- Gebruikt `KitchenLayout` in plaats van `SidebarLayout`
- Staat niet in de router (`App.tsx`) - is een dood component
- TabsList met generieke styling

### 4. AppSidebar code dialog
- Knop radius `20px` in plaats van `14px` (buttons = 14px per spec)
- Border kleur `rgba(197, 197, 202, 0.5)` (legacy) in plaats van `#C1C5CF` of `#D5D8E0`

### 5. Dashboard StatCard
- `translateY(-1px)` hover op kaarten is correct per spec (klikbare cards mogen hover lift)
- Verder v6.0 compliant

---

## Implementatieplan

### Stap 1: Database RLS Fix (kritiek)
SQL migratie uitvoeren:
- `has_role()` herschrijven als `SECURITY DEFINER` functie
- Oude SELECT policy vervangen door twee simpele policies:
  - "Users can view own role" (bestaand, correct)
  - "Admins can view all roles" met `SECURITY DEFINER` functie
- INSERT/UPDATE/DELETE policies opnieuw aanmaken met de nieuwe functie

### Stap 2: Legacy kleur cleanup (#73747B)
Vervang alle 188 voorkomens van `#73747B` door de juiste v6.0 equivalenten in alle 13 bestanden.

### Stap 3: ServiceTasks v6.0 restyle
- Badge: gebruik v6.0 status badge kleuren
- Vervang emoji door Lucide Calendar icoon
- Voeg skeleton loading state toe
- Tabs: v6.0 segmented control styling

### Stap 4: AppSidebar dialog fix
- Button radius: `20px` naar `14px`
- Border kleuren: legacy naar v6.0 Midnight Slate

### Stap 5: Verificatie
- Inloggen als pura mids
- Alle pagina's doorlopen en screenshots maken
- Controleren op resterende legacy elementen

---

## Technische Details

### Database migratie SQL (Stap 1)

```text
-- 1. Drop problematische policies
DROP POLICY IF EXISTS "Managers and owners can view roles in same location" ON user_roles;
DROP POLICY IF EXISTS "Owners can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can update roles" ON user_roles;

-- 2. Recreate has_role as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND is_active = true
  )
$$;

-- 3. Admin/manager SELECT policy (no recursion)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 4. Recreate mutation policies
CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
```

### Kleur mapping (Stap 2)
- `#73747B` (secondary text) wordt `#636878` (Midnight Slate 400)
- `rgba(197, 197, 202, 0.5)` (legacy border) wordt `#D5D8E0` (gray-150)
- `#17171C` (legacy dark) wordt `#282E3A` (gray-800)

