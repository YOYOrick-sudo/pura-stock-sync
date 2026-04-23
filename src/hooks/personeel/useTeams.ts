import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersoneelTeam } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "teams"] as const;

export function useTeams() {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-teams")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_teams" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); if (timer) clearTimeout(timer); };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PersoneelTeam[]> => {
      const { data, error } = await supabase
        .from("personeel_teams")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersoneelTeam[];
    },
  });
}

/** Filtert teams op vestiging. Geeft lege array als locationId niet gezet is. */
export function useTeamsByLocation(locationId: string | null | undefined) {
  const { data: teams = [], ...rest } = useTeams();
  const filtered = useMemo(() => {
    if (!locationId) return [] as PersoneelTeam[];
    return teams.filter(t => t.location_id === locationId);
  }, [teams, locationId]);
  return { ...rest, data: filtered };
}

export function useUpsertTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; location_id: string; sort_order?: number }) => {
      if (input.id) {
        const { error } = await supabase
          .from("personeel_teams")
          .update({ name: input.name, location_id: input.location_id, sort_order: input.sort_order ?? 0 })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personeel_teams")
          .insert({ name: input.name, location_id: input.location_id, sort_order: input.sort_order ?? 0 });
        if (error) throw error;
      }
    },
    onError: (e: Error) => toast.error(e.message ?? "Opslaan mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personeel_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message ?? "Verwijderen mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
