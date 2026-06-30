// /taken/beheer — beheerscherm voor takenlijsten met sidebar zichtbaar.
// West werkt allround: één lijst (voorkant department) per fase.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ListManager } from '@/components/foh/ListManager';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/SidebarLayout';
import { PolarDialog } from '@/components/polar/Dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Phase = 'open' | 'tussen' | 'sluit';
type Department = 'voorkant' | 'achterkant';

type OrderRow = { category: string; sort_order: number };
type OrderMap = Record<Department, OrderRow[]>;

const CATEGORY_ORDER_FALLBACK = ['Algemeen'];

function getMidslandCategories(phase: Phase): string[] {
  if (phase === 'open') return ['Deel 1', 'Deel 2', 'Deel 3'];
  if (phase === 'tussen') return ['Binnen', 'Deel 1 - Bar Prep Check', 'Deel 2 - Bijvullen', 'Hygiëne', 'Overdracht', 'Terras'];
  return ['BAR', 'BIJVULLEN (FIFO)', 'BINNEN', 'HYGIENE', 'LAATSTE LOODJES', 'TERRAS'];
}


function TakenBeheerInner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { userLocation } = useUserLocation();
  const queryClient = useQueryClient();

  const location = (params.get('location') || userLocation || 'West').trim();
  const phase = (params.get('phase') as Phase) || 'sluit';
  const deptParam = params.get('dept') as Department | null;
  const isWest = location === 'West';
  // West werkt allround: één lijst (voorkant department). Midsland negeert dept.
  const department: Department = isWest
    ? 'voorkant'
    : (deptParam === 'achterkant' ? 'achterkant' : 'voorkant');

  const orderKey = ['foh-category-order', location] as const;

  // West category order
  const { data: westCategoryOrder } = useQuery<OrderMap>({
    queryKey: orderKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_category_order')
        .select('department, category, sort_order')
        .eq('location', location)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const out: OrderMap = { voorkant: [], achterkant: [] };
      for (const r of (data as any[]) || []) {
        const d: Department = r.department === 'achterkant' ? 'achterkant' : 'voorkant';
        out[d].push({ category: r.category, sort_order: r.sort_order });
      }
      return out;
    },
    enabled: isWest,
  });

  // Subcategorieën uit templates + actieve taken
  const { data: westSubcats } = useQuery({
    queryKey: ['foh-west-subcategories', location],
    queryFn: async () => {
      const [tpl, tsk] = await Promise.all([
        supabase.from('foh_daily_templates').select('category, department').eq('location', location),
        supabase.from('foh_tasks').select('category, department').eq('location', location).eq('archived', false),
      ]);
      const out: Record<Department, Set<string>> = { voorkant: new Set(), achterkant: new Set() };
      for (const r of [...((tpl.data as any[]) || []), ...((tsk.data as any[]) || [])]) {
        const d: Department = r.department === 'achterkant' ? 'achterkant' : 'voorkant';
        const c = (r.category || '').trim();
        if (c) out[d].add(c);
      }
      return {
        voorkant: Array.from(out.voorkant).sort(),
        achterkant: Array.from(out.achterkant).sort(),
      };
    },
    enabled: isWest,
  });

  // ===== Auto-seed missing categories so every used category has a sort row.
  const seededRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isWest || !westCategoryOrder || !westSubcats) return;
    const dept: Department = 'voorkant';
    const existing = new Set(westCategoryOrder[dept].map(r => r.category));
    const used = westSubcats[dept] || [];
    const missing = used.filter(c => c && !existing.has(c));
    if (missing.length === 0) return;
    const seedKey = `${location}:${dept}:${missing.join('|')}`;
    if (seededRef.current.has(seedKey)) return;
    seededRef.current.add(seedKey);
    const maxSort = westCategoryOrder[dept].reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
    const rows = missing.map((c, i) => ({
      location, department: dept, category: c, sort_order: maxSort + (i + 1) * 10,
    }));
    (async () => {
      const { error } = await supabase
        .from('foh_category_order')
        .upsert(rows, { onConflict: 'location,department,category', ignoreDuplicates: true });
      if (!error) queryClient.invalidateQueries({ queryKey: orderKey });
    })();
  }, [isWest, westCategoryOrder, westSubcats, location, queryClient]);

  // Available categories = exact volgorde uit DB (na seeding). Geen unshift.
  const buildAvailableCategories = (dept: Department): string[] => {
    if (!isWest) return getMidslandCategories(phase);
    const ordered = (westCategoryOrder?.[dept] ?? []).map(r => r.category);
    if (ordered.length > 0) return ordered;
    // Fallback voor allereerste render vóór seed: gebruik subcats
    const used = westSubcats?.[dept] ?? [];
    return used.length > 0 ? used : [...CATEGORY_ORDER_FALLBACK];
  };

  const buildCategoryRows = (dept: Department) => isWest
    ? (westCategoryOrder?.[dept] ?? []).map(r => ({
        category: r.category, sort_order: r.sort_order as number | null,
      }))
    : [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['foh-category-order'] });
    queryClient.invalidateQueries({ queryKey: ['foh-west-subcategories'] });
    queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['list-manager-templates'] });
  };

  // Lock om dubbelklikken / race conditions te voorkomen
  const movingRef = useRef(false);

  const makeMoveHandler = (dept: Department) => async (category: string, direction: -1 | 1) => {
    if (movingRef.current) return;
    const prev = queryClient.getQueryData<OrderMap>(orderKey);
    const rows = buildCategoryRows(dept);
    const idx = rows.findIndex(r => r.category === category);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= rows.length) return;

    const list = rows.map(r => r.category);
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    const upsertRows = list.map((cat, i) => ({
      location, department: dept, category: cat, sort_order: (i + 1) * 10,
    }));

    // Optimistic update
    if (prev) {
      const nextMap: OrderMap = {
        voorkant: prev.voorkant.map(r => ({ ...r })),
        achterkant: prev.achterkant.map(r => ({ ...r })),
      };
      nextMap[dept] = upsertRows.map(r => ({ category: r.category, sort_order: r.sort_order }));
      queryClient.setQueryData(orderKey, nextMap);
    }

    movingRef.current = true;
    const { error } = await supabase
      .from('foh_category_order')
      .upsert(upsertRows, { onConflict: 'location,department,category' });
    movingRef.current = false;

    if (error) {
      if (prev) queryClient.setQueryData(orderKey, prev);
      toast.error('Fout bij opslaan volgorde');
      return;
    }
    invalidate();
  };

  const makeRenameHandler = (dept: Department) => async (oldName: string) => {
    const next = window.prompt(`Nieuwe naam voor "${oldName}":`, oldName);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;

    // Dedupe-check
    const existing = new Set((westCategoryOrder?.[dept] ?? []).map(r => r.category));
    if (existing.has(trimmed)) {
      if (!window.confirm(`"${trimmed}" bestaat al. Samenvoegen?`)) return;
    }

    // Optimistic rename
    const prev = queryClient.getQueryData<OrderMap>(orderKey);
    if (prev) {
      const nextMap: OrderMap = {
        voorkant: prev.voorkant.map(r => r.category === oldName ? { ...r, category: trimmed } : r),
        achterkant: prev.achterkant.map(r => r.category === oldName ? { ...r, category: trimmed } : r),
      };
      queryClient.setQueryData(orderKey, nextMap);
    }

    const { error } = await supabase.rpc('foh_rename_category', {
      _location: location, _department: dept, _old: oldName, _new: trimmed,
    });
    if (error) {
      if (prev) queryClient.setQueryData(orderKey, prev);
      toast.error('Hernoemen mislukt');
      return;
    }
    toast.success('Onderdeel hernoemd');
    invalidate();
  };

  const makeDeleteHandler = (dept: Department) => async (category: string) => {
    const [tpl, tsk] = await Promise.all([
      supabase.from('foh_daily_templates').select('id', { count: 'exact', head: true })
        .eq('location', location).eq('department', dept).eq('category', category),
      supabase.from('foh_tasks').select('id', { count: 'exact', head: true })
        .eq('location', location).eq('department', dept).eq('category', category).eq('archived', false),
    ]);
    if ((tpl.count ?? 0) + (tsk.count ?? 0) > 0) {
      toast.error(`Nog ${tpl.count ?? 0} template-taak(jes) en ${tsk.count ?? 0} actieve taken in "${category}".`);
      return;
    }
    if (!window.confirm(`Onderdeel "${category}" verwijderen?`)) return;

    const prev = queryClient.getQueryData<OrderMap>(orderKey);
    if (prev) {
      const nextMap: OrderMap = {
        voorkant: prev.voorkant.filter(r => r.category !== category),
        achterkant: prev.achterkant.filter(r => r.category !== category),
      };
      queryClient.setQueryData(orderKey, nextMap);
    }

    const { error } = await supabase
      .from('foh_category_order')
      .delete()
      .eq('location', location).eq('department', dept).eq('category', category);
    if (error) {
      if (prev) queryClient.setQueryData(orderKey, prev);
      toast.error('Verwijderen mislukt');
      return;
    }
    toast.success('Onderdeel verwijderd');
    invalidate();
  };

  const handleClose = () => navigate('/taken/admin');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ListManager
      variant="page"
      open={true}
      onClose={handleClose}
      location={location}
      phase={phase}
      department={department}
      availableCategories={buildAvailableCategories(department)}
      isWest={isWest}
      westCategoryRows={buildCategoryRows(department)}
      onMoveCategory={isWest ? makeMoveHandler(department) : undefined}
      onRenameCategory={isWest ? makeRenameHandler(department) : undefined}
      onDeleteCategory={isWest ? makeDeleteHandler(department) : undefined}
    />
  );
}

export default function TakenBeheer() {
  return (
    <ProtectedRoute>
      <SidebarLayout>
        <TakenBeheerInner />
      </SidebarLayout>
    </ProtectedRoute>
  );
}
