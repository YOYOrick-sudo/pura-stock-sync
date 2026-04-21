import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * True if current user has owner / manager / admin role.
 */
export function useIsManager() {
  const qc = useQueryClient();

  // Realtime: when user_roles changes, invalidate
  useEffect(() => {
    const ch = supabase
      .channel("personeel-is-manager")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        qc.invalidateQueries({ queryKey: ["personeel", "is-manager"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ["personeel", "is-manager"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) return false;
      return (data ?? []).some(r => ["owner", "manager", "admin"].includes(r.role as string));
    },
    staleTime: 5 * 60 * 1000,
  });
}
