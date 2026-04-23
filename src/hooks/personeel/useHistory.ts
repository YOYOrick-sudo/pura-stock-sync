import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistoryRow {
  id: string;
  date: string;          // ISO yyyy-MM-dd
  location_id: string | null;
  team_name: string;
  count: number;
}

const KEY = ["personeel", "history"] as const;

export function useHistory() {
  const qc = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ch = supabase
      .channel("personeel-history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "personeel_history" },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => qc.invalidateQueries({ queryKey: KEY }), 300);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (timer) clearTimeout(timer);
    };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase
        .from("personeel_history")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });
}
