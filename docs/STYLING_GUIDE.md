# Pura Vida Styling Conventions

## Border Radius Standaarden

### Hiërarchie Overzicht

| Type | Token | Waarde | Gebruik |
|------|-------|--------|---------|
| Page sections | `rounded-polar-xl` | 20px | Grote container-panels, modals |
| **Regular cards** | `rounded-polar-lg` | **16px** | Alle cards (KPI, Order, Task, etc.) |
| Inner layers | `rounded-polar-md` | 12px | Icon boxes, geneste elementen, buttons |
| Small elements | `rounded-polar-sm` | 8px | Sidebar items, badges, chips |

---

## 🎯 Cards (16px = rounded-polar-lg)

**Alle reguliere cards gebruiken `rounded-polar-lg` (16px):**
- KPI cards
- Order cards
- Task cards
- Reservation cards
- Staff cards
- Form cards
- Setup cards
- Handover cards
- Content cards
- Alert cards

```tsx
// ✅ Correct - Tailwind token
<div className="rounded-polar-lg">

// ✅ Als inline style nodig is
style={{ borderRadius: '16px' }}

// ❌ Vermijd - inconsistent
<div className="rounded-xl">  // = 12px (verkeerd)
<div className="rounded-2xl"> // = 16px maar niet semantic
```

---

## 📦 Inner Layers (12px = rounded-polar-md)

**Geneste elementen binnen cards:**
- Icon containers
- Chart containers  
- Button elements
- Interactive sub-elements

```tsx
// ✅ Correct
<div className="rounded-polar-md">

// ❌ Vermijd
<div className="rounded-lg">
```

---

## 🏔️ Large Panels (20px = rounded-polar-xl)

**Alleen voor grote containers:**
- Modals
- Full-width page sections
- Feature hero cards

---

## 📝 Small Elements (8px = rounded-polar-sm)

**Compacte interactieve elementen:**
- Sidebar menu items
- Small badges
- Chips
- Tooltips

---

## ❌ NOOIT inline styles gebruiken zonder reden!

```typescript
// ❌ Vermijd random waardes:
style={{ borderRadius: '14px' }}  // Niet standaard
style={{ borderRadius: '10px' }}  // Niet standaard
style={{ borderRadius: '24px' }}  // Niet in systeem

// ✅ Gebruik Tailwind classes (preferred):
className="rounded-polar-xl"      // 20px - grote panels
className="rounded-polar-lg"      // 16px - cards ⭐
className="rounded-polar-md"      // 12px - inner layers
className="rounded-polar-sm"      // 8px - kleine elementen

// ✅ Als inline style nodig is, gebruik standaard waardes:
style={{ borderRadius: '20px' }}  // polar-xl
style={{ borderRadius: '16px' }}  // polar-lg (cards)
style={{ borderRadius: '12px' }}  // polar-md
style={{ borderRadius: '8px' }}   // polar-sm
```

---

## Best Practices

1. **Gebruik Tailwind classes waar mogelijk** - Dit zorgt voor consistentie en maakt het gemakkelijker om aanpassingen te maken
2. **Alleen inline styles voor dynamische waardes** - Bijvoorbeeld wanneer de border-radius afhankelijk is van een prop
3. **Documenteer afwijkingen** - Als je om een goede reden moet afwijken van deze standaarden, leg het uit in een comment
4. **Check bestaande componenten** - Kijk naar vergelijkbare componenten in de codebase voor consistentie
5. **16px is de default voor cards** - Bij twijfel, gebruik `rounded-polar-lg`

---

## 🔲 Border Standaarden

### Border Dikte Hiërarchie

| Type | Dikte | Tailwind Class | Gebruik |
|------|-------|----------------|---------|
| Default | 1px | `border` | Cards, inputs, dividers |
| Emphasis | 1.5px | `border-1.5` | Speciale nadruk (optioneel) |
| Strong | 2px | `border-2` | Geselecteerde items, focus states |

### Border Kleur Hiërarchie

| Context | Tailwind Class | Gebruik |
|---------|----------------|---------|
| Default | `border-border` | Standaard cards, containers |
| State containers | `border-border-state` | Empty/error/loading states |
| Subtle accent | `border-subtle` / `border-primary/10` | Subtiele brand hint |
| Active/Focus | `border-accent` / `border-primary/20` | Active tabs, selected items |
| Hover | `border-strong` / `border-primary/30` | Hover states |
| Primary | `border-primary` | Geselecteerde/actieve items |

### Per Component Type

| Component | Default Border | Hover Border | Active Border |
|-----------|---------------|--------------|---------------|
| Cards | `border border-border` | `hover:border-strong` | - |
| Tab item (active) | - | - | `border border-accent` |
| Inputs | `border border-border` | `hover:border-strong` | `focus:border-primary` |
| Dialogs/Modals | `border border-border` | - | - |
| Buttons (outline) | `border border-border` | `hover:border-strong` | - |

### ❌ Vermijd hardcoded borders

```tsx
// ❌ Vermijd - hardcoded hex colors
className="border-[#1B7867]/20"
className="border-[#E2E8F0]"

// ✅ Correct - gebruik semantic tokens
className="border-primary/20"    // of border-accent
className="border-primary/10"    // of border-subtle
className="border-primary/30"    // of border-strong
className="border-border"        // standaard border
className="border-border-state"  // state containers
```

---

## 🎨 Icon Sizes

| Context | Size | Tailwind Class |
|---------|------|----------------|
| Navigation | 20px | `w-5 h-5` |
| Buttons | 16px | `w-4 h-4` |
| KPI/Cards | 20-24px | `w-5 h-5` / `w-6 h-6` |
| Inline text | 16px | `w-4 h-4` |
| Status dots | 6-8px | `w-1.5 h-1.5` / `w-2 h-2` |

---

## 🔄 Interactive States Hiërarchie

| State | Background | Border | Extra |
|-------|------------|--------|-------|
| Default | `transparent` / `bg-card` | `border-border` | - |
| Hover | `bg-pv-bg-hover` | `border-primary/30` | - |
| Active/Selected | `bg-primary` | `border-primary` | `shadow-sm` |
| Focus | - | - | `ring-2 ring-primary/50` |
| Disabled | - | - | `opacity-50` |

```tsx
// ✅ Correct hover pattern
className="hover:bg-pv-bg-hover hover:border-primary/30 transition-colors duration-200"

// ✅ Correct active pattern
className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-primary/20"

// ✅ Focus ring (use .focus-ring class or inline)
className="focus-ring"
// of
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
```

---

## ⏱️ Transition Durations

| Type | Duration | Tailwind Class | Gebruik |
|------|----------|----------------|---------|
| Fast | 150ms | `duration-fast` | Hovers, micro-interactions |
| Default | 200ms | `duration-200` | Standard UI changes |
| Slow | 300ms | `duration-slow` | Larger animations, modals |

```tsx
// ✅ Standard transition
className="transition-all duration-200"

// ✅ Fast hover only
className="transition-colors duration-fast"
```

---

## Tailwind Config Referentie

Zie `tailwind.config.ts` voor de exacte definities van de Polar tokens:

```typescript
borderRadius: {
  'polar-sm': '8px',   // kleine elementen
  'polar-md': '12px',  // inner layers, buttons
  'polar-lg': '16px',  // cards ⭐ (default)
  'polar-xl': '20px',  // grote panels
}

transitionDuration: {
  'fast': '150ms',     // hovers, micro-interactions
  'DEFAULT': '200ms',  // standard UI changes
  'slow': '300ms',     // larger animations
}
```
