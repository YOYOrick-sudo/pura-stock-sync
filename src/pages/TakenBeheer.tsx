// /taken/beheer — beheerscherm voor takenlijsten met sidebar zichtbaar.
// West-mode (zonder dept-param): toont alle taken van de fase als één unified flow
// door voorkant + achterkant stacked te renderen (alleen die met data).
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ListManager } from '@/components/foh/ListManager';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/SidebarLayout';

type Phase = 'open' | 'tussen' | 'sluit';
type Department = 'voorkant' | 'achterkant';

const CATEGORY_ORDER_FALLBACK = ['Algemeen'];

function getMidslandCategories(phase: Phase): string[] {
  if (phase === 'open') return ['Deel 1', 'Deel 2', 'Deel 3'];
  if (phase === 'tussen') return ['Binnen', 'Deel 1 - Bar Prep Check', 'Deel 2 - Bijvullen', 'Hygiëne', 'Overdracht', 'Terras'];
  return ['BAR', 'BIJVULLEN (FIFO)', 'BINNEN', 'HYGIENE', 'LAATSTE LOODJES', 'TERRAS'];
}

function phaseLabel(phase: Phase) {
  return phase === 'open' ? 'Openen' : phase === 'tussen' ? 'Tussen' : 'Sluiten';
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

  // West category order
  const { data: westCategoryOrder } = useQuery({
    queryKey: ['foh-category-order', location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_category_order')
        .select('department, category, sort_order')
        .eq('location', location)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const out: Record<Department, { category: string; sort_order: number }[]> = {
        voorkant: [], achterkant: [],
      };
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

  // (West werkt nu als één lijst — geen multi-department detectie meer nodig)

  const buildAvailableCategories = (dept: Department): string[] => {
    if (!isWest) return getMidslandCategories(phase);
    const ordered = (westCategoryOrder?.[dept] ?? []).map(r => r.category);
    const used = westSubcats?.[dept] ?? [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of ordered) if (!seen.has(c)) { seen.add(c); result.push(c); }
    for (const c of used) if (!seen.has(c)) { seen.add(c); result.push(c); }
    if (result.length === 0) return [...CATEGORY_ORDER_FALLBACK];
    if (!result.includes('Algemeen')) result.unshift('Algemeen');
    return result;
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

  const makeMoveHandler = (dept: Department) => async (category: string, direction: -1 | 1) => {
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
    const { error } = await supabase
      .from('foh_category_order')
      .upsert(upsertRows, { onConflict: 'location,department,category' });
    if (error) { toast.error('Fout bij opslaan volgorde'); return; }
    invalidate();
  };

  const makeRenameHandler = (dept: Department) => async (oldName: string) => {
    const next = window.prompt(`Nieuwe naam voor "${oldName}":`, oldName);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    const { error } = await supabase.rpc('foh_rename_category', {
      _location: location, _department: dept, _old: oldName, _new: trimmed,
    });
    if (error) { toast.error('Hernoemen mislukt'); return; }
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
    const { error } = await supabase
      .from('foh_category_order')
      .delete()
      .eq('location', location).eq('department', dept).eq('category', category);
    if (error) { toast.error('Verwijderen mislukt'); return; }
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

  // (West is nu één lijst — single ListManager render hieronder)



  // ----- Single-dept render (Midsland of expliciete dept param) -----
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
