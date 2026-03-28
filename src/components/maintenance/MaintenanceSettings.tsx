import { useState } from 'react';
import { ArrowLeft, Plus, UserCog, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMaintenanceUsers, useCreateMaintenanceUser, useUpdateMaintenanceUser } from '@/hooks/maintenance/useMaintenanceUsers';
import { useMaintenanceSettings, useUpdateSetting } from '@/hooks/maintenance/useMaintenanceSettings';
import type { MaintenanceRol, Vestiging } from '@/types/maintenance';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface MaintenanceSettingsProps {
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  borderRadius: '16px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
  padding: '24px',
};

const backButtonStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: '14px',
  border: '1.5px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'all 150ms ease',
};

export function MaintenanceSettings({ onBack }: MaintenanceSettingsProps) {
  const { data: users, isLoading: usersLoading } = useMaintenanceUsers();
  const { data: settings } = useMaintenanceSettings();
  const createUser = useCreateMaintenanceUser();
  const updateUser = useUpdateMaintenanceUser();
  const updateSetting = useUpdateSetting();

  const [showAddUser, setShowAddUser] = useState(false);
  const [newNaam, setNewNaam] = useState('');
  const [newRol, setNewRol] = useState<MaintenanceRol>('teamleider');
  const [newVestiging, setNewVestiging] = useState<Vestiging>('west');
  const [newPin, setNewPin] = useState('');

  const [editEmail, setEditEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');

  const notificationEmail = settings?.find(s => s.key === 'notification_email')?.value ?? 'info@puravidafoodbar.nl';

  const handleAddUser = async () => {
    if (!newNaam.trim() || newPin.length !== 4) {
      toast.error('Vul een naam en 4-cijferige pincode in');
      return;
    }
    try {
      await createUser.mutateAsync({
        naam: newNaam.trim(),
        rol: newRol,
        vestiging: newVestiging,
        pincode: newPin,
      });
      toast.success(`${newNaam.trim()} toegevoegd`);
      setShowAddUser(false);
      setNewNaam('');
      setNewPin('');
    } catch {
      toast.error('Kon gebruiker niet toevoegen');
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean, naam: string) => {
    try {
      await updateUser.mutateAsync({ id: userId, actief: !currentActive });
      toast.success(`${naam} ${!currentActive ? 'geactiveerd' : 'gedeactiveerd'}`);
    } catch {
      toast.error('Kon status niet wijzigen');
    }
  };

  const handleSaveEmail = async () => {
    if (!emailValue.trim()) return;
    try {
      await updateSetting.mutateAsync({ key: 'notification_email', value: emailValue.trim() });
      toast.success('E-mailadres opgeslagen');
      setEditEmail(false);
    } catch {
      toast.error('Kon e-mailadres niet opslaan');
    }
  };

  return (
    <div className="space-y-6" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={backButtonStyle} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          Instellingen
        </h1>
      </div>

      {/* E-mail instellingen */}
      <div style={cardStyle}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            E-mailmeldingen
          </h2>
        </div>

        {editEmail ? (
          <div className="flex gap-2">
            <Input
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="E-mailadres voor meldingen"
              type="email"
              className="flex-1 rounded-[14px] border-1.5 text-sm"
            />
            <Button onClick={handleSaveEmail} className="rounded-[14px]">
              Opslaan
            </Button>
            <Button variant="outline" onClick={() => setEditEmail(false)} className="rounded-[14px] border-1.5">
              Annuleren
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-foreground">
              {notificationEmail}
            </p>
            <Button
              variant="outline"
              onClick={() => { setEmailValue(notificationEmail); setEditEmail(true); }}
              className="rounded-[14px] border-1.5 text-sm"
            >
              Wijzigen
            </Button>
          </div>
        )}
      </div>

      {/* Gebruikersbeheer */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Pincodes beheren
            </h2>
          </div>
          <Button
            onClick={() => setShowAddUser(true)}
            className="rounded-[14px] text-sm"
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </Button>
        </div>

        {usersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-[14px]" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users?.map(u => (
              <div
                key={u.id}
                className="rounded-[14px] p-3 px-4 flex items-center justify-between transition-all duration-200"
                style={{
                  backgroundColor: u.actief ? 'hsl(var(--muted))' : 'hsl(var(--destructive) / 0.08)',
                }}
              >
                <div>
                  <p className="text-[15px] font-medium" style={{ color: u.actief ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                    {u.naam}
                    {!u.actief && <span className="text-xs ml-2 text-destructive">Inactief</span>}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {u.rol} &middot; {u.vestiging}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(u.id, u.actief, u.naam)}
                  className="rounded-[10px] border-1.5 text-xs"
                >
                  {u.actief ? (
                    <><EyeOff className="h-3.5 w-3.5 mr-1" /> Deactiveren</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5 mr-1" /> Activeren</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add user dialog */}
      <AlertDialog open={showAddUser} onOpenChange={setShowAddUser}>
        <AlertDialogContent className="rounded-[24px] border border-border p-8 max-w-[480px] shadow-lg bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Nieuwe gebruiker
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Maak een pincode aan voor een teamleider of eigenaar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-[13px] font-semibold text-foreground">Naam</label>
              <Input
                value={newNaam}
                onChange={(e) => setNewNaam(e.target.value)}
                placeholder="Naam"
                className="mt-1 rounded-[14px] border-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-foreground">Pincode (4 cijfers)</label>
              <Input
                value={newPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setNewPin(v);
                }}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                className="mt-1 rounded-[14px] border-1.5 text-sm tracking-[4px]"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-foreground">Rol</label>
              <div className="flex gap-2 mt-1">
                {(['teamleider', 'eigenaar'] as MaintenanceRol[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewRol(r)}
                    className="capitalize"
                    style={{
                      flex: 1, padding: '10px', borderRadius: '14px',
                      border: newRol === r ? '2px solid hsl(var(--primary))' : '1.5px solid hsl(var(--border))',
                      backgroundColor: newRol === r ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                      color: newRol === r ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 200ms ease',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-foreground">Vestiging</label>
              <div className="flex gap-2 mt-1">
                {(['west', 'midsland'] as Vestiging[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setNewVestiging(v)}
                    className="capitalize"
                    style={{
                      flex: 1, padding: '10px', borderRadius: '14px',
                      border: newVestiging === v ? '2px solid hsl(var(--primary))' : '1.5px solid hsl(var(--border))',
                      backgroundColor: newVestiging === v ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                      color: newVestiging === v ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 200ms ease',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setNewNaam(''); setNewPin(''); }}
              className="rounded-[14px] border-1.5"
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddUser}
              disabled={!newNaam.trim() || newPin.length !== 4}
              className="rounded-[14px]"
            >
              Toevoegen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
