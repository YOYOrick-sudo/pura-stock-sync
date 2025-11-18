# Pura Vida Styling Conventions

## Border Radius Standaarden

### 🎯 Cards, Buttons & Grote Panels
**16px** - `rounded-polar-lg` of `borderRadius: '16px'`
- **Buttons (primary, secondary, ghost)** ✅
- Dashboard cards
- Handover card
- KPI cards
- Setup cards
- Form cards
- Content panels
- Dropdowns
- Text inputs
- Select inputs
- Textareas
- Medium containers

### 📝 Kleine Interactive Elements
**8px** - `rounded-polar-sm` of `borderRadius: '8px'`
- **Sidebar menu items** ✅
- Toggle button
- Small badges
- Compact elements
- Tooltips

### 🏔️ Extra Grote Containers
**20px** - `rounded-polar-xl` of `borderRadius: '20px'`
- Extra grote modals
- Full-width sections
- Feature cards

---

## Hiërarchie Overzicht

```
8px  → Kleine interactieve elementen (sidebar menu, badges)
16px → Buttons, inputs, cards, panels, containers
20px → Extra grote containers en feature cards
```

---

## ❌ NOOIT inline styles gebruiken zonder reden!

```typescript
// ❌ Vermijd random waardes:
style={{ borderRadius: '14px' }}  // Niet standaard
style={{ borderRadius: '10px' }}  // Niet standaard

// ✅ Gebruik standaard waardes:
style={{ borderRadius: '16px' }}  // Voor cards
style={{ borderRadius: '12px' }}  // Voor buttons
style={{ borderRadius: '8px' }}   // Voor sidebar items

// ✅ Of gebruik Tailwind classes (preferred):
className="rounded-polar-lg"      // 16px - cards
className="rounded-polar-md"      // 12px - buttons
className="rounded-polar-sm"      // 8px - kleine elementen
```

---

## Best Practices

1. **Gebruik Tailwind classes waar mogelijk** - Dit zorgt voor consistentie en maakt het gemakkelijker om aanpassingen te maken
2. **Alleen inline styles voor dynamische waardes** - Bijvoorbeeld wanneer de border-radius afhankelijk is van een prop
3. **Documenteer afwijkingen** - Als je om een goede reden moet afwijken van deze standaarden, leg het uit in een comment
4. **Check bestaande componenten** - Kijk naar vergelijkbare componenten in de codebase voor consistentie

---

## Tailwind Config Referentie

Zie `tailwind.config.ts` voor de exacte definities van de Polar border-radius tokens:

```typescript
'polar-sm': '8px',
'polar-md': '12px',
'polar-lg': '16px',
'polar-xl': '20px',
```
