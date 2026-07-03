// /taken/admin — overzicht van alle takenlijsten met sidebar zichtbaar.
// West werkt allround: één kaart per fase (geen Bediening/Keuken splitsing).
// Onderdelen worden per lijst beheerd op /taken/beheer.
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/SidebarLayout';

type Phase = 'open' | 'tussen' | 'borrel' | 'sluit';
type Department = 'voorkant' | 'achterkant';

interface ListCard {
  key: string;
  phase: Phase;
  department?: Department;
  title: string;
  taskCount: number;
  categoryCount: number;
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
  const isWest = userLocation === 'West';
  const isManagedLocation = userLocation === 'West' || userLocation === 'Midsland';

  // Actieve templates per locatie — voor het tellen van taken per fase.
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

  // Aantal onderdelen per fase (uit foh_category_order).
  const { data: categoryCountsByPhase } = useQuery({
    queryKey: ['foh-admin-category-counts', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_category_order')
        .select('phase, category')
        .eq('location', userLocation);
      if (error) throw error;
      const counts: Record<string, Set<string>> = {};
      for (const r of (data as any[]) || []) {
        const p = r.phase as string | null;
        const c = (r.category || '').trim();
        if (!p || !c) continue;
        (counts[p] ||= new Set<string>()).add(c);
      }
      const out: Record<string, number> = {};
      for (const p of Object.keys(counts)) out[p] = counts[p].size;
      return out;
    },
    enabled: isManagedLocation,
  });

  const cards: ListCard[] = useMemo(() => {
    if (!templates) return [];
    const catCount = (p: Phase) => categoryCountsByPhase?.[p] ?? 0;

    if (isWest) {
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
          categoryCount: catCount(phase),
        }));
    }

    // Midsland: altijd alle 4 fasen tonen
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
      categoryCount: catCount(phase),
    }));
  }, [templates, isWest, categoryCountsByPhase]);

  const openList = (card: ListCard) => {
    const params = new URLSearchParams({
      location: userLocation,
      phase: card.phase,
    });
    if (card.department) params.set('dept', card.department);
    navigate(`/taken/beheer?${params.toString()}`);
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
            Kies een lijst om te bewerken — taken en onderdelen per lijst apart.
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
                  {isManagedLocation && (
                    <> · {card.categoryCount} {card.categoryCount === 1 ? 'onderdeel' : 'onderdelen'}</>
                  )}
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
