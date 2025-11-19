import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
  const WeatherIcon = getWeatherIcon(condition || 'cloudy');
  const isFallback = isLoading || condition === undefined;
  
  return (
    <div
      style={{
        backgroundColor: '#F6F7DD',
        border: '1px solid rgba(197, 197, 202, 0.5)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'default',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sun size={16} style={{ color: '#1B7867' }} />
          <p style={{ 
            fontSize: '14px', 
            fontWeight: 500,
            color: '#282E3A'
          }}>
            Weer Vandaag
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ 
          fontSize: '28px', 
          fontWeight: 600,
          color: '#282E3A'
        }}>
          {isFallback ? '...' : `${temperature}°C`}
        </span>
        <span style={{ 
          fontSize: '14px',
          fontWeight: 400,
          color: '#73747B'
        }}>
          {isFallback ? 'Laden...' : getWeatherLabel(condition || 'cloudy')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wind size={14} style={{ color: '#73747B', opacity: isFallback ? 0.5 : 1 }} />
          <span style={{ fontSize: '13px', color: '#73747B' }}>
            {isFallback ? '... km/h' : `${windSpeed} km/h`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets size={14} style={{ color: '#73747B', opacity: isFallback ? 0.5 : 1 }} />
          <span style={{ fontSize: '13px', color: '#73747B' }}>
            {isFallback ? '... mm' : `${precipitation}mm`}
          </span>
        </div>
      </div>
    </div>
  );
}
