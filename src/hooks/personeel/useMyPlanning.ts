import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Person } from "@/types/personeel";

/**
 * Returns the planning entries linked to the current user's auth.uid().
 * Reads via personeel_people_full so deleted are filtered.
 */
export function useMyPlanning() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setUserId(sess?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return useQuery({
    queryKey: ["personeel", "my", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Person[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("personeel_people_full" as never)
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Person[];
    },
  });
}
