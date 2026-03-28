import { useState } from "react";
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
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus,
  Home,
  ChefHat,
  ClipboardList,
  ArrowRight,
  Eye,
  Download,
  Share2,
  Heart,
  Star,
  Inbox,
  RefreshCw,
  X,
} from "lucide-react";

// ==================== HELPER COMPONENTS ====================

const ColorSwatch = ({ 
  name, 
  value, 
  cssVar,
  textDark = true 
}: { 
  name: string; 
  value: string; 
  cssVar?: string;
  textDark?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssVar || value);
    setCopied(true);
    toast.success("Gekopieerd!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex flex-col items-start gap-2 p-3 rounded-polar-lg bg-card border border-border hover:border-primary hover:shadow-elevated transition-all text-left w-full"
    >
      <div
        className="w-full h-16 rounded-lg shadow-soft border border-border/50"
        style={{ backgroundColor: value }}
      />
      <div className="w-full">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">{name}</span>
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <code className="text-xs text-muted-foreground font-mono">{value}</code>
      </div>
    </button>
  );
};

const Section = ({ 
  id,
  title, 
  description, 
  children 
}: { 
  id?: string;
  title: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      {children}
    </div>
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">{title}</h3>
    {children}
  </div>
);

// ==================== KPI CARD ====================

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
  <div className="bg-card rounded-polar-lg border border-border p-5 hover:border-primary transition-all hover:shadow-elevated">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl bg-secondary">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend.positive ? "text-pv-success" : "text-destructive"
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${!trend.positive && "rotate-180"}`} />
          {trend.value}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{title}</div>
    {subtitle && (
      <div className="text-xs text-primary mt-2 font-medium">{subtitle}</div>
    )}
  </div>
);

// ==================== ALERT COMPONENT ====================

const Alert = ({
  variant,
  title,
  description,
}: {
  variant: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
}) => {
  const variants = {
    info: {
      wrap: "bg-pv-info/10 border-pv-info/25",
      icon: Info,
      iconColor: "text-pv-info",
    },
    success: {
      wrap: "bg-pv-success/10 border-pv-success/25",
      icon: CheckCircle,
      iconColor: "text-pv-success",
    },
    warning: {
      wrap: "bg-pv-warning/10 border-pv-warning/25",
      icon: AlertTriangle,
      iconColor: "text-pv-warning",
    },
    error: {
      wrap: "bg-destructive/10 border-destructive/25",
      icon: AlertCircle,
      iconColor: "text-destructive",
    },
  };

  const v = variants[variant];
  const IconComponent = v.icon;

  return (
    <div className={`${v.wrap} border rounded-polar-lg p-4 flex gap-3`}>
      <IconComponent className={`w-5 h-5 ${v.iconColor} flex-shrink-0 mt-0.5`} />
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
  );
};

// ==================== STATUS BADGE ====================

const StatusBadge = ({
  status,
}: {
  status: "active" | "pending" | "inactive" | "error";
}) => {
  const styles = {
    active: {
      bg: "bg-pv-success/10",
      text: "text-pv-success",
      dot: "bg-pv-success",
      label: "Actief",
    },
    pending: {
      bg: "bg-pv-warning/10",
      text: "text-pv-warning",
      dot: "bg-pv-warning",
      label: "In behandeling",
    },
    inactive: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
      label: "Inactief",
    },
    error: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      dot: "bg-destructive",
      label: "Fout",
    },
  };

  const s = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ==================== REAL-WORLD MODULES ====================

const OrderCard = () => (
  <div className="bg-card rounded-polar-lg border border-border p-5 hover:border-primary hover:shadow-elevated transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <span className="text-lg font-bold text-primary">T5</span>
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Tafel 5</h4>
          <p className="text-sm text-muted-foreground">Bestelling #1247</p>
        </div>
      </div>
      <StatusBadge status="pending" />
    </div>

    <div className="space-y-2 mb-4">
      {[
        { icon: UtensilsCrossed, item: "2x Surf & Turf", price: "€54.00" },
        { icon: Wine, item: "1x Witte Wijn", price: "€8.50" },
        { icon: Coffee, item: "2x Koffie", price: "€6.00" },
      ].map((line, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <line.icon className="w-4 h-4" />
            {line.item}
          </span>
          <span className="font-medium text-foreground">{line.price}</span>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

const TaskCard = ({ status = "open" }: { status?: "open" | "progress" | "done" }) => {
  const statusConfig = {
    open: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Open" },
    progress: { badge: "bg-pv-info/10 text-pv-info", dot: "bg-pv-info", label: "In uitvoering" },
    done: { badge: "bg-pv-success/10 text-pv-success", dot: "bg-pv-success", label: "Voltooid" },
  };
  const s = statusConfig[status];

  return (
    <div
      className={`bg-card rounded-polar-lg border ${
        status === "done" ? "border-pv-success/50" : "border-border"
      } p-5 hover:shadow-elevated transition-all ${status === "done" ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-4">
        <Checkbox checked={status === "done"} className="mt-1" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-semibold ${status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
              Terras klaarzetten
            </h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            Tafels en stoelen plaatsen, parasols opzetten, menu's neerleggen
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>15 min</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Hoog
            </span>
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs bg-secondary text-primary">JV</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">Jan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReservationCard = () => (
  <div className="bg-card rounded-polar-lg border border-border p-5 hover:border-primary hover:shadow-elevated transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-secondary text-primary font-semibold">MB</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold text-foreground">Marie Bakker</h4>
          <p className="text-sm text-muted-foreground">Reservering #R-2847</p>
        </div>
      </div>
      <StatusBadge status="active" />
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { icon: Calendar, text: "24 december 2024" },
        { icon: Clock, text: "19:30" },
        { icon: Users, text: "6 personen" },
        { icon: MapPin, text: "Terras" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <item.icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{item.text}</span>
        </div>
      ))}
    </div>

    <div className="p-3 rounded-lg bg-pv-warning/10 border border-pv-warning/25 mb-4">
      <p className="text-sm text-foreground">
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

const StaffCard = ({ status = "working" }: { status?: "working" | "break" | "offline" }) => {
  const statusConfig = {
    working: { badge: "bg-pv-success/10 text-pv-success", dot: "bg-pv-success", label: "Aan het werk" },
    break: { badge: "bg-pv-warning/10 text-pv-warning", dot: "bg-pv-warning", label: "Pauze" },
    offline: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  };
  const s = statusConfig[status];

  return (
    <div className="bg-card rounded-polar-lg border border-border p-5 hover:border-primary hover:shadow-elevated transition-all">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-14 h-14">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
            <AvatarFallback className="bg-secondary text-primary font-semibold">SJ</AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${s.dot}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-foreground">Sophie Jansen</h4>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
              {s.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Bediening • West-Terschelling</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Sinds 10:00</span>
            </div>
            <div className="flex items-center gap-1.5">
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Bewerken</DropdownMenuItem>
            <DropdownMenuItem><Mail className="w-4 h-4 mr-2" />Bericht sturen</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Verwijderen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// ==================== EMPTY & ERROR STATES ====================

const EmptyState = () => (
  <div className="bg-card border border-border rounded-polar-lg p-8 shadow-soft">
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/5 ring-1 ring-primary/10 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Geen items gevonden</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Er zijn nog geen items om weer te geven. Maak een nieuwe aan om te beginnen.
      </p>
      <Button>
        <Plus className="w-4 h-4" />
        Nieuw item
      </Button>
    </div>
  </div>
);

const ErrorState = () => (
  <div className="bg-card border border-border rounded-polar-lg p-8 shadow-soft">
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/5 ring-1 ring-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive/70" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Er ging iets mis</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        We konden de gegevens niet laden. Probeer het opnieuw.
      </p>
      <Button variant="outline">
        <RefreshCw className="w-4 h-4" />
        Opnieuw proberen
      </Button>
    </div>
  </div>
);

// ==================== NAVIGATION ITEMS ====================

const navItems = [
  { id: 'colors', label: 'Kleuren', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '📝' },
  { id: 'borders', label: 'Borders', icon: '🔲' },
  { id: 'radius', label: 'Border Radius', icon: '⬜' },
  { id: 'buttons', label: 'Buttons', icon: '🔘' },
  { id: 'forms', label: 'Formulieren', icon: '📋' },
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'data', label: 'Data Display', icon: '📊' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
  { id: 'modules', label: 'Modules', icon: '📦' },
];

// ==================== MAIN COMPONENT ====================

const DesignSystem = () => {
  const [activeSection, setActiveSection] = useState('colors');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pura Vida Design System</h1>
              <p className="text-sm text-muted-foreground">Modern • Professioneel • Consistent</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">v2.0</Badge>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard">
                  <Home className="w-4 h-4" />
                  Naar App
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-28 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 space-y-12">
            
            {/* ==================== COLORS ==================== */}
            <Section id="colors" title="Kleurenpalet" description="De basis van ons design systeem">
              <div className="space-y-8">
                <SubSection title="Achtergronden">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorSwatch name="Page" value="#F3F4F6" cssVar="hsl(var(--background))" />
                    <ColorSwatch name="Card" value="#FFFFFF" cssVar="hsl(var(--card))" />
                    <ColorSwatch name="Muted" value="#F3F4F6" cssVar="hsl(var(--muted))" />
                    <ColorSwatch name="Hover" value="#E5E7EB" cssVar="hsl(var(--border))" />
                  </div>
                </SubSection>

                <SubSection title="Brand (Primary)">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorSwatch name="Primary" value="#16A34A" cssVar="hsl(var(--primary))" textDark={false} />
                    <ColorSwatch name="Primary Hover" value="#15803D" cssVar="hsl(var(--primary-hover))" textDark={false} />
                    <ColorSwatch name="Secondary" value="#DCFCE7" cssVar="hsl(var(--secondary))" />
                    <ColorSwatch name="Border" value="#E5E7EB" cssVar="hsl(var(--border))" />
                  </div>
                </SubSection>

                <SubSection title="Tekst">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ColorSwatch name="Foreground" value="#111827" cssVar="hsl(var(--foreground))" textDark={false} />
                    <ColorSwatch name="Secondary" value="#6B7280" cssVar="hsl(var(--text-secondary))" />
                    <ColorSwatch name="Muted" value="#9CA3AF" cssVar="hsl(var(--text-muted))" />
                  </div>
                </SubSection>

                <SubSection title="Status">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorSwatch name="Success" value="#22C55E" cssVar="hsl(var(--success))" textDark={false} />
                    <ColorSwatch name="Warning" value="#F59E0B" cssVar="hsl(var(--warning))" textDark={false} />
                    <ColorSwatch name="Error" value="#EF4444" cssVar="hsl(var(--destructive))" textDark={false} />
                    <ColorSwatch name="Info" value="#3B82F6" cssVar="hsl(217 91% 60%)" textDark={false} />
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== TYPOGRAPHY ==================== */}
            <Section id="typography" title="Typography" description="Tekststijlen en hiërarchie">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-display / 36px Bold</code>
                    <span className="text-4xl font-bold text-foreground">Display Heading</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-h1 / 24px Bold</code>
                    <span className="text-2xl font-bold text-foreground">Heading 1</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-h2 / 20px Semibold</code>
                    <span className="text-xl font-semibold text-foreground">Heading 2</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-h3 / 18px Semibold</code>
                    <span className="text-lg font-semibold text-foreground">Heading 3</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-body / 16px Regular</code>
                    <span className="text-base text-foreground">Body tekst voor paragrafen en content</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-body-sm / 14px Regular (secondary color)</code>
                    <span className="text-sm text-muted-foreground">Kleinere body tekst voor secundaire informatie</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted">
                    <code className="text-xs text-primary font-mono mb-2 block">text-caption / 12px Medium (muted color)</code>
                    <span className="text-xs font-medium text-muted-foreground">CAPTION TEKST VOOR LABELS</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* ==================== BORDERS ==================== */}
            <Section id="borders" title="Borders" description="Border dikte en kleur standaarden">
              <div className="space-y-8">
                <SubSection title="Border Dikte Hiërarchie">
                  <div className="p-4 rounded-polar-lg bg-pv-success/10 border border-pv-success/25 mb-6">
                    <p className="text-sm font-medium text-foreground">
                      💡 <strong>TL;DR:</strong> Twijfel je? Gebruik <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">border-1.5</code> — dit is de standaard voor 95% van alle elementen.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1px */}
                    <div className="space-y-3">
                      <div className="p-6 rounded-polar-lg bg-card border border-border flex items-center justify-center">
                        <Input placeholder="Zoeken..." className="max-w-48" />
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border (1px)</code>
                        <p className="text-sm font-semibold text-foreground">Search Inputs</p>
                        <p className="text-xs text-muted-foreground">Alleen standaard state</p>
                      </div>
                    </div>

                    {/* 1.5px - STANDAARD */}
                    <div className="space-y-3">
                      <div className="p-6 rounded-polar-lg bg-pv-sea-light border-1.5 border-primary/20 flex flex-col items-center gap-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Outline</Button>
                          <div className="w-20 h-10 rounded-polar-lg border-1.5 border-border bg-card flex items-center justify-center text-xs text-muted-foreground">Card</div>
                        </div>
                        <Badge variant="secondary">⭐ Standaard</Badge>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-1.5 (1.5px)</code>
                        <p className="text-sm font-semibold text-foreground">De Standaard ⭐</p>
                        <p className="text-xs text-muted-foreground">Cards, Buttons, Sidebar, Inputs (focus), Modals, Tables</p>
                      </div>
                    </div>

                    {/* 2px */}
                    <div className="space-y-3">
                      <div className="p-6 rounded-polar-lg bg-card border border-border flex items-center justify-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pv-success/10 text-pv-success border-2 border-pv-success/50">
                          Succes
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border-2 border-destructive/50">
                          Error
                        </span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-2 (2px)</code>
                        <p className="text-sm font-semibold text-foreground">Status Indicators</p>
                        <p className="text-xs text-muted-foreground">"LET OP!" elementen</p>
                      </div>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Border Kleur Hiërarchie">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* border-border */}
                    <div className="space-y-3">
                      <div className="h-20 rounded-polar-lg border-1.5 border-border bg-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Default</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-border</code>
                        <p className="text-xs text-muted-foreground">Standaard cards & containers</p>
                      </div>
                    </div>

                    {/* border-subtle */}
                    <div className="space-y-3">
                      <div className="h-20 rounded-polar-lg border-1.5 border-subtle bg-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Subtle</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-subtle</code>
                        <p className="text-xs text-muted-foreground">Subtiele brand hint (10%)</p>
                      </div>
                    </div>

                    {/* border-accent */}
                    <div className="space-y-3">
                      <div className="h-20 rounded-polar-lg border-1.5 border-accent bg-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Accent</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-accent</code>
                        <p className="text-xs text-muted-foreground">Active/focus states (20%)</p>
                      </div>
                    </div>

                    {/* border-strong */}
                    <div className="space-y-3">
                      <div className="h-20 rounded-polar-lg border-1.5 border-strong bg-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Strong</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-strong</code>
                        <p className="text-xs text-muted-foreground">Hover states (30%)</p>
                      </div>
                    </div>

                    {/* border-primary */}
                    <div className="space-y-3">
                      <div className="h-20 rounded-polar-lg border-1.5 border-primary bg-card flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">Primary</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">border-primary</code>
                        <p className="text-xs text-muted-foreground">Geselecteerd/actief (100%)</p>
                      </div>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Interactive Demo">
                  <p className="text-sm text-muted-foreground mb-4">Hover over deze cards om de border transitions te zien:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-polar-lg bg-card border-1.5 border-border hover:border-strong transition-colors duration-200 cursor-pointer">
                      <p className="text-sm font-medium text-foreground">Hover Card</p>
                      <p className="text-xs text-muted-foreground mt-1">border-border → border-strong</p>
                    </div>
                    <div className="p-5 rounded-polar-lg bg-card border-1.5 border-border hover:border-primary transition-colors duration-200 cursor-pointer">
                      <p className="text-sm font-medium text-foreground">Active Card</p>
                      <p className="text-xs text-muted-foreground mt-1">border-border → border-primary</p>
                    </div>
                    <div className="p-5 rounded-polar-lg bg-card border-1.5 border-accent shadow-sm">
                      <p className="text-sm font-medium text-foreground">Selected State</p>
                      <p className="text-xs text-muted-foreground mt-1">border-accent + shadow-sm</p>
                    </div>
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== BORDER RADIUS ==================== */}
            <Section id="radius" title="Border Radius" description="Consistente afronding hiërarchie">
              <div className="space-y-8">
                <SubSection title="Radius Waarden">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* rounded-polar-sm */}
                    <div className="space-y-3">
                      <div className="h-24 w-full bg-primary/10 border border-primary/20 rounded-polar-sm flex items-center justify-center">
                        <span className="text-xs text-primary font-mono">8px</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">rounded-polar-sm</code>
                        <p className="text-sm font-semibold text-foreground">Small (8px)</p>
                        <p className="text-xs text-muted-foreground">Sidebar items, badges, chips</p>
                      </div>
                    </div>

                    {/* rounded-polar-md */}
                    <div className="space-y-3">
                      <div className="h-24 w-full bg-primary/10 border border-primary/20 rounded-polar-md flex items-center justify-center">
                        <span className="text-xs text-primary font-mono">12px</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">rounded-polar-md</code>
                        <p className="text-sm font-semibold text-foreground">Medium (12px)</p>
                        <p className="text-xs text-muted-foreground">Inner layers, icon boxes, buttons</p>
                      </div>
                    </div>

                    {/* rounded-polar-lg */}
                    <div className="space-y-3">
                      <div className="h-24 w-full bg-primary/10 border border-primary/20 rounded-polar-lg flex items-center justify-center">
                        <span className="text-xs text-primary font-mono">16px</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">rounded-polar-lg</code>
                        <p className="text-sm font-semibold text-foreground">Large (16px) ⭐</p>
                        <p className="text-xs text-muted-foreground">Alle cards (KPI, Order, Task, etc.)</p>
                      </div>
                    </div>

                    {/* rounded-polar-xl */}
                    <div className="space-y-3">
                      <div className="h-24 w-full bg-primary/10 border border-primary/20 rounded-polar-xl flex items-center justify-center">
                        <span className="text-xs text-primary font-mono">20px</span>
                      </div>
                      <div className="space-y-1">
                        <code className="text-xs font-mono text-primary block">rounded-polar-xl</code>
                        <p className="text-sm font-semibold text-foreground">Extra Large (20px)</p>
                        <p className="text-xs text-muted-foreground">Modals, page sections</p>
                      </div>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Praktijkvoorbeelden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card met inner layer */}
                    <div className="p-5 bg-card border-1.5 border-border rounded-polar-lg space-y-3">
                      <div className="p-3 bg-secondary rounded-polar-md flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-polar-sm flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Nested Example</p>
                          <p className="text-xs text-muted-foreground">Card → Inner → Icon</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Card: <code className="text-primary">rounded-polar-lg</code> → 
                        Inner: <code className="text-primary">rounded-polar-md</code> → 
                        Icon: <code className="text-primary">rounded-polar-sm</code>
                      </p>
                    </div>

                    {/* Button variants */}
                    <div className="p-5 bg-card border-1.5 border-border rounded-polar-lg space-y-3">
                      <div className="flex gap-3">
                        <Button size="sm" className="rounded-polar-md">Button</Button>
                        <Badge variant="secondary" className="rounded-polar-sm">Badge</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Buttons: <code className="text-primary">rounded-polar-md</code> (12px), 
                        Badges: <code className="text-primary">rounded-polar-sm</code> (8px)
                      </p>
                    </div>
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== BUTTONS ==================== */}
            <Section id="buttons" title="Buttons" description="Interactieve elementen voor acties">
              <div className="space-y-8">
                <SubSection title="Varianten">
                  <div className="flex flex-wrap gap-4">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </SubSection>

                <SubSection title="Sizes">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Plus className="w-4 h-4" /></Button>
                  </div>
                </SubSection>

                <SubSection title="Met iconen">
                  <div className="flex flex-wrap gap-4">
                    <Button><Plus className="w-4 h-4" />Toevoegen</Button>
                    <Button variant="outline"><Download className="w-4 h-4" />Download</Button>
                    <Button variant="secondary">Volgende<ArrowRight className="w-4 h-4" /></Button>
                  </div>
                </SubSection>

                <SubSection title="States">
                  <div className="flex flex-wrap gap-4">
                    <Button>Enabled</Button>
                    <Button disabled>Disabled</Button>
                    <Button disabled><Loader2 className="w-4 h-4 animate-spin" />Loading</Button>
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== FORMS ==================== */}
            <Section id="forms" title="Formulieren" description="Input elementen en form controls">
              <div className="space-y-8">
                <SubSection title="Text Inputs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Standaard input</label>
                      <Input placeholder="Type hier..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Met icoon</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Zoeken..." className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Disabled</label>
                      <Input placeholder="Niet beschikbaar" disabled />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-destructive">Error state</label>
                      <Input placeholder="Foutieve invoer" className="border-destructive focus-visible:ring-destructive" />
                      <p className="text-xs text-destructive">Dit veld is verplicht</p>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Textarea">
                  <div className="max-w-md space-y-2">
                    <label className="text-sm font-medium text-foreground">Bericht</label>
                    <Textarea placeholder="Typ je bericht..." rows={4} />
                  </div>
                </SubSection>

                <SubSection title="Select">
                  <div className="max-w-xs space-y-2">
                    <label className="text-sm font-medium text-foreground">Selecteer optie</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een optie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Optie 1</SelectItem>
                        <SelectItem value="2">Optie 2</SelectItem>
                        <SelectItem value="3">Optie 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </SubSection>

                <SubSection title="Checkbox & Switch">
                  <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-3">
                      <Checkbox id="terms" />
                      <label htmlFor="terms" className="text-sm text-foreground">Ik ga akkoord met de voorwaarden</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="notifications" />
                      <label htmlFor="notifications" className="text-sm text-foreground">Notificaties aan</label>
                    </div>
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== CARDS ==================== */}
            <Section id="cards" title="Cards" description="Container componenten voor content">
              <div className="space-y-8">
                <SubSection title="KPI Cards">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard title="Omzet vandaag" value="€2.847" icon={Euro} trend={{ value: "+12%", positive: true }} />
                    <KPICard title="Gasten" value="156" icon={Users} trend={{ value: "+8%", positive: true }} subtitle="23 reserveringen" />
                    <KPICard title="Gemiddelde tijd" value="42 min" icon={Clock} trend={{ value: "-5%", positive: true }} />
                    <KPICard title="Open taken" value="12" icon={ClipboardList} />
                  </div>
                </SubSection>

                <SubSection title="Content Card">
                  <div className="max-w-md">
                    <div className="bg-card rounded-polar-lg border border-border overflow-hidden hover:shadow-elevated transition-all">
                      <div className="aspect-video bg-gradient-to-br from-secondary to-primary" />
                      <div className="p-5">
                        <h3 className="font-semibold text-foreground mb-2">Card Titel</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Dit is een voorbeeld van een content card met afbeelding, titel, beschrijving en actie.
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm">Bekijken</Button>
                          <Button variant="outline" size="sm">Delen</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Interactive Card">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { icon: ChefHat, title: "Keuken", desc: "Recepten en MEP" },
                      { icon: ClipboardList, title: "Taken", desc: "Dagelijkse checklist" },
                      { icon: Users, title: "Team", desc: "Personeel beheren" },
                    ].map((item, i) => (
                      <button key={i} className="flex items-center gap-4 p-5 bg-card rounded-polar-lg border border-border hover:border-primary hover:shadow-elevated transition-all text-left group">
                        <div className="p-3 rounded-polar-md bg-secondary group-hover:bg-primary transition-colors">
                          <item.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== DATA DISPLAY ==================== */}
            <Section id="data" title="Data Display" description="Tabellen, badges en status indicators">
              <div className="space-y-8">
                <SubSection title="Badges">
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </SubSection>

                <SubSection title="Status Badges">
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="active" />
                    <StatusBadge status="pending" />
                    <StatusBadge status="inactive" />
                    <StatusBadge status="error" />
                  </div>
                </SubSection>

                <SubSection title="Tabel">
                  <div className="rounded-polar-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableHead className="font-semibold">Naam</TableHead>
                          <TableHead className="font-semibold">Rol</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold text-right">Taken</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Jan Visser", role: "Bediening", status: "active" as const, tasks: 8 },
                          { name: "Sophie Jansen", role: "Keuken", status: "pending" as const, tasks: 5 },
                          { name: "Peter de Groot", role: "Manager", status: "active" as const, tasks: 12 },
                        ].map((row, i) => (
                          <TableRow key={i} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell className="text-muted-foreground">{row.role}</TableCell>
                            <TableCell><StatusBadge status={row.status} /></TableCell>
                            <TableCell className="text-right">{row.tasks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </SubSection>

                <SubSection title="Progress">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">Taken voltooid</span>
                        <span className="text-muted-foreground">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">Reserveringen</span>
                        <span className="text-muted-foreground">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </SubSection>

                <SubSection title="Skeleton Loading">
                  <div className="flex gap-4">
                    <div className="space-y-3 w-64">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-24 w-48 rounded-xl" />
                  </div>
                </SubSection>

                <SubSection title="Avatars">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-secondary text-primary">XS</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-sm bg-secondary text-primary">SM</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-secondary text-primary">MD</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-16 h-16">
                        <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
                        <AvatarFallback className="bg-secondary text-primary">LG</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-secondary text-primary">JV</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-pv-success border-2 border-card" />
                      </div>
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-secondary text-primary">SJ</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-pv-warning border-2 border-card" />
                      </div>
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-secondary text-primary">PG</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-muted-foreground border-2 border-card" />
                      </div>
                    </div>
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== FEEDBACK ==================== */}
            <Section id="feedback" title="Feedback" description="Alerts, dialogs en meldingen">
              <div className="space-y-8">
                <SubSection title="Alerts">
                  <div className="space-y-4">
                    <Alert variant="info" title="Informatie" description="Dit is een informatief bericht voor de gebruiker." />
                    <Alert variant="success" title="Succes" description="De actie is succesvol uitgevoerd." />
                    <Alert variant="warning" title="Waarschuwing" description="Let op, er kan iets mis gaan." />
                    <Alert variant="error" title="Fout" description="Er is een fout opgetreden. Probeer het opnieuw." />
                  </div>
                </SubSection>

                <SubSection title="Toast Notifications">
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={() => toast.success("Succesvol opgeslagen!")}>
                      Success Toast
                    </Button>
                    <Button variant="outline" onClick={() => toast.error("Er ging iets mis!")}>
                      Error Toast
                    </Button>
                    <Button variant="outline" onClick={() => toast.info("Nieuwe update beschikbaar")}>
                      Info Toast
                    </Button>
                    <Button variant="outline" onClick={() => toast.warning("Let op: bijna vol")}>
                      Warning Toast
                    </Button>
                  </div>
                </SubSection>

                <SubSection title="Dialog">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bevestig actie</DialogTitle>
                        <DialogDescription>
                          Weet je zeker dat je deze actie wilt uitvoeren? Dit kan niet ongedaan gemaakt worden.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Annuleren</Button>
                        <Button>Bevestigen</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SubSection>

                <SubSection title="Tooltip">
                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon"><Info className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dit is een tooltip met extra informatie</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Instellingen</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon"><Bell className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notificaties</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </SubSection>

                <SubSection title="Empty & Error States">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EmptyState />
                    <ErrorState />
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== REAL-WORLD MODULES ==================== */}
            <Section id="modules" title="Real-World Modules" description="Complete UI componenten uit de applicatie">
              <div className="space-y-8">
                <SubSection title="Order Card">
                  <div className="max-w-md">
                    <OrderCard />
                  </div>
                </SubSection>

                <SubSection title="Task Cards">
                  <div className="space-y-4">
                    <TaskCard status="open" />
                    <TaskCard status="progress" />
                    <TaskCard status="done" />
                  </div>
                </SubSection>

                <SubSection title="Reservation Card">
                  <div className="max-w-md">
                    <ReservationCard />
                  </div>
                </SubSection>

                <SubSection title="Staff Card">
                  <div className="space-y-4 max-w-lg">
                    <StaffCard status="working" />
                    <StaffCard status="break" />
                    <StaffCard status="offline" />
                  </div>
                </SubSection>
              </div>
            </Section>

            {/* ==================== NAVIGATION ==================== */}
            <Section id="navigation" title="Navigatie" description="Tabs, breadcrumbs en menu's">
              <div className="space-y-8">
                <SubSection title="Tabs">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                      <TabsTrigger value="overview">Overzicht</TabsTrigger>
                      <TabsTrigger value="analytics">Analyse</TabsTrigger>
                      <TabsTrigger value="settings">Instellingen</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">Overzicht content</p>
                    </TabsContent>
                    <TabsContent value="analytics" className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">Analyse content</p>
                    </TabsContent>
                    <TabsContent value="settings" className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">Instellingen content</p>
                    </TabsContent>
                  </Tabs>
                </SubSection>

                <SubSection title="Breadcrumbs">
                  <nav className="flex items-center gap-2 text-sm">
                    <a href="#" className="text-muted-foreground hover:text-primary">Home</a>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <a href="#" className="text-muted-foreground hover:text-primary">Dashboard</a>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">Taken</span>
                  </nav>
                </SubSection>

                <SubSection title="Dropdown Menu">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <User className="w-4 h-4" />
                        Account
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem><User className="w-4 h-4 mr-2" />Profiel</DropdownMenuItem>
                      <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Instellingen</DropdownMenuItem>
                      <DropdownMenuItem><Bell className="w-4 h-4 mr-2" />Notificaties</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Uitloggen</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SubSection>
              </div>
            </Section>

          </main>
        </div>
      </div>
    </div>
  );
};

export default DesignSystem;
