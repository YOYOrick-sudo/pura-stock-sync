import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Check, 
  Copy, 
  TrendingUp, 
  Users, 
  Euro, 
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ChevronRight,
  Search,
  Bell,
  Settings,
  Loader2,
  MoreHorizontal,
  User,
  LogOut,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UtensilsCrossed,
  Coffee,
  Wine,
  Package,
  FileText,
  Star,
  ChefHat,
  ClipboardList,
  UserCheck,
  Timer,
  AlertOctagon,
  RefreshCw,
  Inbox,
  X,
} from "lucide-react";

// ==================== HELPER COMPONENTS ====================

// Color swatch component with copy functionality
const ColorSwatch = ({ 
  name, 
  value, 
  description, 
  textColor = "text-slate-900" 
}: { 
  name: string; 
  value: string; 
  description: string;
  textColor?: string;
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div 
      className="group flex items-center gap-4 p-3 rounded-xl bg-white border border-pv-border hover:border-pv-border-hover transition-colors cursor-pointer"
      onClick={handleCopy}
    >
      <div 
        className="w-14 h-14 rounded-xl shadow-sm border border-slate-200"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1">
        <div className={`font-semibold ${textColor}`}>{name}</div>
        <div className="text-sm text-slate-500">{description}</div>
        <code className="text-xs text-pv-primary font-mono">{value}</code>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="w-5 h-5 text-pv-primary" />
        ) : (
          <Copy className="w-5 h-5 text-slate-400" />
        )}
      </div>
    </div>
  );
};

// Section wrapper component
const Section = ({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="text-slate-500 mt-1">{description}</p>
      )}
    </div>
    <div className="bg-white rounded-2xl border border-pv-border p-6 shadow-sm">
      {children}
    </div>
  </section>
);

// KPI Card component (new style)
const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}) => (
  <div className="bg-white rounded-xl border border-pv-border p-5 hover:border-pv-border-hover transition-all hover:shadow-md">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl bg-pv-primary-light">
        <Icon className="w-5 h-5 text-pv-primary" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend.positive ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className={`w-4 h-4 ${!trend.positive && 'rotate-180'}`} />
          {trend.value}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{title}</div>
    {subtitle && (
      <div className="text-xs text-pv-primary mt-2">{subtitle}</div>
    )}
  </div>
);

// Alert component
const Alert = ({ 
  variant, 
  title, 
  description 
}: { 
  variant: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
}) => {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      descColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      descColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      descColor: 'text-amber-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      descColor: 'text-red-700',
    },
  };
  
  const v = variants[variant];
  const IconComponent = v.icon;
  
  return (
    <div className={`${v.bg} ${v.border} border rounded-xl p-4 flex gap-3`}>
      <IconComponent className={`w-5 h-5 ${v.iconColor} flex-shrink-0 mt-0.5`} />
      <div>
        <div className={`font-semibold ${v.titleColor}`}>{title}</div>
        <div className={`text-sm ${v.descColor} mt-0.5`}>{description}</div>
      </div>
    </div>
  );
};

// Status Badge component
const StatusBadge = ({ 
  status, 
  size = 'default' 
}: { 
  status: 'active' | 'pending' | 'inactive' | 'error';
  size?: 'default' | 'sm';
}) => {
  const styles = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    inactive: 'bg-slate-100 text-slate-700',
    error: 'bg-red-100 text-red-700',
  };
  const dots = {
    active: 'bg-green-500',
    pending: 'bg-amber-500',
    inactive: 'bg-slate-500',
    error: 'bg-red-500',
  };
  const labels = {
    active: 'Actief',
    pending: 'In behandeling',
    inactive: 'Inactief',
    error: 'Fout',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-${size === 'sm' ? '2' : '3'} py-${size === 'sm' ? '0.5' : '1'} rounded-full text-xs font-medium ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  );
};

// ==================== REAL-WORLD SCENARIO CARDS ====================

