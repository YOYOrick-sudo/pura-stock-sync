import { Clock } from 'lucide-react';

interface MijnPlaceholderProps {
  title: string;
  description: string;
}

const MijnPlaceholder = ({ title, description }: MijnPlaceholderProps) => {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          color: '#1A1F28',
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          {title}
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#636878',
          marginBottom: '32px',
        }}>
          {description}
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
            <Clock size={22} color="#8D93A0" />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#303542' }}>
            Komt binnenkort
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878', marginTop: '4px' }}>
            Deze functie is nog in ontwikkeling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MijnPlaceholder;
