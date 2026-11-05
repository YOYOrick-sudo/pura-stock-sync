import { planBordVervolg, type BordStap } from './taakVervolg';

type RpcAntwoord = { data: unknown; error: { message: string } | null };

export type BordClient = {
  rpc: (naam: string, args: Record<string, unknown>) => Promise<RpcAntwoord>;
  openSignaal: (vestiging: string, naam: string) => Promise<{ id: string } | null>;
  zoek: (vestiging: string, naam: string) => Promise<{
    artikelId: string | null;
    artikelVormId: string | null;
    leverancierId: string | null;
  } | null>;
};

export type BordUitkomst = {
  gekoppeld: boolean;
  reden?: string;
  artikelAangemaakt: boolean;
};

/**
 * Bordregel via bord_regel_koppelen of bord_artikel_aanmaken.
 * Geen insert in bestel_signalen.
 */
export async function bestelbordViaRpc(
  client: BordClient,
  input: { vestiging: string; naam: string; eenheid: string; leverancierId?: string | null },
): Promise<BordUitkomst> {
  const open = await client.openSignaal(input.vestiging, input.naam);
  const gevonden = await client.zoek(input.vestiging, input.naam);
  const plan = planBordVervolg({
    vestiging: input.vestiging,
    naam: input.naam,
    eenheid: input.eenheid,
    openSignaalId: open?.id ?? null,
    artikelId: gevonden?.artikelId ?? null,
    artikelVormId: gevonden?.artikelVormId ?? null,
    leverancierId: input.leverancierId ?? gevonden?.leverancierId ?? null,
  });
  return voerBordPlanUit(client, plan, open?.id ?? null);
}

export async function voerBordPlanUit(
  client: Pick<BordClient, 'rpc'>,
  plan: BordStap[],
  openSignaalId: string | null,
): Promise<BordUitkomst> {
  let artikelAangemaakt = false;
  let gekoppeld = false;
  let reden = 'De bordregel is niet gekoppeld.';
  for (const stap of plan) {
    if (stap.rpc === 'bord_regel_koppelen') {
      const koppel = await client.rpc('bord_regel_koppelen', { ...stap.args });
      if (koppel.error) throw new Error(koppel.error.message);
      gekoppeld = true;
    } else if (stap.rpc === 'bord_artikel_aanmaken') {
      const kopie = { ...stap.args };
      const gemaakt = await client.rpc('bord_artikel_aanmaken', kopie);
      if (gemaakt.error) throw new Error(gemaakt.error.message);
      artikelAangemaakt = true;
      const data = gemaakt.data as { artikel_id?: string; artikel_vorm_id?: string } | null;
      if (openSignaalId && data?.artikel_id && data?.artikel_vorm_id) {
        const koppel = await client.rpc('bord_regel_koppelen', {
          p_signaal_id: openSignaalId,
          p_artikel_id: data.artikel_id,
          p_artikel_vorm_id: data.artikel_vorm_id,
        });
        if (koppel.error) throw new Error(koppel.error.message);
        gekoppeld = true;
      }
    } else if (stap.rpc === 'geen') {
      reden = stap.reden;
    }
  }
  if (gekoppeld) return { gekoppeld: true, artikelAangemaakt };
  return { gekoppeld: false, reden, artikelAangemaakt };
}
