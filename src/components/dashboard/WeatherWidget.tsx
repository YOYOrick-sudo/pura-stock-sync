import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WeatherWidgetProps {
  condition: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
    case 'partly_cloudy':
      return <Sun className="h-8 w-8" style={{ color: '#1B7867' }} />;
    case 'rainy':
    case 'stormy':
      return <CloudRain className="h-8 w-8" style={{ color: '#1B7867' }} />;
    case 'windy':
      return <Wind className="h-8 w-8" style={{ color: '#1B7867' }} />;
    default:
      return <Cloud className="h-8 w-8" style={{ color: '#1B7867' }} />;
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

export function WeatherWidget({ condition, temperature, windSpeed, precipitation }: WeatherWidgetProps) {
  return (
    <Card 
      className="p-6"
      style={{ 
        backgroundColor: '#F6F7DD',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: '#73747B' }}>
            Weer Vandaag
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: '#282E3A' }}>
              {temperature}°C
            </span>
            <span className="text-sm" style={{ color: '#73747B' }}>
              {getWeatherLabel(condition)}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm" style={{ color: '#73747B' }}>
            <span>Wind: {windSpeed} km/h</span>
            <span>Neerslag: {precipitation}mm</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getWeatherIcon(condition)}
        </div>
      </div>
    </Card>
  );
}
