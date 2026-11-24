// Een geplande order kan wachten op catalogus en token. Controleer de termijn én dezelfde
// liveperiode opnieuw vlak vóór de onomkeerbare order-POST.
export function planningBlokkade(rij: { ophaaltijd: string }, nu: number): string | null {
  const ophalen = Date.parse(rij.ophaaltijd);
  return Number.isFinite(ophalen) && ophalen > nu ? null : 'Ophaaltijd is voorbij of ongeldig. Beoordeel deze bestelling handmatig.';
}

export async function controleerPlanningVoorPost(
  admin: any,
  rij: { id: string; vestiging: string; versie: number; ophaaltijd: string },
  opening: string,
  nu?: number,
): Promise<string | null> {
  const [vlag, bestelling] = await Promise.all([
    admin.from('fase2_vlag').select('aan, gewijzigd_op')
      .eq('vestiging', rij.vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle(),
    admin.from('externe_bestellingen').select('status, versie')
      .eq('id', rij.id).maybeSingle(),
  ]);
  if (vlag.error || bestelling.error || !vlag.data?.aan || vlag.data.gewijzigd_op !== opening) {
    return 'Liveverzending is onderbroken of kon niet worden gecontroleerd. Beoordeel deze bestelling handmatig.';
  }
  if (bestelling.data?.status !== 'verzenden' || bestelling.data.versie !== rij.versie) {
    return 'De bestelling is tijdens de verzendvoorbereiding gewijzigd.';
  }
  return planningBlokkade(rij, nu ?? Date.now());
}
