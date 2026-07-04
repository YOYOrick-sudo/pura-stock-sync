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
  const WeatherIcon = getWeatherIcon(condition || 'cloudy');
  const isFallback = isLoading || condition === undefined;
  
  return (
    <div
      className="bg-card border border-border/60 rounded-[20px] p-6 shadow-[var(--shadow-card)] flex flex-col gap-3 h-full"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-primary" />
          <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
            Weer Vandaag
          </p>
        </div>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-semibold text-foreground">
          {isFallback ? '...' : `${temperature}°C`}
        </span>
        <span className="text-sm text-muted-foreground">
          {isFallback ? 'Laden...' : getWeatherLabel(condition || 'cloudy')}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center gap-1.5">
          <Wind size={14} className="text-muted-foreground" style={{ opacity: isFallback ? 0.5 : 1 }} />
          <span className="text-[13px] text-muted-foreground">
            {isFallback ? '... km/h' : `${windSpeed} km/h`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-muted-foreground" style={{ opacity: isFallback ? 0.5 : 1 }} />
          <span className="text-[13px] text-muted-foreground">
            {isFallback ? '... mm' : `${precipitation}mm`}
          </span>
        </div>
      </div>
    </div>
  );
}
