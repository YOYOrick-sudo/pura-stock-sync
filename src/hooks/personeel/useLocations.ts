import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersoneelLocation } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "locations"] as const;

export function useLocations() {
  const qc = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_locations" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); if (timer) clearTimeout(timer); };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PersoneelLocation[]> => {
      const { data, error } = await supabase
        .from("personeel_locations")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersoneelLocation[];
    },
  });
}

export function useUpsertLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; sort_order?: number }) => {
      if (input.id) {
        const { error } = await supabase
          .from("personeel_locations")
          .update({ name: input.name, sort_order: input.sort_order ?? 0 })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personeel_locations")
          .insert({ name: input.name, sort_order: input.sort_order ?? 0 });
        if (error) throw error;
      }
    },
    onError: (e: Error) => toast.error(e.message ?? "Opslaan mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personeel_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message ?? "Verwijderen mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
