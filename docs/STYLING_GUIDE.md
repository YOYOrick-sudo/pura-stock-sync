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

## Tailwind Config Referentie

Zie `tailwind.config.ts` voor de exacte definities van de Polar border-radius tokens:

```typescript
borderRadius: {
  'polar-sm': '8px',   // kleine elementen
  'polar-md': '12px',  // inner layers, buttons
  'polar-lg': '16px',  // cards ⭐ (default)
  'polar-xl': '20px',  // grote panels
}
```
