import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Person, PersonInput, PersonUpdate } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "people"] as const;

export function usePeople() {
  const qc = useQueryClient();

  // Realtime invalidation — payload is NEVER read (avoids column-leakage on competence/pay)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-people")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_people" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); if (timer) clearTimeout(timer); };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Person[]> => {
      const { data, error } = await supabase
        .from("personeel_people_full" as never)
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Person[];
    },
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonInput): Promise<Person> => {
      const { data, error } = await supabase
        .from("personeel_people")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as Person;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Person[]>(KEY);
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: Person = {
        id: tempId,
        name: input.name,
        user_id: input.user_id ?? null,
        location_id: input.location_id,
        team_id: input.team_id,
        housing_id: input.housing_id ?? null,
        room_id: input.room_id ?? null,
        start_date: input.start_date,
        end_date: input.end_date,
        days_per_week: input.days_per_week ?? null,
        competence: input.competence ?? null,
        pay: input.pay ?? null,
        notes: input.notes ?? null,
        deleted_at: null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<Person[]>(KEY, (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      toast.error("Opslaan mislukt — probeer opnieuw");
    },
    onSuccess: () => toast.success("Collega opgeslagen"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonUpdate & { id: string }): Promise<Person> => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("personeel_people")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Person;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Person[]>(KEY);
      const { id, ...patch } = input;
      qc.setQueryData<Person[]>(KEY, (old = []) =>
        old.map(p => (p.id === id ? { ...p, ...patch } : p))
      );
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      toast.error("Wijziging niet opgeslagen — probeer opnieuw");
    },
    onSuccess: () => toast.success("Wijziging opgeslagen"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSoftDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("personeel_people")
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Person[]>(KEY);
      qc.setQueryData<Person[]>(KEY, (old = []) => old.filter(p => p.id !== id));
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      toast.error("Verwijderen mislukt — collega is teruggezet");
    },
    onSuccess: () => toast.success("Collega gearchiveerd"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
