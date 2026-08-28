import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserPlus, MoreVertical, Loader2, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';

type Role = 'staff' | 'manager' | 'owner';
type Location = 'West' | 'Midsland';
type Status = 'active' | 'invited' | 'deactivated';

interface TeamMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role | 'admin' | null;
  locations: Location[];
  status: Status;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  mag_loonkosten_zien?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff', manager: 'Manager', owner: 'Owner', admin: 'Owner',
};

const STATUS_LABELS: Record<Status, string> = {
  active: 'Actief', invited: 'Uitnodiging verstuurd', deactivated: 'Gedeactiveerd',
};

const STATUS_VARIANTS: Record<Status, string> = {
  active: 'bg-primary/10 text-primary border-primary/20',
  invited: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  deactivated: 'bg-muted text-muted-foreground border-border',
};

export default function Team() {
  const { loading: roleLoading, isOwner, userId: myId } = useRole();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-list-team');
    if (error) {
      toast.error('Kon team niet laden');
      setLoading(false);
      return;
    }
    setTeam(data.team ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isOwner) load();
  }, [isOwner]);

  if (roleLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }
  if (!isOwner) return <Navigate to="/dashboard" replace />;

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-muted-foreground text-sm">
              Beheer teamleden, rollen en toegang.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="rounded-polar-md">
            <UserPlus className="h-4 w-4 mr-2" />
            Teamlid uitnodigen
          </Button>
        </div>

        <Card className="rounded-polar-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Locatie(s)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Loonkosten</TableHead>
                  <TableHead>Laatst actief</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(team ?? []).map(m => (
                  <TeamRow
                    key={m.user_id}
                    member={m}
                    isSelf={m.user_id === myId}
                    onChanged={load}
                    onLocalUpdate={(patch) => setTeam(prev => prev?.map(r => r.user_id === m.user_id ? { ...r, ...patch } : r) ?? prev)}
                  />
                ))}
                {team?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nog geen teamleden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onDone={load} />
    </SidebarLayout>
  );
}

