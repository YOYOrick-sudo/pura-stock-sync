// /taken/admin — overzicht van alle takenlijsten met sidebar zichtbaar.
// Vervangt de oude Dialog-gebaseerde admin popup.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, ChevronUp, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';

type Phase = 'open' | 'tussen' | 'sluit';
type Department = 'voorkant' | 'achterkant';
type DeviceMode = 'beide' | 'voorkant' | 'achterkant';

interface ListCard {
  key: string;
  phase: Phase;
  department: Department;
  title: string;
  taskCount: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  open: 'Openen',
  tussen: 'Tussen',
  sluit: 'Sluiten',
};

function TakenAdminInner() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const queryClient = useQueryClient();
  const isWest = userLocation === 'West';

  // Apparaat-modus (West)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window === 'undefined') return 'beide';
    const stored = localStorage.getItem('foh_device_mode_west');
    return (stored === 'voorkant' || stored === 'achterkant' || stored === 'beide') ? stored : 'beide';
  });
  useEffect(() => {
    if (isWest) localStorage.setItem('foh_device_mode_west', deviceMode);
  }, [deviceMode, isWest]);

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
    enabled: isWest,
  });

  // Bouw lijst van kaarten
  const cards: ListCard[] = (() => {
    if (!templates) return [];
    const grouped = new Map<string, { phase: Phase; department: Department; count: number }>();
    for (const t of templates as any[]) {
      const phase = t.phase as Phase;
      if (!phase) continue;
      const dept: Department = (t.department === 'achterkant' ? 'achterkant' : 'voorkant');
      const key = `${phase}::${dept}`;
      const cur = grouped.get(key);
      if (cur) cur.count += 1;
      else grouped.set(key, { phase, department: dept, count: 1 });
    }
    const arr: ListCard[] = [];
    for (const [key, v] of grouped.entries()) {
      const deptLabel = isWest ? (v.department === 'voorkant' ? 'Bediening' : 'Keuken') : '';
      arr.push({
        key,
        phase: v.phase,
        department: v.department,
        title: isWest ? `${deptLabel} · ${PHASE_LABEL[v.phase]}` : PHASE_LABEL[v.phase],
        taskCount: v.count,
      });
    }
    const phaseOrder: Phase[] = ['open', 'tussen', 'sluit'];
    const deptOrder: Department[] = ['voorkant', 'achterkant'];
    arr.sort((a, b) => {
      const dp = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
      if (dp !== 0) return dp;
      return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
    });
    return arr;
  })();

  const openList = (card: ListCard) => {
    const params = new URLSearchParams({
      location: userLocation,
      phase: card.phase,
      dept: card.department,
    });
    navigate(`/taken/beheer?${params.toString()}`);
  };

  // Subcategorie beheer (West) — move/rename/delete
  const handleMove = async (dept: Department, category: string, direction: -1 | 1) => {
    const rows = (westCategoryOrder?.[dept] ?? []).map(r => r.category);
    const idx = rows.indexOf(category);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= rows.length) return;
    [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
    const upserts = rows.map((cat, i) => ({
      location: userLocation, department: dept, category: cat, sort_order: (i + 1) * 10,
    }));
    const { error } = await supabase
      .from('foh_category_order')
      .upsert(upserts, { onConflict: 'location,department,category' });
    if (error) { toast.error('Opslaan mislukt'); return; }
    refetchOrder();
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  const handleRename = async (dept: Department, oldName: string) => {
    const next = window.prompt(`Nieuwe naam voor "${oldName}":`, oldName);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === oldName) return;
    const { error } = await supabase.rpc('foh_rename_category', {
      _location: userLocation, _department: dept, _old: oldName, _new: trimmed,
    });
    if (error) { toast.error('Hernoemen mislukt'); return; }
    toast.success('Subcategorie hernoemd');
    refetchOrder();
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  const handleDelete = async (dept: Department, category: string) => {
    const [tpl, tsk] = await Promise.all([
      supabase.from('foh_daily_templates').select('id', { count: 'exact', head: true })
        .eq('location', userLocation).eq('department', dept).eq('category', category),
      supabase.from('foh_tasks').select('id', { count: 'exact', head: true })
        .eq('location', userLocation).eq('department', dept).eq('category', category).eq('archived', false),
    ]);
    if ((tpl.count ?? 0) + (tsk.count ?? 0) > 0) {
      toast.error(`Nog ${tpl.count ?? 0} template-taak(jes) en ${tsk.count ?? 0} actieve taken in "${category}".`);
      return;
    }
    if (!window.confirm(`Subcategorie "${category}" verwijderen?`)) return;
    const { error } = await supabase
      .from('foh_category_order').delete()
      .eq('location', userLocation).eq('department', dept).eq('category', category);
    if (error) { toast.error('Verwijderen mislukt'); return; }
    toast.success('Subcategorie verwijderd');
    refetchOrder();
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

      {/* West: Apparaat-modus */}
      {isWest && (
        <div style={{
          padding: 18, borderRadius: 16,
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', marginBottom: 4,
          }}>
            Apparaat-modus
          </div>
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
            Bepaalt welke afdeling bovenaan staat op deze iPad. Wordt lokaal opgeslagen.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              { key: 'voorkant', label: 'Bediening eerst' },
              { key: 'achterkant', label: 'Keuken eerst' },
              { key: 'beide', label: 'Standaard' },
            ] as { key: DeviceMode; label: string }[]).map(({ key, label }) => {
              const active = deviceMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeviceMode(key)}
                  style={{
                    flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 12,
                    border: `1.5px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                    background: active ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', transition: 'all 150ms',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* West: Subcategorieën beheren */}
      {isWest && (
        <div style={{
          padding: 18, borderRadius: 16,
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', marginBottom: 12,
          }}>
            Subcategorieën beheren
          </div>
          {(['voorkant', 'achterkant'] as Department[]).map(dept => {
            const rows = westCategoryOrder?.[dept] ?? [];
            return (
              <div key={dept} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>
                  {dept === 'voorkant' ? 'Bediening' : 'Keuken'}
                </div>
                {rows.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                    Nog geen subcategorieën.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rows.map((row, idx) => (
                      <div key={row.category} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', background: 'hsl(var(--muted) / 0.4)',
                        borderRadius: 8, border: '1px solid hsl(var(--border))',
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
                        <Button size="sm" variant="ghost"
                          onClick={() => handleMove(dept, row.category, -1)}
                          disabled={idx === 0}
                          style={{ height: 28, padding: '0 6px' }} aria-label="Omhoog">
                          <ChevronUp size={14} />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleMove(dept, row.category, 1)}
                          disabled={idx === rows.length - 1}
                          style={{ height: 28, padding: '0 6px' }} aria-label="Omlaag">
                          <ChevronDown size={14} />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleRename(dept, row.category)}
                          style={{ height: 28, padding: '0 6px' }} aria-label="Hernoemen">
                          <Pencil size={14} />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(dept, row.category)}
                          style={{ height: 28, padding: '0 6px', color: 'hsl(var(--destructive))' }}
                          aria-label="Verwijderen">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 6, lineHeight: 1.4 }}>
            Volgorde geldt voor live taken én dropdowns. Verwijderen kan alleen als de categorie leeg is.
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
