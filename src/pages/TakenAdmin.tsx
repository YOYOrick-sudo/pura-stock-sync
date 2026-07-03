// /taken/admin — overzicht van alle takenlijsten met sidebar zichtbaar.
// West werkt allround: één kaart per fase (geen Bediening/Keuken splitsing).
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, ChevronUp, Pencil, Trash2, Loader2, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';

type Phase = 'open' | 'tussen' | 'borrel' | 'sluit';
type Department = 'voorkant' | 'achterkant';

interface ListCard {
  key: string;
  phase: Phase;
  department?: Department; // alleen voor non-West (Midsland)
  title: string;
  taskCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  open: 'Openen',
  tussen: 'Tussen',
  borrel: 'Borrel',
  sluit: 'Sluiten',
};

function TakenAdminInner() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const queryClient = useQueryClient();
  const isWest = userLocation === 'West';
  const isManagedLocation = userLocation === 'West' || userLocation === 'Midsland';

  // Fetch alle actieve templates voor deze locatie
  const { data: templates, isLoading } = useQuery({
    queryKey: ['foh-admin-templates', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_daily_templates')
        .select('phase, department, template_name, is_active')
        .eq('location', userLocation)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userLocation,
  });

  // Categorie-volgorde (West)
  const { data: westCategoryOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['foh-category-order', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_category_order')
        .select('department, category, sort_order')
        .eq('location', userLocation)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const out: Record<Department, { category: string; sort_order: number | null }[]> = { voorkant: [], achterkant: [] };
      for (const r of (data as any[]) || []) {
        const d: Department = r.department === 'achterkant' ? 'achterkant' : 'voorkant';
        out[d].push({ category: r.category, sort_order: r.sort_order });
      }
      return out;
    },
    enabled: isManagedLocation,
  });

  // Tellingen per categorie (zowel templates als actieve taken) — voor opruim-detectie
  const { data: categoryUsage, refetch: refetchUsage } = useQuery({
    queryKey: ['foh-admin-category-usage', userLocation],
    queryFn: async () => {
      const [tpl, tsk] = await Promise.all([
        supabase.from('foh_daily_templates').select('category, department').eq('location', userLocation),
        supabase.from('foh_tasks').select('category, department').eq('location', userLocation).eq('archived', false),
      ]);
      const counts: Record<string, number> = {};
      const bump = (cat: string | null) => {
        const c = (cat || '').trim();
        if (!c) return;
        counts[c] = (counts[c] ?? 0) + 1;
      };
      for (const r of ((tpl.data as any[]) || [])) bump(r.category);
      for (const r of ((tsk.data as any[]) || [])) bump(r.category);
      return counts;
    },
    enabled: isManagedLocation,
  });

  // Bouw lijst van kaarten
  const cards: ListCard[] = useMemo(() => {
    if (!templates) return [];

    if (isWest) {
      // West: één kaart per fase, departments samengevoegd
      const byPhase = new Map<Phase, number>();
      for (const t of templates as any[]) {
        const phase = t.phase as Phase | null;
        if (!phase) continue;
        byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1);
      }
      const phaseOrder: Phase[] = ['open', 'sluit'];
      return phaseOrder
        .filter(p => byPhase.has(p))
        .map(phase => ({
          key: phase,
          phase,
          title: PHASE_LABEL[phase],
          taskCount: byPhase.get(phase) ?? 0,
        }));
    }

    // Midsland: altijd alle 4 fasen tonen, ook zonder actieve template
    const byPhase = new Map<Phase, number>();
    for (const t of templates as any[]) {
      const phase = t.phase as Phase | null;
      if (!phase) continue;
      byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1);
    }
    const phaseOrder: Phase[] = ['open', 'tussen', 'borrel', 'sluit'];
    return phaseOrder.map(phase => ({
      key: phase,
      phase,
      title: PHASE_LABEL[phase],
      taskCount: byPhase.get(phase) ?? 0,
    }));
  }, [templates, isWest]);

  const openList = (card: ListCard) => {
    const params = new URLSearchParams({
      location: userLocation,
      phase: card.phase,
    });
    if (card.department) params.set('dept', card.department);
    navigate(`/taken/beheer?${params.toString()}`);
  };

  // --------------------------------------------------------------------------
  // Unified subcategorie-beheer (West): merge voorkant + achterkant op categorie-naam
  // --------------------------------------------------------------------------
  const unifiedCategories = useMemo(() => {
    if (!isManagedLocation || !westCategoryOrder) return [];
    const map = new Map<string, { category: string; minOrder: number; depts: Department[] }>();
    // West heeft voorkant + achterkant; Midsland alleen voorkant.
    const deptsToScan: Department[] = isWest ? ['voorkant', 'achterkant'] : ['voorkant'];
    for (const dept of deptsToScan) {
      for (const row of westCategoryOrder[dept] ?? []) {
        const ex = map.get(row.category);
        const order = row.sort_order ?? 9999;
        if (ex) {
          ex.minOrder = Math.min(ex.minOrder, order);
          if (!ex.depts.includes(dept)) ex.depts.push(dept);
        } else {
          map.set(row.category, { category: row.category, minOrder: order, depts: [dept] });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.minOrder - b.minOrder);
  }, [isManagedLocation, isWest, westCategoryOrder]);

  const handleMoveUnified = async (category: string, direction: -1 | 1) => {
    const list = unifiedCategories.map(c => c.category);
    const idx = list.indexOf(category);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];

    // Schrijf nieuwe sort_order voor BEIDE departments (zelfde volgorde overal)
    const upserts: { location: string; department: Department; category: string; sort_order: number }[] = [];
    list.forEach((cat, i) => {
      const entry = unifiedCategories.find(c => c.category === cat);
      const order = (i + 1) * 10;
      const depts = entry?.depts ?? ['voorkant'];
      for (const d of depts) upserts.push({ location: userLocation, department: d, category: cat, sort_order: order });
    });

    const { error } = await supabase
      .from('foh_category_order')
      .upsert(upserts, { onConflict: 'location,department,category' });
    if (error) { toast.error('Opslaan mislukt'); return; }
    refetchOrder();
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  const handleRenameUnified = async (oldName: string) => {
    const entry = unifiedCategories.find(c => c.category === oldName);
    if (!entry) return;
    const next = window.prompt(`Nieuwe naam voor "${oldName}":`, oldName);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    for (const dept of entry.depts) {
      const { error } = await supabase.rpc('foh_rename_category', {
        _location: userLocation, _department: dept, _old: oldName, _new: trimmed,
      });
      if (error) { toast.error(`Hernoemen mislukt (${dept})`); return; }
    }
    toast.success('Onderdeel hernoemd');
    refetchOrder();
    refetchUsage();
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  const handleDeleteUnified = async (category: string) => {
    const entry = unifiedCategories.find(c => c.category === category);
    if (!entry) return;
    const usage = categoryUsage?.[category] ?? 0;
    if (usage > 0) {
      toast.error(`Nog ${usage} taak/taken in "${category}". Verplaats of verwijder die eerst.`);
      return;
    }
    if (!window.confirm(`Onderdeel "${category}" verwijderen?`)) return;
    for (const dept of entry.depts) {
      await supabase
        .from('foh_category_order').delete()
        .eq('location', userLocation).eq('department', dept).eq('category', category);
    }
    toast.success('Onderdeel verwijderd');
    refetchOrder();
    refetchUsage();
  };

  // Lege legacy-categorieën opruimen
  const emptyCategories = useMemo(() => {
    if (!isManagedLocation || !categoryUsage) return [];
    return unifiedCategories.filter(c => (categoryUsage[c.category] ?? 0) === 0);
  }, [isManagedLocation, unifiedCategories, categoryUsage]);

  const handleCleanupEmpty = async () => {
    if (emptyCategories.length === 0) return;
    const names = emptyCategories.map(c => `"${c.category}"`).join(', ');
    if (!window.confirm(`${emptyCategories.length} leeg onderdeel verwijderen: ${names}?`)) return;
    for (const entry of emptyCategories) {
      for (const dept of entry.depts) {
        await supabase
          .from('foh_category_order').delete()
          .eq('location', userLocation).eq('department', dept).eq('category', entry.category);
      }
    }
    toast.success(`${emptyCategories.length} leeg onderdeel verwijderd`);
    refetchOrder();
    refetchUsage();
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8 }}>
      {/* Intro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'hsl(var(--primary) / 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Takenlijsten beheren
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            Kies een lijst om te bewerken — taken toevoegen, hernoemen, verwijderen of herordenen.
          </p>
        </div>
      </div>

      {/* Lijstkaarten */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      ) : cards.length === 0 ? (
        <div style={{
          padding: 24, borderRadius: 16, border: '1px dashed hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))', fontSize: 14,
        }}>
          Geen actieve lijsten gevonden voor {userLocation}.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {cards.map(card => (
            <button
              key={card.key}
              onClick={() => openList(card)}
              style={{
                textAlign: 'left',
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 16,
                padding: 18,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 150ms ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))',
              }}>
                {userLocation}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {card.title}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 4,
              }}>
                <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                  {card.taskCount} {card.taskCount === 1 ? 'taak' : 'taken'}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 500, color: 'hsl(var(--primary))',
                }}>
                  Beheren <ArrowRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* West + Midsland: Onderdelen beheren (unified) */}
      {isManagedLocation && (
        <div style={{
          padding: 18, borderRadius: 16,
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, gap: 12,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))',
            }}>
              Onderdelen beheren
            </div>
            {emptyCategories.length > 0 && (
              <Button
                size="sm" variant="outline"
                onClick={handleCleanupEmpty}
                style={{ height: 28, fontSize: 12, gap: 4 }}
              >
                <Sparkles size={12} />
                {emptyCategories.length} leeg opruimen
              </Button>
            )}
          </div>

          {unifiedCategories.length === 0 ? (
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              Nog geen onderdelen.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unifiedCategories.map((row, idx) => {
                const usage = categoryUsage?.[row.category] ?? 0;
                const isEmpty = usage === 0;
                return (
                  <div key={row.category} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px',
                    background: isEmpty ? 'hsl(var(--destructive) / 0.05)' : 'hsl(var(--muted) / 0.4)',
                    borderRadius: 8,
                    border: `1px solid ${isEmpty ? 'hsl(var(--destructive) / 0.25)' : 'hsl(var(--border))'}`,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: 'hsl(var(--muted-foreground))', minWidth: 20,
                    }}>
                      {idx + 1}.
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                      {row.category}
                    </span>
                    <span style={{
                      fontSize: 11, color: 'hsl(var(--muted-foreground))', marginRight: 4,
                    }}>
                      {usage === 0 ? 'leeg' : `${usage} ${usage === 1 ? 'taak' : 'taken'}`}
                    </span>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleMoveUnified(row.category, -1)}
                      disabled={idx === 0}
                      style={{ height: 28, padding: '0 6px' }} aria-label="Omhoog">
                      <ChevronUp size={14} />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleMoveUnified(row.category, 1)}
                      disabled={idx === unifiedCategories.length - 1}
                      style={{ height: 28, padding: '0 6px' }} aria-label="Omlaag">
                      <ChevronDown size={14} />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleRenameUnified(row.category)}
                      style={{ height: 28, padding: '0 6px' }} aria-label="Hernoemen">
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleDeleteUnified(row.category)}
                      style={{ height: 28, padding: '0 6px', color: 'hsl(var(--destructive))' }}
                      aria-label="Verwijderen">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 8, lineHeight: 1.4 }}>
            Volgorde geldt voor de hele takenlijst. Verwijderen kan alleen als een onderdeel leeg is.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TakenAdmin() {
  return (
    <ProtectedRoute>
      <SidebarLayout>
        <TakenAdminInner />
      </SidebarLayout>
    </ProtectedRoute>
  );
}
