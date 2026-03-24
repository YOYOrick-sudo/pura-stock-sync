import { useState } from 'react';
import { ArrowLeft, Plus, UserCog, Mail, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
        <button
          onClick={onBack}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          className="hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: '#282E3A' }} />
        </button>
        <h1 style={{
          fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#282E3A',
        }}>
          Instellingen
        </h1>
      </div>

      {/* E-mail instellingen */}
      <Card style={{
        padding: '24px', borderRadius: '16px',
        border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5" style={{ color: '#1B7867' }} />
          <h2 style={{
            fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#282E3A',
          }}>
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
              style={{
                flex: 1, backgroundColor: '#FFFFFF', borderRadius: '12px',
                border: '1px solid rgba(197, 197, 202, 0.5)', padding: '12px 16px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px',
              }}
            />
            <Button onClick={handleSaveEmail} style={{
              borderRadius: '12px', backgroundColor: '#1B7867', color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
            }}>
              Opslaan
            </Button>
            <Button variant="outline" onClick={() => setEditEmail(false)} style={{
              borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
            }}>
              Annuleren
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#282E3A' }}>
              {notificationEmail}
            </p>
            <Button
              variant="outline"
              onClick={() => { setEmailValue(notificationEmail); setEditEmail(true); }}
              style={{
                borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                border: '1px solid rgba(197, 197, 202, 0.5)',
              }}
            >
              Wijzigen
            </Button>
          </div>
        )}
      </Card>

      {/* Gebruikersbeheer */}
      <Card style={{
        padding: '24px', borderRadius: '16px',
        border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5" style={{ color: '#1B7867' }} />
            <h2 style={{
              fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#282E3A',
            }}>
              Pincodes beheren
            </h2>
          </div>
          <Button
            onClick={() => setShowAddUser(true)}
            style={{
              borderRadius: '12px', backgroundColor: '#1B7867', color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </Button>
        </div>

        {usersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users?.map(u => (
              <div
                key={u.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: u.actief ? '#F8FAFC' : '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 200ms ease',
                }}
              >
                <div>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500,
                    color: u.actief ? '#282E3A' : '#94A3B8',
                  }}>
                    {u.naam}
                    {!u.actief && <span style={{ fontSize: '12px', marginLeft: '8px', color: '#EF4444' }}>Inactief</span>}
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94A3B8',
                    textTransform: 'capitalize',
                  }}>
                    {u.rol} &middot; {u.vestiging}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(u.id, u.actief, u.naam)}
                  style={{
                    borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '12px',
                    border: '1px solid rgba(197, 197, 202, 0.5)',
                  }}
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
      </Card>

      {/* Add user dialog */}
      <AlertDialog open={showAddUser} onOpenChange={setShowAddUser}>
        <AlertDialogContent style={{
          backgroundColor: '#FEFFF1', borderRadius: '20px',
          border: '1px solid rgba(197, 197, 202, 0.5)', padding: '32px',
          maxWidth: '480px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{
              fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#282E3A',
            }}>
              Nieuwe gebruiker
            </AlertDialogTitle>
            <AlertDialogDescription style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#73747B',
            }}>
              Maak een pincode aan voor een teamleider of eigenaar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#282E3A' }}>
                Naam
              </label>
              <Input
                value={newNaam}
                onChange={(e) => setNewNaam(e.target.value)}
                placeholder="Naam"
                style={{
                  marginTop: '4px', backgroundColor: '#FFFFFF', borderRadius: '12px',
                  border: '1px solid rgba(197, 197, 202, 0.5)', padding: '12px 16px',
                  fontFamily: 'Inter, sans-serif', fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#282E3A' }}>
                Pincode (4 cijfers)
              </label>
              <Input
                value={newPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setNewPin(v);
                }}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                style={{
                  marginTop: '4px', backgroundColor: '#FFFFFF', borderRadius: '12px',
                  border: '1px solid rgba(197, 197, 202, 0.5)', padding: '12px 16px',
                  fontFamily: 'Inter, sans-serif', fontSize: '14px', letterSpacing: '4px',
                }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#282E3A' }}>
                Rol
              </label>
              <div className="flex gap-2 mt-1">
                {(['teamleider', 'eigenaar'] as MaintenanceRol[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setNewRol(r)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '12px',
                      border: newRol === r ? '2px solid #1B7867' : '1px solid rgba(197, 197, 202, 0.5)',
                      backgroundColor: newRol === r ? '#E6F4F1' : '#FFFFFF',
                      color: newRol === r ? '#1B7867' : '#73747B',
                      fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#282E3A' }}>
                Vestiging
              </label>
              <div className="flex gap-2 mt-1">
                {(['west', 'midsland'] as Vestiging[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setNewVestiging(v)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '12px',
                      border: newVestiging === v ? '2px solid #1B7867' : '1px solid rgba(197, 197, 202, 0.5)',
                      backgroundColor: newVestiging === v ? '#E6F4F1' : '#FFFFFF',
                      color: newVestiging === v ? '#1B7867' : '#73747B',
                      fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', textTransform: 'capitalize',
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
              style={{
                backgroundColor: 'transparent', color: '#282E3A', borderRadius: '16px',
                border: '1px solid rgba(197, 197, 202, 0.5)', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', fontWeight: 500,
              }}
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddUser}
              disabled={!newNaam.trim() || newPin.length !== 4}
              style={{
                backgroundColor: '#1B7867', color: '#FFFFFF', borderRadius: '16px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500,
              }}
            >
              Toevoegen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
