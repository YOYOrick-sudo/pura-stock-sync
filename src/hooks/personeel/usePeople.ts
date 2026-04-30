import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Person, PersonInput, PersonUpdate, PersonAssignment } from "@/types/personeel";
import { toast } from "sonner";

const KEY = ["personeel", "people"] as const;

/** Normalize: ensure assignments[] exists; primary = first assignment or legacy fallback. */
function normalize(p: Person): Person {
  const assignments: PersonAssignment[] =
    Array.isArray(p.assignments) && p.assignments.length > 0
      ? p.assignments
      : p.location_id && p.team_id
      ? [{ location_id: p.location_id, team_id: p.team_id }]
      : [];
  const primary = assignments[0];
  return {
    ...p,
    assignments,
    location_id: primary?.location_id ?? p.location_id,
    team_id: primary?.team_id ?? p.team_id,
  };
}

export function usePeople() {
  const qc = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
    };
    const ch = supabase
      .channel("personeel-people")
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_people" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "personeel_people_locations" }, refetch)
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
      return ((data ?? []) as Person[]).map(normalize);
    },
  });
}

/** Sync assignments table to match desired list for a person. */
async function syncAssignments(personId: string, assignments: PersonAssignment[]) {
  // Fetch current
  const { data: current, error: selErr } = await supabase
    .from("personeel_people_locations")
    .select("id,location_id,team_id")
    .eq("person_id", personId);
  if (selErr) throw selErr;

  const currentMap = new Map((current ?? []).map((r) => [r.location_id, r]));
  const desiredMap = new Map(assignments.map((a) => [a.location_id, a]));

  // Delete removed
  const toDelete = (current ?? []).filter((r) => !desiredMap.has(r.location_id)).map((r) => r.id);
  if (toDelete.length > 0) {
    const { error } = await supabase.from("personeel_people_locations").delete().in("id", toDelete);
    if (error) throw error;
  }

  // Insert new + update changed team
  for (const a of assignments) {
    const existing = currentMap.get(a.location_id);
    if (!existing) {
      const { error } = await supabase
        .from("personeel_people_locations")
        .insert({ person_id: personId, location_id: a.location_id, team_id: a.team_id });
      if (error) throw error;
    } else if (existing.team_id !== a.team_id) {
      const { error } = await supabase
        .from("personeel_people_locations")
        .update({ team_id: a.team_id })
        .eq("id", existing.id);
      if (error) throw error;
    }
  }
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonInput): Promise<Person> => {
      if (!input.assignments || input.assignments.length === 0) {
        throw new Error("Minimaal één locatie/team is vereist");
      }
      const primary = input.assignments[0];
      // Insert person row with primary as legacy values
      const { data: created, error } = await supabase
        .from("personeel_people")
        .insert({
          name: input.name,
          user_id: input.user_id ?? null,
          location_id: primary.location_id,
          team_id: primary.team_id,
          housing_id: input.housing_id ?? null,
          room_id: input.room_id ?? null,
          start_date: input.start_date,
          end_date: input.end_date,
          days_per_week: input.days_per_week ?? null,
          competence: input.competence ?? null,
          pay: input.pay ?? null,
          notes: input.notes ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      const person = created as Person;
      await syncAssignments(person.id, input.assignments);
      return normalize({ ...person, assignments: input.assignments });
    },
    onError: () => toast.error("Opslaan mislukt — probeer opnieuw"),
    onSuccess: () => toast.success("Collega opgeslagen"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonUpdate & { id: string }): Promise<Person> => {
      const { id, assignments, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };

      // If assignments provided, sync primary fields too
      if (assignments && assignments.length > 0) {
        patch.location_id = assignments[0].location_id;
        patch.team_id = assignments[0].team_id;
      }

      const { data, error } = await supabase
        .from("personeel_people")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (assignments) {
        await syncAssignments(id, assignments);
      }

      return normalize({ ...(data as Person), assignments: assignments ?? (data as Person).assignments });
    },
    onError: () => toast.error("Wijziging niet opgeslagen — probeer opnieuw"),
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
      qc.setQueryData<Person[]>(KEY, (old = []) => old.filter((p) => p.id !== id));
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
