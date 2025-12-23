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
} from "lucide-react";

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
  const Icon = v.icon;
  
  return (
    <div className={`${v.bg} ${v.border} border rounded-xl p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 ${v.iconColor} flex-shrink-0 mt-0.5`} />
      <div>
        <div className={`font-semibold ${v.titleColor}`}>{title}</div>
        <div className={`text-sm ${v.descColor} mt-0.5`}>{description}</div>
      </div>
    </div>
  );
};

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
              {['Keuken', 'Bediening', 'Kassa'].map((item) => (
                <div 
                  key={item}
                  className="p-5 rounded-xl border border-pv-border bg-white hover:border-pv-border-hover hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 group-hover:text-pv-primary transition-colors">
                      {item}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-pv-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Klik om naar {item.toLowerCase()} module te gaan
                  </p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </SidebarLayout>
  );
}
