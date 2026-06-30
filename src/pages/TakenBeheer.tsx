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
import { Check } from 'lucide-react';
import {
  getOrderedCategories,
  getMissingCategoryRows,
  type WestCategoryOrder,
  type WestSubcats,
} from '@/lib/foh-category-order';
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
type OrderMap = WestCategoryOrder;

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
  // Idempotent dankzij ignoreDuplicates — geen per-seedKey lock nodig.
  useEffect(() => {
    if (!isWest || !westCategoryOrder || !westSubcats) return;
    const dept: Department = 'voorkant';
    const missing = getMissingCategoryRows(westCategoryOrder, westSubcats as WestSubcats, dept);
    if (missing.length === 0) return;
    const maxSort = westCategoryOrder[dept].reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
    const rows = missing.map((c, i) => ({
      location, department: dept, category: c, sort_order: maxSort + (i + 1) * 10,
    }));
    // Optimistic patch zodat reorder direct alle categorieën meeneemt.
    queryClient.setQueryData<OrderMap>(orderKey, (prev) => {
      const base: OrderMap = prev
        ? { voorkant: prev.voorkant.slice(), achterkant: prev.achterkant.slice() }
        : { voorkant: [], achterkant: [] };
      base[dept] = base[dept].concat(rows.map(r => ({ category: r.category, sort_order: r.sort_order })));
      return base;
    });
    (async () => {
      const { error } = await supabase
        .from('foh_category_order')
        .upsert(rows, { onConflict: 'location,department,category', ignoreDuplicates: true });
      if (!error) queryClient.invalidateQueries({ queryKey: orderKey });
    })();
  }, [isWest, westCategoryOrder, westSubcats, location, queryClient]);

  // Beschikbare categorieën — exact dezelfde volgorde als de live lijst gebruikt
  // (zie src/lib/foh-category-order.ts). Eén bron van waarheid.
  const buildAvailableCategories = (dept: Department): string[] => {
    if (!isWest) return getMidslandCategories(phase);
    const result = getOrderedCategories(
      westCategoryOrder as WestCategoryOrder | undefined,
      westSubcats as WestSubcats | undefined,
      dept,
    );
    return result.length > 0 ? result : [...CATEGORY_ORDER_FALLBACK];
  };

  // Voor reorder/rename UI: rij-objecten in dezelfde volgorde als availableCategories.
  // Used-only categorieën (nog zonder DB-rij) krijgen sort_order=null tot de seed klaar is.
  const buildCategoryRows = (dept: Department): { category: string; sort_order: number | null }[] => {
    if (!isWest) return [];
    const ordered = buildAvailableCategories(dept);
    const map = new Map<string, number>();
    for (const r of westCategoryOrder?.[dept] ?? []) {
      map.set(r.category.trim().toLowerCase(), r.sort_order);
    }
    return ordered.map(cat => ({
      category: cat,
      sort_order: map.has(cat.trim().toLowerCase()) ? (map.get(cat.trim().toLowerCase()) as number) : null,
    }));
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['foh-category-order'] });
    queryClient.invalidateQueries({ queryKey: ['foh-west-subcategories'] });
    queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['list-manager-templates'] });
  };

  // "Opgeslagen ✓" feedback — fade in/out
  const [savedPing, setSavedPing] = useState(false);
  const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashSaved = () => {
    setSavedPing(true);
    if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    pingTimerRef.current = setTimeout(() => setSavedPing(false), 1200);
  };

  // Lock om dubbelklikken / race conditions te voorkomen
  const movingRef = useRef(false);

  const makeMoveHandler = (dept: Department) => async (category: string, direction: -1 | 1) => {
    if (movingRef.current) return;
    const prev = queryClient.getQueryData<OrderMap>(orderKey);
    // Belangrijk: gebruik de volledige weergegeven lijst (incl. used-only),
    // zodat de DB-volgorde 1-op-1 matcht met wat de gebruiker ziet.
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
    const nextMap: OrderMap = prev
      ? {
          voorkant: prev.voorkant.map(r => ({ ...r })),
          achterkant: prev.achterkant.map(r => ({ ...r })),
        }
      : { voorkant: [], achterkant: [] };
    nextMap[dept] = upsertRows.map(r => ({ category: r.category, sort_order: r.sort_order }));
    queryClient.setQueryData(orderKey, nextMap);

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
    flashSaved();
    invalidate();
  };


  // Rename dialog state
  const [renameState, setRenameState] = useState<{ dept: Department; oldName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const makeRenameHandler = (dept: Department) => (oldName: string) => {
    setRenameState({ dept, oldName });
    setRenameValue(oldName);
  };

  const performRename = async () => {
    if (!renameState) return;
    const { dept, oldName } = renameState;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) {
      setRenameState(null);
      return;
    }
    const existing = new Set((westCategoryOrder?.[dept] ?? []).map(r => r.category));
    if (existing.has(trimmed)) {
      toast.error(`"${trimmed}" bestaat al.`);
      return;
    }

    const prev = queryClient.getQueryData<OrderMap>(orderKey);
    if (prev) {
      const nextMap: OrderMap = {
        voorkant: prev.voorkant.map(r => r.category === oldName ? { ...r, category: trimmed } : r),
        achterkant: prev.achterkant.map(r => r.category === oldName ? { ...r, category: trimmed } : r),
      };
      queryClient.setQueryData(orderKey, nextMap);
    }

    setRenameSaving(true);
    const { error } = await supabase.rpc('foh_rename_category', {
      _location: location, _department: dept, _old: oldName, _new: trimmed,
    });
    setRenameSaving(false);
    if (error) {
      if (prev) queryClient.setQueryData(orderKey, prev);
      toast.error('Hernoemen mislukt');
      return;
    }
    toast.success('Onderdeel hernoemd');
    setRenameState(null);
    flashSaved();
    invalidate();
  };



  const [deleteState, setDeleteState] = useState<{ dept: Department; category: string } | null>(null);

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
    setDeleteState({ dept, category });
  };

  const performDelete = async () => {
    if (!deleteState) return;
    const { dept, category } = deleteState;
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
    setDeleteState(null);
    if (error) {
      if (prev) queryClient.setQueryData(orderKey, prev);
      toast.error('Verwijderen mislukt');
      return;
    }
    toast.success('Onderdeel verwijderd');
    flashSaved();
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
    <>
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

      {/* "Opgeslagen ✓" feedback — fade in/out, niet-intrusief */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 999,
          background: 'hsl(var(--primary) / 0.12)',
          color: 'hsl(var(--primary))',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          border: '1px solid hsl(var(--primary) / 0.25)',
          opacity: savedPing ? 1 : 0,
          transform: savedPing ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          pointerEvents: 'none',
          zIndex: 60,
        }}
      >
        <Check size={12} strokeWidth={3} />
        Opgeslagen
      </div>


      <PolarDialog
        open={!!renameState}
        onOpenChange={(o) => { if (!o) setRenameState(null); }}
        title="Onderdeel hernoemen"
        description={renameState ? `Geef "${renameState.oldName}" een nieuwe naam.` : undefined}
      >
        <div className="space-y-4">
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') performRename(); }}
            placeholder="Nieuwe naam"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameState(null)} disabled={renameSaving}>
              Annuleren
            </Button>
            <Button onClick={performRename} disabled={renameSaving || !renameValue.trim()}>
              {renameSaving ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </PolarDialog>

      <AlertDialog open={!!deleteState} onOpenChange={(o) => { if (!o) setDeleteState(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Onderdeel verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState ? `Weet je zeker dat je "${deleteState.category}" wilt verwijderen?` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
