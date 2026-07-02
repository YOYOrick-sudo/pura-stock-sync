import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRightLeft, CheckSquare, ArrowLeft, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logoGreen from '@/assets/pura-vida-logo-official.png';

interface MenuCardProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const MenuCard = ({ to, icon: Icon, title, description, color }: MenuCardProps) => {
  const colorClasses = {
    sea: 'border-l-primary text-primary',
    sunset: 'border-l-warning text-warning',
    sky: 'border-l-info text-info',
    moonlight: 'border-l-[#9B87B5] text-[#9B87B5]',
  };

  return (
    <Link to={to}>
      <Card className={`p-6 bg-card border-l-4 ${colorClasses[color as keyof typeof colorClasses].split(' ')[0]} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] group`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/30 ${colorClasses[color as keyof typeof colorClasses].split(' ')[1]}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default function KitchenMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-foreground/50 hover:text-foreground hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voorraad
            </Button>

            <img src={logoGreen} alt="Pura Vida Foodbar" className="h-16 w-auto" />

            <div className="w-24" />
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">Pura Vida - West</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MenuCard
            to="/kitchen/recipes"
            icon={BookOpen}
            title="Recepten"
            description="Bekijk stappenplannen"
            color="sea"
          />
          <MenuCard
            to="/kitchen/mep"
            icon={Calendar}
            title="Mise-en-place"
            description="Plan je voorbereidingen"
            color="sunset"
          />
          <MenuCard
            to="/kitchen/orders"
            icon={ArrowRightLeft}
            title="Interne bestellingen"
            description="Bestel tussen locaties"
            color="sky"
          />
          <MenuCard
            to="/kitchen/tasks"
            icon={CheckSquare}
            title="Taken"
            description="Schoonmaak & onderhoud"
            color="moonlight"
          />
        </div>
      </div>
    </div>
  );
}
