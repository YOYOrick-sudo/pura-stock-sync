import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersoneelHousing } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "housing"] as const;

export function useHousing() {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-housing")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_housing" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); if (timer) clearTimeout(timer); };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PersoneelHousing[]> => {
      const { data, error } = await supabase
        .from("personeel_housing")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersoneelHousing[];
    },
  });
}

export function useUpsertHousing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; color: string; capacity: number | null; sort_order?: number }) => {
      const payload = {
        name: input.name,
        color: input.color,
        capacity: input.capacity,
        sort_order: input.sort_order ?? 0,
      };
      if (input.id) {
        const { error } = await supabase.from("personeel_housing").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("personeel_housing").insert(payload);
        if (error) throw error;
      }
    },
    onError: (e: Error) => toast.error(e.message ?? "Opslaan mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHousing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personeel_housing").delete().eq("id", id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message ?? "Verwijderen mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
