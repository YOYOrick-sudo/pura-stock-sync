import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersoneelRoom } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "rooms"] as const;

export interface RoomUpsertInput {
  id?: string;
  housing_id: string;
  name: string;
  size_m2?: number | null;
  capacity?: number;
  sort_order?: number;
  notes?: string | null;
}

export function useRooms() {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_rooms" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (timer) clearTimeout(timer);
    };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PersoneelRoom[]> => {
      const { data, error } = await supabase
        .from("personeel_rooms")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersoneelRoom[];
    },
  });
}

export function useRoomsByHousing(housingId: string | null) {
  const { data: rooms = [], ...rest } = useRooms();
  const filtered = useMemo(
    () => (housingId ? rooms.filter(r => r.housing_id === housingId) : []),
    [rooms, housingId],
  );
  return { ...rest, data: filtered };
}

export function useUpsertRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoomUpsertInput) => {
      const payload: Record<string, unknown> = {
        housing_id: input.housing_id,
        name: input.name,
      };
      if (input.size_m2 !== undefined) payload.size_m2 = input.size_m2;
      if (input.capacity !== undefined) payload.capacity = input.capacity;
      if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
      if (input.notes !== undefined) payload.notes = input.notes;

      if (input.id) {
        const { error } = await supabase.from("personeel_rooms").update(payload as never).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("personeel_rooms").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => toast.success("Kamer opgeslagen"),
    onError: (e: Error) => toast.error(e.message ?? "Opslaan mislukt"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personeel_rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Kamer verwijderd"),
    onError: (e: Error) => toast.error(e.message ?? "Verwijderen mislukt"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Personen kunnen room_id = NULL hebben gekregen door ON DELETE SET NULL
      qc.invalidateQueries({ queryKey: ["personeel", "people"] });
    },
  });
}
