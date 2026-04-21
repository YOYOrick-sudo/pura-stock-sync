import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

/**
 * Centralized URL-state for personnel filters.
 * Supports multi-select via comma-separated UUIDs and a free-text search.
 *
 *   ?loc=uuid1,uuid2&team=uuid&housing=uuid&q=jan
 */
export function usePersoneelFilters() {
  const [params, setParams] = useSearchParams();

  const parseList = (key: string): string[] => {
    const raw = params.get(key);
    if (!raw) return [];
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  };

  const filters = useMemo(() => ({
    locations: parseList("loc"),
    teams: parseList("team"),
    housing: parseList("housing"),
    q: params.get("q") ?? "",
  }), [params]);

  const setList = useCallback((key: string, values: string[]) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (values.length === 0) next.delete(key);
      else next.set(key, values.join(","));
      return next;
    }, { replace: true });
  }, [setParams]);

  const setQ = useCallback((q: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (!q) next.delete("q");
      else next.set("q", q);
      return next;
    }, { replace: true });
  }, [setParams]);

  const clear = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const toggleInList = useCallback((key: "loc" | "team" | "housing", value: string) => {
    const current = parseList(key);
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setList(key, next);
  }, [params, setList]);

  const hasAny = filters.locations.length + filters.teams.length + filters.housing.length + (filters.q ? 1 : 0) > 0;

  return {
    filters,
    hasAny,
    setLocations: (v: string[]) => setList("loc", v),
    setTeams: (v: string[]) => setList("team", v),
    setHousing: (v: string[]) => setList("housing", v),
    setQ,
    toggleLocation: (v: string) => toggleInList("loc", v),
    toggleTeam: (v: string) => toggleInList("team", v),
    toggleHousing: (v: string) => toggleInList("housing", v),
    clear,
  };
}
