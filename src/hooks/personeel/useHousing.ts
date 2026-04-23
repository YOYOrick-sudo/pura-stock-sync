import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersoneelHousing } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "housing"] as const;

export interface HousingUpsertInput {
  id?: string;
  name: string;
  color: string;
  capacity: number | null;
  sort_order?: number;
  address?: string | null;
  cost_per_month?: number | null;
  rooms?: number | null;
  room_size_m2?: number | null;
  contact_name?: string | null;
  facilities?: string[];
  description?: string | null;
  notes?: string | null;
}

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
    mutationFn: async (input: HousingUpsertInput) => {
      const payload: Record<string, unknown> = {
        name: input.name,
        color: input.color,
        capacity: input.capacity,
        sort_order: input.sort_order ?? 0,
      };
      if (input.address !== undefined) payload.address = input.address;
      if (input.cost_per_month !== undefined) payload.cost_per_month = input.cost_per_month;
      if (input.rooms !== undefined) payload.rooms = input.rooms;
      if (input.room_size_m2 !== undefined) payload.room_size_m2 = input.room_size_m2;
      if (input.contact_name !== undefined) payload.contact_name = input.contact_name;
      if (input.facilities !== undefined) payload.facilities = input.facilities;
      if (input.description !== undefined) payload.description = input.description;
      if (input.notes !== undefined) payload.notes = input.notes;

      if (input.id) {
        const { error } = await supabase.from("personeel_housing").update(payload as never).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("personeel_housing").insert(payload as never);
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
