import { SidebarLayout } from '@/components/SidebarLayout';
import { Home } from 'lucide-react';

const MijnDashboard = () => {
  return (
    <SidebarLayout>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundColor: '#FFF7ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Home size={18} color="#E27726" />
          </div>
          <h1 style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#1A1F28',
            letterSpacing: '-0.02em',
          }}>
            Mijn Dashboard
          </h1>
        </div>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#636878',
          marginBottom: '32px',
        }}>
          Welkom bij je persoonlijke dashboard.
        </p>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D8E0',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#F1F3F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Home size={22} color="#8D93A0" />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#303542' }}>
            Komt binnenkort
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878', marginTop: '4px' }}>
            Je persoonlijke dashboard wordt hier weergegeven.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default MijnDashboard;
