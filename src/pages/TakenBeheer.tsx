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

  // Welke departments hebben überhaupt actieve templates voor deze fase?
  const { data: deptsWithTemplates } = useQuery({
    queryKey: ['foh-depts-with-templates', location, phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_daily_templates')
        .select('department')
        .eq('location', location)
        .eq('phase', phase)
        .eq('is_active', true);
      if (error) throw error;
      const set = new Set<Department>();
      for (const r of (data as any[]) || []) {
        set.add(r.department === 'achterkant' ? 'achterkant' : 'voorkant');
      }
      return set;
    },
    enabled: isWest && isUnifiedWest,
  });

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

  // Welke departments tonen we (unified West)? Default: beide; filter op die met templates.
  const activeDepts: Department[] = useMemo(() => {
    if (!isUnifiedWest) return [department];
    const all: Department[] = ['voorkant', 'achterkant'];
    if (!deptsWithTemplates) return all;
    return all.filter(d => deptsWithTemplates.has(d));
  }, [isUnifiedWest, department, deptsWithTemplates]);

  // ----- Unified West render -----
  if (isUnifiedWest) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Eigen header met één 'Terug' knop */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 4px',
        }}>
          <button
            onClick={handleClose}
            aria-label="Terug"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px 8px 8px',
              background: 'transparent',
              border: '1px solid hsl(var(--border))',
              borderRadius: 10,
              cursor: 'pointer',
              color: 'hsl(var(--foreground))',
              fontSize: 13, fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <ArrowLeft size={16} /> Terug
          </button>
          <div>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 600,
              color: 'hsl(var(--foreground))', letterSpacing: '-0.01em',
            }}>
              {phaseLabel(phase)} beheren
            </h1>
            <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
              Eén lijst — alle onderdelen samen.
            </div>
          </div>
        </div>

        {/* Gestapelde embedded ListManagers — elk eigen kaart, geen dept-labels */}
        {activeDepts.map((dept) => (
          <div
            key={dept}
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 20,
              padding: '20px 0 16px',
              overflow: 'hidden',
            }}
          >
            <ListManager
              variant="embedded"
              open={true}
              onClose={handleClose}
              location={location}
              phase={phase}
              department={dept}
              availableCategories={buildAvailableCategories(dept)}
              isWest={isWest}
              westCategoryRows={buildCategoryRows(dept)}
              onMoveCategory={makeMoveHandler(dept)}
              onRenameCategory={makeRenameHandler(dept)}
              onDeleteCategory={makeDeleteHandler(dept)}
            />
          </div>
        ))}
      </div>
    );
  }

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
