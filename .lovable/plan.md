

# Personeel & Slaapplek module — definitief bouwplan

Groen licht ontvangen. Drie correcties verwerkt. Geen verdere review nodig — na akkoord direct bouwen.

## Drie laatste correcties verwerkt

**A. Persisted scroll-positie geschrapt** — bij elke mount auto-scroll naar vandaag, geen `sessionStorage`. Eigen aanvulling #3 uit v4 vervalt.

**B. Beide andere optimistic hooks volledig uitgewerkt:**

```ts
export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonUpdate & { id: string }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("personeel_people").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["personeel", "people"] });
      const previous = qc.getQueryData<Person[]>(["personeel", "people"]);
      // Geen updated_by/updated_at in optimistic patch — trigger zet die server-side
      const { id, ...patch } = input;
      qc.setQueryData<Person[]>(["personeel", "people"], (old = []) =>
        old.map(p => p.id === id ? { ...p, ...patch } : p)
      );
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) qc.setQueryData(["personeel", "people"], ctx.previous);
      toast.error("Wijziging niet opgeslagen — probeer opnieuw");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["personeel", "people"] }),
  });
}

export function useSoftDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("personeel_people")
        .update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["personeel", "people"] });
      const previous = qc.getQueryData<Person[]>(["personeel", "people"]);
      // View filtert deleted_at al weg → uit lijst halen
      qc.setQueryData<Person[]>(["personeel", "people"], (old = []) =>
        old.filter(p => p.id !== id)
      );
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) qc.setQueryData(["personeel", "people"], ctx.previous);
      toast.error("Verwijderen mislukt — collega is teruggezet");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["personeel", "people"] }),
  });
}
```

**C. Sticky-kolom hoogte-sync via één CSS-variabele:**

In `Tijdlijn.tsx` op de root-container:
```tsx
<div
  className="relative"
  style={{
    "--timeline-date-h": "40px",
    "--timeline-density-h": "32px",
    "--timeline-header-h": "calc(var(--timeline-date-h) + var(--timeline-density-h))",
  } as React.CSSProperties}
>
```
Spacer in namen-kolom: `<div style={{ height: "var(--timeline-header-h)" }} />`. Date-header: `style={{ height: "var(--timeline-date-h)" }}`. Density-bar: `style={{ height: "var(--timeline-density-h)" }}`. Eén bron van waarheid — wijzigt density-bar dan schuift spacer automatisch mee.

## Bouwvolgorde

1. **Migratie** — 4 tabellen, view zonder `security_invoker`, `is_personeel_manager()` helper, 3 triggers (`a_protect_delete`, `b_protect_sensitive`, `z_audit`), column-grants, RLS, realtime publication, seed met de 8 originele Excel-slaapplekken
2. **Types & lib** — `types/personeel.ts`, `lib/personeel-copy.ts`, `lib/personeel-utils.ts` (`formatPeriod`, `getContrastColor`, `getDensityPerDay`)
3. **Hooks** — `useIsManager`, `useLocations`, `useTeams`, `useHousing`, `usePeople` (incl. 3 mutaties hierboven), `useMyPlanning`, `usePersoneelFilters`. Alle realtime-subscriptions als invalidation-trigger met 300ms debounce per tabel — payloads worden nooit gelezen
4. **Routes & navigatie** — 6 routes onder `/personeel`, sidebar-item, manager-redirect met loading-guard
5. **Componenten** in volgorde van impact:
   - `PersoneelLayout` (top-tabs, manager-only filtering, redirect-guard)
   - `MijnPlanning` (huidig/toekomstig/verleden secties)
   - `Vandaag` (lijst per locatie)
   - `Tijdlijn` (rolling 365 dagen, geen zoom, auto-scroll naar vandaag bij mount, sticky maand/dag-headers, synced density-bar binnen één scroll-container, vandaag-lijn, weekend-pattern, CSS-var hoogte-sync)
   - `Wonen` (cards met capaciteits-overage indicator)
   - `Collegas` (tabel met drie-puntjes-menu, manager-only kolommen)
   - `PersoneelSettings` (manager-only, 3 dnd-secties + import/export)
   - `PersonModal` (progressive disclosure, shadcn Calendar+Popover)
   - `DensityBar`, `PlanningBlock`, `HousingCard`, `ColorPickerModal`, `ManagerOnly`

## Omvang
1 migratie · ~14 componenten · 7 hooks · 3 lib-bestanden · 2 file-edits (`App.tsx`, `AppSidebar.tsx`)