// Order Card Module
const OrderCard = () => (
  <div className="bg-white rounded-xl border border-pv-border p-5 hover:border-pv-border-hover hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-pv-primary-light flex items-center justify-center">
          <span className="text-lg font-bold text-pv-primary">T5</span>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Tafel 5</h4>
          <p className="text-sm text-slate-500">Bestelling #1247</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        In bereiding
      </span>
    </div>
    
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4" />
          2x Surf & Turf
        </span>
        <span className="font-medium text-slate-900">€54.00</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 flex items-center gap-2">
          <Wine className="w-4 h-4" />
          1x Witte Wijn
        </span>
        <span className="font-medium text-slate-900">€8.50</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 flex items-center gap-2">
          <Coffee className="w-4 h-4" />
          2x Koffie
        </span>
        <span className="font-medium text-slate-900">€6.00</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Clock className="w-4 h-4" />
        <span>12 min geleden</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Details</Button>
        <Button size="sm">Gereed</Button>
      </div>
    </div>
  </div>
);

// Task Card Module
const TaskCard = ({ status = 'open' }: { status?: 'open' | 'progress' | 'done' }) => {
  const statusStyles = {
    open: { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', label: 'Open' },
    progress: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'In uitvoering' },
    done: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Voltooid' },
  };
  const s = statusStyles[status];
  
  return (
    <div className={`bg-white rounded-xl border ${status === 'done' ? 'border-green-200' : 'border-pv-border'} p-5 hover:shadow-md transition-all ${status === 'done' ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <Checkbox checked={status === 'done'} className="mt-1" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-semibold ${status === 'done' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
              Terras klaarzetten
            </h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          
          <p className="text-sm text-slate-500 mb-3">
            Tafels en stoelen plaatsen, parasols opzetten, menu's neerleggen
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-4 h-4" />
              <span>15 min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Hoog
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs bg-pv-primary-light text-pv-primary">JV</AvatarFallback>
              </Avatar>
              <span className="text-slate-600">Jan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reservation Card Module
const ReservationCard = () => (
  <div className="bg-white rounded-xl border border-pv-border p-5 hover:border-pv-border-hover hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-pv-primary-light text-pv-primary font-semibold">
            MB
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold text-slate-900">Marie Bakker</h4>
          <p className="text-sm text-slate-500">Reservering #R-2847</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Bevestigd
      </span>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600">24 december 2024</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600">19:30</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600">6 personen</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600">Terras</span>
      </div>
    </div>
    
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
      <p className="text-sm text-amber-800">
        <strong>Notitie:</strong> Verjaardag, graag taart en kaarsje
      </p>
    </div>
    
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1">
        <Phone className="w-4 h-4" />
        Bel
      </Button>
      <Button variant="outline" size="sm" className="flex-1">
        <Mail className="w-4 h-4" />
        Mail
      </Button>
      <Button size="sm" className="flex-1">Inchecken</Button>
    </div>
  </div>
);

// Staff Card Module
const StaffCard = ({ status = 'working' }: { status?: 'working' | 'break' | 'offline' }) => {
  const statusStyles = {
    working: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Aan het werk' },
    break: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Pauze' },
    offline: { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', label: 'Offline' },
  };
  const s = statusStyles[status];
  
  return (
    <div className="bg-white rounded-xl border border-pv-border p-5 hover:border-pv-border-hover hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-14 h-14">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
            <AvatarFallback className="bg-pv-primary-light text-pv-primary font-semibold">
              SJ
            </AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${s.dot}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-slate-900">Sophie Jansen</h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
              {s.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-3">Bediening • West-Terschelling</p>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Sinds 10:00</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <ClipboardList className="w-4 h-4" />
              <span>8 taken</span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profiel bekijken
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Bewerken
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// ==================== CARD VARIANTS ====================

// Content Card
const ContentCard = () => (
  <div className="bg-white rounded-xl border border-pv-border p-6 hover:border-pv-border-hover hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl bg-pv-primary-light">
        <FileText className="w-5 h-5 text-pv-primary" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem>Bewerken</DropdownMenuItem>
          <DropdownMenuItem>Dupliceren</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">Verwijderen</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <h3 className="font-semibold text-slate-900 mb-2">Dagmenu Kerst</h3>
    <p className="text-sm text-slate-500 mb-4">
      Speciaal kerstmenu met seizoensgebonden ingrediënten en feestelijke gerechten.
    </p>
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Calendar className="w-4 h-4" />
        <span>24-26 dec</span>
      </div>
      <Button variant="ghost" size="sm">
        Bekijk
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

// Form Card
const FormCard = () => (
  <div className="bg-white rounded-xl border border-pv-border p-6">
    <h3 className="font-semibold text-slate-900 mb-4">Nieuwe Reservering</h3>
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Naam</label>
        <Input placeholder="Voer naam in..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Datum</label>
          <Input type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tijd</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Kies tijd" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18:00">18:00</SelectItem>
              <SelectItem value="19:00">19:00</SelectItem>
              <SelectItem value="20:00">20:00</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Notities</label>
        <Textarea placeholder="Optionele opmerkingen..." className="resize-none" rows={3} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1">Annuleren</Button>
        <Button className="flex-1">Opslaan</Button>
      </div>
    </div>
  </div>
);

// Settings Card
const SettingsCard = () => (
  <div className="bg-white rounded-xl border border-pv-border p-6">
    <h3 className="font-semibold text-slate-900 mb-4">Notificatie Instellingen</h3>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Push notificaties</p>
          <p className="text-sm text-slate-500">Ontvang meldingen op je telefoon</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Email updates</p>
          <p className="text-sm text-slate-500">Dagelijkse samenvatting per email</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Geluidseffecten</p>
          <p className="text-sm text-slate-500">Geluid bij nieuwe bestellingen</p>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  </div>
);

// ==================== EMPTY & ERROR STATES ====================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Inbox className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="font-semibold text-slate-900 mb-2">Geen items gevonden</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">
      Er zijn momenteel geen items om weer te geven. Voeg een nieuw item toe om te beginnen.
    </p>
    <Button>
      <Package className="w-4 h-4" />
      Nieuw item toevoegen
    </Button>
  </div>
);

const ErrorState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
      <AlertOctagon className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="font-semibold text-slate-900 mb-2">Er ging iets mis</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">
      We konden de gegevens niet laden. Controleer je verbinding en probeer het opnieuw.
    </p>
    <Button variant="outline">
      <RefreshCw className="w-4 h-4" />
      Probeer opnieuw
    </Button>
  </div>
);

// ==================== LIST ITEMS ====================

const NotificationItem = ({ read = false }: { read?: boolean }) => (
  <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${read ? 'bg-white border-slate-100' : 'bg-pv-primary-light/30 border-pv-border'} hover:border-pv-border-hover`}>
    <div className="relative">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-pv-primary text-white">KT</AvatarFallback>
      </Avatar>
      {!read && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pv-primary border-2 border-white" />
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <p className={`text-sm ${read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
          <strong>Keuken Team</strong> heeft bestelling #1248 voltooid
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-1">2 minuten geleden</p>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

export default function DesignSystem() {
  const [inputValue, setInputValue] = useState("");
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-pv-background">
        {/* Header */}
        <div className="bg-white border-b border-pv-border px-8 py-6">
          <div className="max-w-6xl">
            <h1 className="text-3xl font-bold text-slate-900">
              Pura Vida Design System
            </h1>
            <p className="text-slate-500 mt-2">
              Complete component library met de hybride stijl: grijze achtergrond, groene accenten, witte cards
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl px-8 py-8 space-y-12">
          
          {/* ========== COLORS ========== */}
          <Section 
            title="Kleurenpalet" 
            description="De hybride Pura Vida kleurenschema combineert neutrale grijstinten met groene accenten"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Achtergronden
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorSwatch 
                    name="Background" 
                    value="#F8FAFC" 
                    description="Page background (slate-50)"
                  />
                  <ColorSwatch 
                    name="Surface" 
                    value="#FFFFFF" 
                    description="Card & component surfaces"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Pura Vida Branding
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorSwatch 
                    name="Primary" 
                    value="#1B7867" 
                    description="Main brand color"
                    textColor="text-white"
                  />
                  <ColorSwatch 
                    name="Primary Hover" 
                    value="#156556" 
                    description="Hover & active states"
                    textColor="text-white"
                  />
                  <ColorSwatch 
                    name="Primary Light" 
                    value="#E6F4F1" 
                    description="Subtle backgrounds"
                  />
                  <ColorSwatch 
                    name="Border" 
                    value="#B3D9D4" 
                    description="Subtle green borders"
                  />
                  <ColorSwatch 
                    name="Border Hover" 
                    value="#1B7867" 
                    description="Border on hover"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Status Kleuren
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ColorSwatch 
                    name="Success" 
                    value="#22C55E" 
                    description="Positive actions"
                    textColor="text-white"
                  />
                  <ColorSwatch 
                    name="Warning" 
                    value="#F59E0B" 
                    description="Warnings & alerts"
                    textColor="text-white"
                  />
                  <ColorSwatch 
                    name="Error" 
                    value="#EF4444" 
                    description="Errors & destructive"
                    textColor="text-white"
                  />
                  <ColorSwatch 
                    name="Info" 
                    value="#3B82F6" 
                    description="Informational"
                    textColor="text-white"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ========== TYPOGRAPHY ========== */}
          <Section 
            title="Typography" 
            description="Inter font family met duidelijke hiërarchie"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-3xl bold</code>
                  <span className="text-3xl font-bold text-slate-900">Heading 1</span>
                </div>
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-2xl bold</code>
                  <span className="text-2xl font-bold text-slate-900">Heading 2</span>
                </div>
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-xl semibold</code>
                  <span className="text-xl font-semibold text-slate-900">Heading 3</span>
                </div>
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-lg medium</code>
                  <span className="text-lg font-medium text-slate-900">Heading 4</span>
                </div>
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-base</code>
                  <span className="text-base text-slate-700">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>
                </div>
                <div className="flex items-baseline gap-4 pb-4 border-b border-slate-100">
                  <code className="text-xs text-slate-400 w-32">text-sm</code>
                  <span className="text-sm text-slate-500">Secondary text - Smaller body copy for descriptions</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <code className="text-xs text-slate-400 w-32">text-xs uppercase</code>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Label / Caption</span>
                </div>
              </div>
            </div>
          </Section>

          {/* ========== BUTTONS ========== */}
          <Section 
            title="Buttons" 
            description="Alle button varianten en states"
          >
            <div className="space-y-8">
              {/* Variants */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Varianten
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Formaten
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Settings className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  States
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button disabled>Disabled</Button>
                  <Button onClick={handleLoadingDemo}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Click to Load'
                    )}
                  </Button>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Met Icons
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button>
                    <Check className="w-4 h-4" />
                    Bevestigen
                  </Button>
                  <Button variant="outline">
                    <Bell className="w-4 h-4" />
                    Notificaties
                  </Button>
                  <Button variant="secondary">
                    Volgende
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* ========== FORM ELEMENTS ========== */}
          <Section 
            title="Form Elements" 
            description="Input fields, selects, checkboxes en switches"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Text Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Text Input</label>
                <Input 
                  placeholder="Voer tekst in..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              {/* Search Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Search Input</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Zoeken..." 
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Select */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Select</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een optie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="west">West-Terschelling</SelectItem>
                    <SelectItem value="midsland">Midsland</SelectItem>
                    <SelectItem value="formerum">Formerum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Disabled Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Disabled Input</label>
                <Input 
                  placeholder="Niet bewerkbaar" 
                  disabled
                />
              </div>

              {/* Textarea */}
              <div className="space-y-3 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Textarea</label>
                <Textarea placeholder="Voer een langere tekst in..." className="resize-none" rows={3} />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="demo-checkbox"
                  checked={checkboxValue}
                  onCheckedChange={(checked) => setCheckboxValue(checked as boolean)}
                />
                <label htmlFor="demo-checkbox" className="text-sm text-slate-700">
                  Checkbox label
                </label>
              </div>

              {/* Switch */}
              <div className="flex items-center gap-3">
                <Switch 
                  id="demo-switch"
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
                <label htmlFor="demo-switch" className="text-sm text-slate-700">
                  Toggle switch
                </label>
              </div>
            </div>
          </Section>

          {/* ========== AVATARS ========== */}
          <Section 
            title="Avatars" 
            description="Gebruikers profielfoto's in verschillende formaten"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Formaten
                </h3>
                <div className="flex items-center gap-6">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-pv-primary-light text-pv-primary">XS</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-sm bg-pv-primary-light text-pv-primary">SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-pv-primary-light text-pv-primary">MD</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg bg-pv-primary-light text-pv-primary">LG</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="text-xl bg-pv-primary-light text-pv-primary">XL</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Met Status
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white" />
                  </div>
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
                      <AvatarFallback>CD</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-slate-400 border-2 border-white" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  User Chips
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pv-primary-light border border-pv-border">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-pv-primary text-white">JV</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700">Jan de Vries</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-slate-500 text-white">MB</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700">Marie Bakker</span>
                    <X className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ========== DROPDOWN MENUS ========== */}
          <Section 
            title="Dropdown Menus" 
            description="Context menus en action dropdowns"
          >
            <div className="flex flex-wrap gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Acties
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Bewerken
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliceren
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="w-4 h-4 mr-2" />
                    Favorieten
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verwijderen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <User className="w-4 h-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-medium text-sm text-slate-900">Jan de Vries</p>
                    <p className="text-xs text-slate-500">jan@puravida.nl</p>
                  </div>
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profiel
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Instellingen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Section>

          {/* ========== KPI CARDS ========== */}
          <Section 
            title="KPI Cards" 
            description="Data visualisatie cards met de nieuwe hybride stijl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard 
                title="Omzet vandaag"
                value="€2.847"
                icon={Euro}
                trend={{ value: "+12%", positive: true }}
                subtitle="vs. vorige week"
              />
              <KPICard 
                title="Gasten"
                value="142"
                icon={Users}
                trend={{ value: "+8%", positive: true }}
              />
              <KPICard 
                title="Taken voltooid"
                value="18/24"
                icon={Check}
                subtitle="75% compleet"
              />
              <KPICard 
                title="Gemiddelde wachttijd"
                value="12 min"
                icon={Clock}
                trend={{ value: "-3 min", positive: true }}
              />
            </div>
          </Section>

          {/* ========== CARD VARIANTS ========== */}
          <Section 
            title="Card Variaties" 
            description="Verschillende card types voor verschillende use cases"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ContentCard />
              <FormCard />
              <SettingsCard />
            </div>
          </Section>

          {/* ========== REAL-WORLD SCENARIO MODULES ========== */}
          <Section 
            title="Real-World Scenario Modules" 
            description="Concrete voorbeelden van hoe componenten samen komen in de praktijk"
          >
            <div className="space-y-8">
              {/* Order Cards */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Order Card
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <OrderCard />
                  <OrderCard />
                </div>
              </div>

              {/* Task Cards */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Taak Card (verschillende states)
                </h3>
                <div className="space-y-3">
                  <TaskCard status="open" />
                  <TaskCard status="progress" />
                  <TaskCard status="done" />
                </div>
              </div>

              {/* Reservation Cards */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Reservering Card
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ReservationCard />
                </div>
              </div>

              {/* Staff Cards */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Staff Card (verschillende statussen)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <StaffCard status="working" />
                  <StaffCard status="break" />
                  <StaffCard status="offline" />
                </div>
              </div>
            </div>
          </Section>

          {/* ========== LIST ITEMS ========== */}
          <Section 
            title="List Items" 
            description="Notificaties en andere lijst elementen"
          >
            <div className="space-y-3">
              <NotificationItem read={false} />
              <NotificationItem read={true} />
            </div>
          </Section>

          {/* ========== EMPTY & ERROR STATES ========== */}
          <Section 
            title="Empty & Error States" 
            description="Feedback states voor lege data en fouten"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-dashed border-slate-200 rounded-xl">
                <EmptyState />
              </div>
              <div className="border border-dashed border-slate-200 rounded-xl">
                <ErrorState />
              </div>
            </div>
          </Section>

          {/* ========== BADGES ========== */}
          <Section 
            title="Badges & Tags" 
            description="Status indicators en labels"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Standaard Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Status Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Actief
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    In behandeling
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Gestopt
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Inactief
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Priority Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Hoog
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Medium
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Laag
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* ========== PROGRESS ========== */}
          <Section 
            title="Progress & Loading" 
            description="Voortgangsindicatoren"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Taken voltooid</span>
                  <span className="text-pv-primary font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Upload progress</span>
                  <span className="text-pv-primary font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>

              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-pv-primary" />
                <span className="text-sm text-slate-500">Loading state...</span>
              </div>

              {/* Skeleton Loading */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Skeleton Loading
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                  <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </Section>

          {/* ========== ALERTS ========== */}
          <Section 
            title="Alerts & Feedback" 
            description="Notificaties en berichten"
          >
            <div className="space-y-4">
              <Alert 
                variant="info"
                title="Informatie"
                description="Dit is een informatief bericht over de huidige status."
              />
              <Alert 
                variant="success"
                title="Succes!"
                description="De actie is succesvol uitgevoerd."
              />
              <Alert 
                variant="warning"
                title="Let op"
                description="Er zijn enkele punten die aandacht vereisen."
              />
              <Alert 
                variant="error"
                title="Fout"
                description="Er is iets misgegaan. Probeer het opnieuw."
              />
              
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Toast Notifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => toast.success("Actie succesvol!")}
                  >
                    Success Toast
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast.error("Er ging iets mis")}
                  >
                    Error Toast
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast.info("Ter informatie")}
                  >
                    Info Toast
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* ========== TABS ========== */}
          <Section 
            title="Tabs" 
            description="Navigatie tabs"
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overzicht</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Instellingen</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <div className="p-4 rounded-xl bg-slate-50 text-slate-600">
                  Overzicht content hier...
                </div>
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <div className="p-4 rounded-xl bg-slate-50 text-slate-600">
                  Analytics content hier...
                </div>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <div className="p-4 rounded-xl bg-slate-50 text-slate-600">
                  Instellingen content hier...
                </div>
              </TabsContent>
            </Tabs>
          </Section>

          {/* ========== TABLE ========== */}
          <Section 
            title="Tables" 
            description="Data weergave in tabel formaat"
          >
            <div className="rounded-xl border border-pv-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Naam</TableHead>
                    <TableHead>Locatie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-pv-primary-light/30">
                    <TableCell className="font-medium">Jan de Vries</TableCell>
                    <TableCell>West-Terschelling</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Actief
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Bewerk</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-pv-primary-light/30">
                    <TableCell className="font-medium">Marie Bakker</TableCell>
                    <TableCell>Midsland</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pauze
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Bewerk</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-pv-primary-light/30">
                    <TableCell className="font-medium">Pieter Jansen</TableCell>
                    <TableCell>Formerum</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Offline
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Bewerk</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Section>

          {/* ========== DIALOGS & TOOLTIPS ========== */}
          <Section 
            title="Overlays" 
            description="Dialogs, tooltips en popovers"
          >
            <div className="flex flex-wrap gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bevestiging</DialogTitle>
                    <DialogDescription>
                      Dit is een voorbeeld dialog. Weet je zeker dat je wilt doorgaan?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline">Annuleren</Button>
                    <Button>Bevestigen</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover voor Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dit is een tooltip</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </Section>

          {/* ========== INTERACTIVE CARD EXAMPLE ========== */}
          <Section 
            title="Interactive Cards" 
            description="Hover en click states"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Keuken', icon: ChefHat },
                { name: 'Bediening', icon: UserCheck },
                { name: 'Kassa', icon: Euro },
              ].map((item) => (
                <div 
                  key={item.name}
                  className="p-5 rounded-xl border border-pv-border bg-white hover:border-pv-border-hover hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-pv-primary-light group-hover:bg-pv-primary transition-colors">
                      <item.icon className="w-6 h-6 text-pv-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900 group-hover:text-pv-primary transition-colors">
                        {item.name}
                      </span>
                      <p className="text-sm text-slate-500">
                        Naar {item.name.toLowerCase()} module
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-pv-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </SidebarLayout>
  );
}
