import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';

interface WeatherWidgetProps {
  condition?: string;
  temperature?: number;
  windSpeed?: number;
  precipitation?: number;
  isLoading?: boolean;
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
    case 'partly_cloudy':
      return Sun;
    case 'rainy':
    case 'stormy':
      return CloudRain;
    case 'windy':
      return Wind;
    default:
      return Cloud;
  }
};

const getWeatherLabel = (condition: string) => {
  const labels: Record<string, string> = {
    sunny: 'Zonnig',
    partly_cloudy: 'Half bewolkt',
    cloudy: 'Bewolkt',
    rainy: 'Regen',
    windy: 'Winderig',
    stormy: 'Storm',
    foggy: 'Mistig',
    snowy: 'Sneeuw',
  };
  return labels[condition] || 'Onbekend';
};

export function WeatherWidget({ 
  condition, 
  temperature, 
  windSpeed, 
  precipitation, 
  isLoading 
}: WeatherWidgetProps) {
  const isFallback = isLoading || condition === undefined;
  
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #D5D8E0',
        borderRadius: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 3px accent bar - info blue */}
      <div style={{ height: '3px', background: '#3B82F6', width: '100%' }} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {/* Icon + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(59,130,246,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sun size={18} color="#3B82F6" />
          </div>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: '#636878',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Weer Vandaag
          </span>
        </div>

        {/* Temperature value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: '"Instrument Sans", sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1A1F28',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {isFallback ? '...' : `${temperature}°C`}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>
            {isFallback ? 'Laden...' : getWeatherLabel(condition || 'cloudy')}
          </span>
        </div>

        {/* Wind & Precipitation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={14} style={{ color: '#636878', opacity: isFallback ? 0.5 : 1 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>
              {isFallback ? '... km/h' : `${windSpeed} km/h`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Droplets size={14} style={{ color: '#636878', opacity: isFallback ? 0.5 : 1 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#636878' }}>
              {isFallback ? '... mm' : `${precipitation}mm`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