function TeamRow({ member, isSelf, onChanged, onLocalUpdate }: {
  member: TeamMember; isSelf: boolean; onChanged: () => void;
  onLocalUpdate: (patch: Partial<TeamMember>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [loonBusy, setLoonBusy] = useState(false);

  const displayRole = member.role ? ROLE_LABELS[member.role] ?? member.role : '—';
  const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || '—';

  const invokeUpdate = async (payload: any, successMsg: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-update-team-member', {
      body: payload,
    });
    setBusy(false);
    if (error || data?.error) {
      const err = data?.error ?? error?.message ?? 'onbekende_fout';
      if (err === 'last_owner_protection') {
        toast.error('Kan niet: laatste actieve owner moet blijven.');
      } else if (err === 'cannot_deactivate_self') {
        toast.error('Je kunt jezelf niet deactiveren.');
      } else {
        toast.error(`Mislukt: ${err}`);
      }
      return;
    }
    toast.success(successMsg);
    onChanged();
  };

  const changeRole = (newRole: Role) => invokeUpdate(
    { action: 'update_role', user_id: member.user_id, role: newRole },
    'Rol bijgewerkt'
  );

  const toggleActive = () => invokeUpdate(
    { action: 'set_active', user_id: member.user_id, is_active: member.status === 'deactivated' },
    member.status === 'deactivated' ? 'Heractiveerd' : 'Gedeactiveerd'
  );

  const resend = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-invite-user', {
      body: {
        mode: 'resend',
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role === 'admin' ? 'owner' : member.role,
        locations: member.locations,
      },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(`Opnieuw versturen mislukt: ${data?.error ?? error?.message}`);
      return;
    }
    toast.success('Uitnodiging opnieuw verstuurd');
    onChanged();
  };

  const setLocations = (locs: Location[]) => invokeUpdate(
     { action: 'update_locations', user_id: member.user_id, locations: locs },
     'Locaties bijgewerkt'
   );

  const bewaarNaam = async () => {
    const schoon = naam.trim();
    if (!schoon) { setNaamOpen(false); return; }
    const [voor, ...rest] = schoon.split(' ');
    await invokeUpdate(
      { action: 'update_name', user_id: member.user_id, first_name: voor, last_name: rest.join(' ') },
      'Naam bijgewerkt',
    );
    setNaamOpen(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {naamOpen ? (
          <Input
            autoFocus
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            onBlur={bewaarNaam}
            onKeyDown={(e) => e.key === 'Enter' && bewaarNaam()}
            placeholder="Naam of teamnaam"
            className="h-8 w-44"
          />
        ) : (
          <button
            type="button"
            className="text-left hover:underline"
            onClick={() => { setNaam(displayName === '—' ? '' : displayName); setNaamOpen(true); }}
            title="Klik om de weergavenaam aan te passen"
          >
            {displayName}
          </button>
        )}
        {isSelf && <span className="text-muted-foreground text-xs ml-1">(jij)</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{member.email}</TableCell>

      <TableCell>
        <Select
          value={member.role === 'admin' ? 'owner' : (member.role ?? 'staff')}
          onValueChange={(v) => changeRole(v as Role)}
          disabled={busy}
        >
          <SelectTrigger className="w-32 h-8 rounded-polar-md">
            <SelectValue>{displayRole}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {member.locations.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
          {member.locations.map(l => (
            <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${STATUS_VARIANTS[member.status]} border`}>
          {STATUS_LABELS[member.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <LoonkostenToggle
          member={member}
          isSelf={isSelf}
          busy={loonBusy}
          onChange={async (next) => {
            const isOwnerRow = member.role === 'owner' || member.role === 'admin';
            if (isSelf && isOwnerRow) return; // owner mag zichzelf niet wijzigen
            const prev = !!member.mag_loonkosten_zien;
            setLoonBusy(true);
            onLocalUpdate({ mag_loonkosten_zien: next }); // optimistic
            const { error } = await supabase
              .from('profiles')
              .update({ mag_loonkosten_zien: next })
              .eq('user_id', member.user_id);
            setLoonBusy(false);
            if (error) {
              onLocalUpdate({ mag_loonkosten_zien: prev }); // rollback
              const msg = /owner/i.test(error.message) || /permission/i.test(error.message)
                ? 'Alleen de eigenaar kan dit wijzigen'
                : `Kon niet bijwerken: ${error.message}`;
              toast.error(msg);
              return;
            }
            toast.success(next ? 'Loonkosten-toegang aan' : 'Loonkosten-toegang uit');
          }}
        />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {member.last_sign_in_at
          ? new Date(member.last_sign_in_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={busy} className="h-8 w-8">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocations(['West'])} disabled={busy}>
              Alleen West
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocations(['Midsland'])} disabled={busy}>
              Alleen Midsland
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocations(['West', 'Midsland'])} disabled={busy}>
              Beide locaties
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {member.status === 'invited' && (
              <DropdownMenuItem onClick={resend} disabled={busy}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Uitnodiging opnieuw versturen
              </DropdownMenuItem>
            )}
            {!isSelf && (
              <DropdownMenuItem onClick={toggleActive} disabled={busy} className="text-destructive">
                {member.status === 'deactivated' ? 'Heractiveren' : 'Deactiveren'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InviteDialog({ open, onOpenChange, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [west, setWest] = useState(true);
  const [midsland, setMidsland] = useState(true);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFirstName(''); setLastName(''); setEmail(''); setRole('staff');
    setWest(true); setMidsland(true);
  };

  const submit = async () => {
    if (!email.trim()) return toast.error('E-mail is verplicht');
    const locs: Location[] = [];
    if (west) locs.push('West');
    if (midsland) locs.push('Midsland');
    if (locs.length === 0) return toast.error('Kies minstens één locatie');

    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-invite-user', {
      body: {
        email: email.trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role,
        locations: locs,
        redirect_to: `${window.location.origin}/auth/set-password`,
      },
    });
    setBusy(false);
    if (error || data?.error) {
      const err = data?.error ?? error?.message ?? 'onbekende_fout';
      if (err === 'user_already_confirmed') {
        toast.error('Dit e-mailadres is al in gebruik door een actieve account.');
      } else {
        toast.error(`Uitnodigen mislukt: ${err}`);
      }
      return;
    }
    toast.success('Uitnodiging verstuurd');
    reset();
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Teamlid uitnodigen</DialogTitle>
          <DialogDescription>
            Er wordt een uitnodigingsmail verstuurd met een link om een wachtwoord te kiezen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Voornaam</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Achternaam</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-mail *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff — dashboard, taken, stickers, recepten, kassatelling, onderhoud melden</SelectItem>
                <SelectItem value="manager">Manager — + onderhoud afhandelen, taken-admin, kas-controle, personeel</SelectItem>
                <SelectItem value="owner">Owner — volledige toegang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Locatie(s)</Label>
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={west} onCheckedChange={(v) => setWest(v === true)} />
                West
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={midsland} onCheckedChange={(v) => setMidsland(v === true)} />
                Midsland
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Uitnodiging versturen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoonkostenToggle({ member, isSelf, busy, onChange }: {
  member: TeamMember; isSelf: boolean; busy: boolean;
  onChange: (next: boolean) => void;
}) {
  const isOwnerRow = member.role === 'owner' || member.role === 'admin';
  const forced = isOwnerRow; // owner ziet altijd loonkosten
  const checked = forced ? true : !!member.mag_loonkosten_zien;
  const disabled = forced || busy || member.status === 'deactivated';

  const sw = (
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
    />
  );

  if (!forced && member.status !== 'deactivated') return sw;

  const reason = forced
    ? 'Owner ziet altijd loonkosten'
    : 'Gedeactiveerde gebruiker';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex opacity-90">{sw}</span>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
