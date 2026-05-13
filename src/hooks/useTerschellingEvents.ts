import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getNextEvent as getStaticNextEvent,
  getUpcomingEvents as getStaticUpcomingEvents,
  getDaysUntil,
  formatEventDate,
  TERSCHELLING_EVENTS,
} from '@/lib/terschelling-events';

export interface DbEvent {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  description: string | null;
  category: string | null;
  location: string | null;
  source_url: string | null;
}

function dbEventToStatic(e: DbEvent) {
  return {
    name: e.name,
    startDate: e.start_date,
    endDate: e.end_date ?? undefined,
    description: e.description ?? undefined,
    category: (e.category as any) ?? undefined,
    location: e.location ?? undefined,
  };
}

/** Lees events uit DB, val terug op statische lijst als DB leeg is */
export function useTerschellingEvents() {
  return useQuery<DbEvent[]>({
    queryKey: ['terschelling-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terschelling_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Als DB leeg is, return leeg zodat fallback in component werkt
      return (data ?? []) as DbEvent[];
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

/** Eerstvolgend event: DB voorrang, anders statisch */
export function useNextEvent() {
  const { data: dbEvents } = useTerschellingEvents();

  if (dbEvents && dbEvents.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = dbEvents
      .filter((e) => new Date(e.start_date) >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (upcoming[0]) {
      return {
        name: upcoming[0].name,
        startDate: upcoming[0].start_date,
        endDate: upcoming[0].end_date ?? undefined,
        description: upcoming[0].description ?? undefined,
        category: (upcoming[0].category as any) ?? undefined,
        location: upcoming[0].location ?? undefined,
      };
    }
  }

  return getStaticNextEvent();
}

/** Aantal komende events */
export function useUpcomingEventsCount() {
  const { data: dbEvents } = useTerschellingEvents();

  if (dbEvents && dbEvents.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dbEvents.filter((e) => new Date(e.start_date) >= today).length;
  }

  return getStaticUpcomingEvents(999).length;
}

export { getDaysUntil, formatEventDate };
