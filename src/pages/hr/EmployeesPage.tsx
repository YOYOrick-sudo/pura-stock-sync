import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, UserPlus, Users, Pencil, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';

type SortField = 'name' | 'email' | 'location';
type SortDir = 'asc' | 'desc';

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  location: string;
  role: string;
  contract_type: string | null;
  is_active: boolean;
  hired_date: string | null;
}

const ROLES_DISPLAY: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  admin: 'Admin',
  hr: 'HR',
  team_lead: 'Teamleider',
  employee: 'Medewerker',
  kitchen_staff: 'Keuken',
};

const ROLE_OPTIONS = ['employee', 'team_lead', 'manager', 'kitchen_staff', 'hr'];
const CONTRACT_OPTIONS = ['fulltime', 'parttime', 'oproep', 'seizoen', 'stage'];

const PAGE_SIZE = 10;

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<'Alle' | 'West' | 'Midsland'>('Alle');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string; password: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formLocation, setFormLocation] = useState('West');
  const [formRole, setFormRole] = useState('employee');
  const [formContract, setFormContract] = useState('fulltime');
  const [formStartDate, setFormStartDate] = useState('');

  // Fetch profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['employees-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, first_name, last_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch user_roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['employees-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, role, location, contract_type, is_active, hired_date');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = profilesLoading || rolesLoading;

  // Join data
  const employees: Employee[] = useMemo(() => {
    if (!profiles || !roles) return [];
    return roles.map(r => {
      const p = profiles.find(pr => pr.user_id === r.user_id);
      return {
        user_id: r.user_id,
        first_name: p?.first_name || '',
        last_name: p?.last_name || '',
        location: r.location,
        role: r.role,
        contract_type: r.contract_type,
        is_active: r.is_active,
        hired_date: r.hired_date,
      };
    });
  }, [profiles, roles]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = employees;
    if (locationFilter !== 'Alle') list = list.filter(e => e.location === locationFilter);
    if (roleFilter) list = list.filter(e => e.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortField === 'location') cmp = a.location.localeCompare(b.location);
      if (sortField === 'email') cmp = a.first_name.localeCompare(b.first_name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [employees, locationFilter, roleFilter, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Niet ingelogd');

      const res = await supabase.functions.invoke('invite-employee', {
        body: {
          email: formEmail,
          first_name: formFirstName,
          last_name: formLastName,
          location: formLocation,
          role: formRole,
          contract_type: formContract,
          hired_date: formStartDate || null,
        },
      });

      if (res.error) throw new Error(res.error.message || 'Uitnodiging mislukt');
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      setInviteSuccess({ email: formEmail, password: data.temp_password });
      queryClient.invalidateQueries({ queryKey: ['employees-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees-roles'] });
      toast({ title: 'Medewerker aangemaakt', description: `${formFirstName} ${formLastName} is uitgenodigd.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    },
  });

  const handleInvite = () => {
    if (!formEmail || !formFirstName || !formLastName) return;
    inviteMutation.mutate();
  };

  const resetForm = () => {
    setFormEmail(''); setFormFirstName(''); setFormLastName('');
    setFormLocation('West'); setFormRole('employee'); setFormContract('fulltime');
    setFormStartDate(''); setInviteSuccess(null); setCopiedPassword(false);
  };

  const closeModal = () => {
    setShowInviteModal(false);
    resetForm();
  };

  const openInvite = () => {
    resetForm();
    setShowInviteModal(true);
  };

  const getInitials = (fn: string, ln: string) => {
    return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || '?';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} style={{ color: '#8D93A0' }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: '#E27726' }} />
      : <ChevronDown size={12} style={{ color: '#E27726' }} />;
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid #D5D8E0', paddingBottom: '20px' }}>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1A1F28', letterSpacing: '-0.02em' }}>
            Medewerkers
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#636878', marginTop: '4px' }}>
            Beheer en nodig medewerkers uit voor je locatie.
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '320px', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8D93A0' }} />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Zoek medewerker..."
              style={{ paddingLeft: '36px', borderRadius: '16px', height: '40px' }}
            />
          </div>

          {/* Segmented Control */}
          <div style={{
            display: 'flex', backgroundColor: '#F8F9FA', border: '1px solid #EAECF0',
            borderRadius: '16px', padding: '3px', gap: '2px',
          }}>
            {(['Alle', 'West', 'Midsland'] as const).map(loc => (
              <button
                key={loc}
                onClick={() => { setLocationFilter(loc); setPage(0); }}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: locationFilter === loc ? 500 : 400,
                  padding: '6px 14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  backgroundColor: locationFilter === loc ? '#FFFFFF' : 'transparent',
                  color: locationFilter === loc ? '#282E3A' : '#636878',
                  boxShadow: locationFilter === loc ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: '13px', height: '40px',
              padding: '0 36px 0 12px', borderRadius: '14px', border: '1px solid #C1C5CF',
              backgroundColor: '#FFFFFF', color: roleFilter ? '#282E3A' : '#8D93A0',
              cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238D93A0' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}
          >
            <option value="">Alle rollen</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES_DISPLAY[r] || r}</option>)}
          </select>

          <div style={{ flex: 1 }} />

          {/* Invite button */}
          <button
            onClick={openInvite}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
              padding: '0 14px', height: '36px', borderRadius: '16px', border: 'none',
              backgroundColor: '#E27726', color: '#FFFFFF', cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#C9630E')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E27726')}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <UserPlus size={16} />
            Medewerker uitnodigen
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D5D8E0', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Skeleton header */}
            <div style={{ backgroundColor: '#F8F9FA', padding: '12px 16px', borderBottom: '1px solid #D5D8E0' }}>
              <Skeleton className="h-3 w-48" style={{ borderRadius: '14px' }} />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < 4 ? '1px solid #EAECF0' : 'none' }}>
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-32" style={{ borderRadius: '14px' }} />
                <Skeleton className="h-3 w-40 ml-auto" style={{ borderRadius: '14px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: '52px', height: '52px', backgroundColor: '#F1F3F5', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}>
              <Users size={22} style={{ color: '#8D93A0' }} />
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#303542', marginBottom: '4px' }}>
              Geen medewerkers gevonden
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#636878', marginBottom: '20px', maxWidth: '300px' }}>
              {search || locationFilter !== 'Alle' || roleFilter ? 'Pas je filters aan.' : 'Nodig je eerste medewerker uit.'}
            </p>
            {!search && locationFilter === 'Alle' && !roleFilter && (
              <button
                onClick={openInvite}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                  padding: '0 14px', height: '36px', borderRadius: '16px', border: 'none',
                  backgroundColor: '#E27726', color: '#FFFFFF', cursor: 'pointer',
                }}
              >
                Medewerker uitnodigen
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D5D8E0', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.6fr',
              gap: '8px', padding: '12px 16px',
              backgroundColor: '#F8F9FA', borderBottom: '1px solid #D5D8E0',
            }}>
              {[
                { label: 'NAAM', field: 'name' as SortField },
                { label: 'LOCATIE', field: 'location' as SortField },
                { label: 'ROL', field: null },
                { label: 'CONTRACT', field: null },
                { label: 'STATUS', field: null },
                { label: '', field: null },
              ].map((col, i) => (
                <div
                  key={i}
                  onClick={() => col.field && toggleSort(col.field)}
                  style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500,
                    color: '#636878', letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                    display: 'flex', alignItems: 'center', gap: '4px',
                    cursor: col.field ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {col.field && <SortIcon field={col.field} />}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {paginated.map((emp) => (
              <div
                key={emp.user_id}
                className="employee-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.6fr',
                  gap: '8px', padding: '12px 16px', alignItems: 'center',
                  borderBottom: '1px solid #EAECF0',
                  transition: 'background-color 0.08s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FCFCFD')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                {/* Name + Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: '#E27726', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#FFFFFF',
                    flexShrink: 0,
                  }}>
                    {getInitials(emp.first_name, emp.last_name)}
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A' }}>
                    {emp.first_name} {emp.last_name}
                  </span>
                </div>

                {/* Location */}
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#303542' }}>
                  {emp.location}
                </span>

                {/* Role badge */}
                <div>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500,
                    padding: '2px 8px', borderRadius: '9999px',
                    backgroundColor: '#F8F9FA', color: '#4A4F5E', border: '1px solid #EAECF0',
                  }}>
                    {ROLES_DISPLAY[emp.role] || emp.role}
                  </span>
                </div>

                {/* Contract */}
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#636878' }}>
                  {emp.contract_type || '—'}
                </span>

                {/* Status */}
                <div>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500,
                    padding: '2px 8px', borderRadius: '9999px',
                    backgroundColor: emp.is_active ? '#DCFCE8' : '#F1F3F5',
                    color: emp.is_active ? '#15803D' : '#636878',
                  }}>
                    {emp.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>

                {/* Actions */}
                <div className="action-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="action-btn"
                    style={{
                      width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                      backgroundColor: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.08s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F3F5')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Pencil size={14} style={{ color: '#636878' }} />
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderTop: '1px solid #EAECF0',
              }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#636878' }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} van {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      width: '32px', height: '32px', borderRadius: '14px',
                      border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      opacity: page === 0 ? 0.45 : 1,
                    }}
                  >
                    <ChevronLeft size={16} style={{ color: '#303542' }} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      width: '32px', height: '32px', borderRadius: '14px',
                      border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      opacity: page >= totalPages - 1 ? 0.45 : 1,
                    }}
                  >
                    <ChevronRight size={16} style={{ color: '#303542' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hover styles for action buttons */}
        <style>{`
          .employee-row:hover .action-btn { opacity: 1 !important; }
        `}</style>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            backgroundColor: 'rgba(15,19,24,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF', borderRadius: '24px',
              boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)',
              width: '100%', maxWidth: '480px', zIndex: 310,
              animation: 'modalIn 0.15s ease',
            }}
          >
            {inviteSuccess ? (
              /* Success state */
              <div style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: '#DCFCE8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <Check size={22} style={{ color: '#15803D' }} />
                  </div>
                  <h3 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: '#1A1F28' }}>
                    Medewerker aangemaakt
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#636878', marginTop: '4px' }}>
                    Deel het tijdelijke wachtwoord met de medewerker.
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#F8F9FA', borderRadius: '14px', padding: '12px 16px',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#636878', display: 'block', marginBottom: '4px' }}>Email</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '13px', color: '#282E3A' }}>{inviteSuccess.email}</span>
                </div>
                <div style={{
                  backgroundColor: '#FFF7ED', borderRadius: '14px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '20px',
                }}>
                  <div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#A5500D', display: 'block', marginBottom: '4px' }}>Tijdelijk wachtwoord</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '14px', fontWeight: 500, color: '#282E3A' }}>{inviteSuccess.password}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteSuccess.password);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    style={{
                      width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                      backgroundColor: copiedPassword ? '#DCFCE8' : '#FFEDD5', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {copiedPassword ? <Check size={14} style={{ color: '#15803D' }} /> : <Copy size={14} style={{ color: '#A5500D' }} />}
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    width: '100%', height: '36px', borderRadius: '14px', border: 'none',
                    backgroundColor: '#E27726', color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Sluiten
                </button>
              </div>
            ) : (
              /* Form */
              <>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #D5D8E0' }}>
                  <h2 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: '#1A1F28' }}>
                    Medewerker uitnodigen
                  </h2>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Email */}
                  <div>
                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                      Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="naam@voorbeeld.nl" />
                  </div>
                  {/* Name row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Voornaam <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <Input value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="Voornaam" />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Achternaam <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <Input value={formLastName} onChange={e => setFormLastName(e.target.value)} placeholder="Achternaam" />
                    </div>
                  </div>
                  {/* Location + Role */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Locatie <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={formLocation} onChange={e => setFormLocation(e.target.value)}
                        style={{
                          width: '100%', height: '36px', padding: '0 12px', borderRadius: '14px',
                          border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#282E3A',
                        }}
                      >
                        <option value="West">West</option>
                        <option value="Midsland">Midsland</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Rol <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={formRole} onChange={e => setFormRole(e.target.value)}
                        style={{
                          width: '100%', height: '36px', padding: '0 12px', borderRadius: '14px',
                          border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#282E3A',
                        }}
                      >
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES_DISPLAY[r] || r}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Contract + Start */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Contract type
                      </label>
                      <select
                        value={formContract} onChange={e => setFormContract(e.target.value)}
                        style={{
                          width: '100%', height: '36px', padding: '0 12px', borderRadius: '14px',
                          border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#282E3A',
                        }}
                      >
                        {CONTRACT_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#282E3A', display: 'block', marginBottom: '6px' }}>
                        Startdatum
                      </label>
                      <Input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div style={{
                  padding: '16px 24px', borderTop: '1px solid #D5D8E0',
                  display: 'flex', justifyContent: 'flex-end', gap: '8px',
                }}>
                  <button
                    onClick={closeModal}
                    style={{
                      height: '36px', padding: '0 14px', borderRadius: '14px',
                      border: '1px solid #C1C5CF', backgroundColor: '#FFFFFF',
                      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#303542',
                      cursor: 'pointer',
                    }}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteMutation.isPending || !formEmail || !formFirstName || !formLastName}
                    style={{
                      height: '36px', padding: '0 14px', borderRadius: '14px', border: 'none',
                      backgroundColor: '#E27726', color: '#FFFFFF',
                      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                      cursor: inviteMutation.isPending ? 'wait' : 'pointer',
                      opacity: inviteMutation.isPending || !formEmail || !formFirstName || !formLastName ? 0.45 : 1,
                    }}
                  >
                    {inviteMutation.isPending ? 'Uitnodigen...' : 'Uitnodigen'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </SidebarLayout>
  );
}
