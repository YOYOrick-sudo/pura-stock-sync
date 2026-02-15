import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { User, Camera, FileText, ExternalLink, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  emergency_contact: string;
  avatar_url: string | null;
}

interface UserRole {
  contract_type: string | null;
  hired_date: string | null;
  location: string;
  role: string;
}

interface EmployeeDocument {
  id: string;
  file_name: string;
  file_url: string;
  type: string;
  created_at: string | null;
}

const EmployeeProfile = () => {
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    emergency_contact: '',
    avatar_url: null,
  });
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile, role, and documents in parallel
      const [profileRes, roleRes, docsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
        supabase.from('employee_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) {
        setHasProfile(true);
        setProfile({
          first_name: profileRes.data.first_name || '',
          last_name: profileRes.data.last_name || '',
          phone: profileRes.data.phone || '',
          date_of_birth: profileRes.data.date_of_birth || '',
          nationality: profileRes.data.nationality || '',
          emergency_contact: profileRes.data.emergency_contact || '',
          avatar_url: profileRes.data.avatar_url,
        });
      }

      if (roleRes.data) {
        setUserRole(roleRes.data);
      }

      if (docsRes.data) {
        setDocuments(docsRes.data);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileData = {
        user_id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || null,
        date_of_birth: profile.date_of_birth || null,
        nationality: profile.nationality || null,
        emergency_contact: profile.emergency_contact || null,
      };

      let error;
      if (hasProfile) {
        ({ error } = await supabase.from('profiles').update(profileData).eq('user_id', user.id));
      } else {
        ({ error } = await supabase.from('profiles').insert(profileData));
        if (!error) setHasProfile(true);
      }

      if (error) throw error;

      toast({ title: 'Profiel opgeslagen', description: 'Je gegevens zijn bijgewerkt.' });
    } catch (error: any) {
      toast({ title: 'Fout bij opslaan', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const f = profile.first_name?.[0] || '';
    const l = profile.last_name?.[0] || '';
    return (f + l).toUpperCase() || '?';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch {
      return '—';
    }
  };

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case 'contract': return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'id': return { bg: '#FEF3C7', text: '#B45309' };
      case 'certificate': return { bg: '#DCFCE8', text: '#15803D' };
      default: return { bg: '#F1F3F5', text: '#4A4F5E' };
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Eigenaar', manager: 'Manager', admin: 'Admin',
      hr: 'HR', team_lead: 'Teamleider', employee: 'Medewerker',
      kitchen_staff: 'Keukenpersoneel',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <Skeleton className="h-20 w-20 rounded-full mb-6" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-1.5" />
                    <Skeleton className="h-9 w-full rounded-[14px]" />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton className="h-48 w-full rounded-[20px]" />
              <Skeleton className="h-48 w-full rounded-[20px]" />
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <h1 style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          color: '#1A1F28',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}>
          Mijn Profiel
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#636878',
          marginBottom: '32px',
        }}>
          Bekijk en bewerk je persoonlijke gegevens.
        </p>

        {/* 2-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
        }} className="max-[768px]:!grid-cols-1">

          {/* LEFT - Profile Form */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D5D8E0',
            borderRadius: '20px',
            padding: '24px',
          }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#E27726',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}>
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D5D8E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Camera size={14} color="#636878" />
                </div>
              </div>
              <div>
                <p style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1A1F28',
                }}>
                  {profile.first_name || profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : 'Naam invullen'}
                </p>
                {userRole && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>
                    {roleLabel(userRole.role)} · {userRole.location}
                  </p>
                )}
              </div>
            </div>

            {/* Form Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }} className="max-[640px]:!grid-cols-1">
              {/* Voornaam */}
              <div>
                <label style={labelStyle}>Voornaam <span style={{ color: '#EF4444' }}>*</span></label>
                <Input
                  value={profile.first_name}
                  onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="Voornaam"
                  style={{ height: '36px' }}
                />
              </div>
              {/* Achternaam */}
              <div>
                <label style={labelStyle}>Achternaam <span style={{ color: '#EF4444' }}>*</span></label>
                <Input
                  value={profile.last_name}
                  onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Achternaam"
                  style={{ height: '36px' }}
                />
              </div>
              {/* Telefoon */}
              <div>
                <label style={labelStyle}>Telefoon</label>
                <Input
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+31 6 12345678"
                  style={{ height: '36px' }}
                />
              </div>
              {/* Geboortedatum */}
              <div>
                <label style={labelStyle}>Geboortedatum</label>
                <Input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
                  style={{ height: '36px' }}
                />
              </div>
              {/* Nationaliteit */}
              <div>
                <label style={labelStyle}>Nationaliteit</label>
                <Input
                  value={profile.nationality}
                  onChange={e => setProfile(p => ({ ...p, nationality: e.target.value }))}
                  placeholder="Nederlands"
                  style={{ height: '36px' }}
                />
              </div>
              {/* Noodcontact */}
              <div>
                <label style={labelStyle}>Noodcontact</label>
                <Input
                  value={profile.emergency_contact}
                  onChange={e => setProfile(p => ({ ...p, emergency_contact: e.target.value }))}
                  placeholder="Naam + telefoonnummer"
                  style={{ height: '36px' }}
                />
              </div>
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button
                onClick={handleSave}
                disabled={saving || !profile.first_name || !profile.last_name}
                style={{ borderRadius: '16px' }}
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </div>

          {/* RIGHT - Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contract Info Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5D8E0',
              borderRadius: '20px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Briefcase size={16} color="#E27726" />
                </div>
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1A1F28',
                }}>
                  Contract Info
                </h3>
              </div>
              {userRole ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="Rol" value={roleLabel(userRole.role)} />
                  <InfoRow label="Locatie" value={userRole.location} />
                  <InfoRow label="Contract" value={userRole.contract_type || '—'} />
                  <InfoRow label="Startdatum" value={formatDate(userRole.hired_date)} mono />
                </div>
              ) : (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D93A0' }}>
                  Geen contractgegevens beschikbaar.
                </p>
              )}
            </div>

            {/* Documents Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5D8E0',
              borderRadius: '20px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={16} color="#E27726" />
                </div>
                <h3 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1A1F28',
                }}>
                  Documenten
                </h3>
              </div>
              {documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.map((doc) => {
                    const badge = typeBadgeColor(doc.type);
                    return (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          backgroundColor: '#F8F9FA',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#303542',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {doc.file_name}
                          </span>
                          <span style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: badge.text,
                            backgroundColor: badge.bg,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            flexShrink: 0,
                          }}>
                            {doc.type}
                          </span>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flexShrink: 0, marginLeft: '8px', color: '#636878' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#F1F3F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <FileText size={20} color="#8D93A0" />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>
                    Geen documenten beschikbaar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
  color: '#303542',
  display: 'block',
  marginBottom: '6px',
};

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>{label}</span>
    <span style={{
      fontFamily: mono ? "'Geist Mono', monospace" : 'Inter, sans-serif',
      fontSize: mono ? '12px' : '13px',
      fontWeight: 500,
      color: '#1A1F28',
    }}>
      {value}
    </span>
  </div>
);

export default EmployeeProfile;
