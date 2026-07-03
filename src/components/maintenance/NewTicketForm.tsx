import { useRef, useState } from 'react';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTicket } from '@/hooks/maintenance/useMaintenanceTickets';
import { uploadMaintenancePhoto } from '@/hooks/maintenance/useMaintenancePhoto';
import { PLEK_OPTIONS, type MaintenanceActor, type Prioriteit } from '@/types/maintenance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/components/pura';

interface NewTicketFormProps {
  actor: MaintenanceActor;
  onBack: () => void;
  onSuccess: () => void;
}

const prioriteitOptions: { value: Prioriteit; label: string; hint: string; tone: StatusTone }[] = [
  { value: 'laag', label: 'Laag', hint: 'Kan wachten', tone: 'success' },
  { value: 'midden', label: 'Normaal', hint: 'Deze week', tone: 'warning' },
  { value: 'hoog', label: 'Hoog', hint: 'Nu regelen', tone: 'danger' },
];

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
      {children}
    </label>
  );
}

export function NewTicketForm({ actor, onBack, onSuccess }: NewTicketFormProps) {
  const [titel, setTitel] = useState('');
  const [prioriteit, setPrioriteit] = useState<Prioriteit | null>(null);
  const [plek, setPlek] = useState<string | null>(null);
  const [toelichting, setToelichting] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createTicket = useCreateTicket();

  const canSubmit = titel.trim().length > 0 && prioriteit !== null && !uploading;

  const handlePhotoSelect = (file: File | undefined) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!canSubmit || !prioriteit) return;

    try {
      setUploading(true);
      let foto_url: string | null = null;
      if (photoFile) {
        foto_url = await uploadMaintenancePhoto(photoFile);
      }

      await createTicket.mutateAsync({
        vestiging: actor.vestiging,
        titel: titel.trim(),
        toelichting: toelichting.trim() || undefined,
        prioriteit,
        plek: plek || null,
        foto_url,
        melder_user_id: actor.id,
        melder_naam: actor.naam,
      });
      toast.success('Melding verstuurd!');
      onSuccess();
    } catch (err) {
      console.error('[NewTicketForm]', err);
      toast.error('Er ging iets mis. Probeer opnieuw.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[640px]">
      {/* Terug-navigatie */}
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
          <ArrowLeft className="h-4 w-4" />
          Terug
        </Button>
      </div>

      {/* Titel */}
      <div className="space-y-2">
        <FormLabel>Wat is er aan de hand? *</FormLabel>
        <Input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="bijv. Kraan lekt, deur klemt, lamp kapot"
          autoFocus
          maxLength={120}
          className="h-12 rounded-polar-md"
        />
      </div>

      {/* Urgentie */}
      <div className="space-y-2">
        <FormLabel>Hoe urgent? *</FormLabel>
        <div className="grid grid-cols-3 gap-3">
          {prioriteitOptions.map((opt) => {
            const active = prioriteit === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrioriteit(opt.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-h-[52px] px-3 py-2.5',
                  'rounded-polar-xl border transition-all duration-150 active:scale-[0.98]',
                  active
                    ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
                    : 'bg-card border-border text-foreground hover:border-primary/30',
                )}
              >
                <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                <span
                  className={cn(
                    'text-[11px] leading-tight',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plek */}
      <div className="space-y-2">
        <FormLabel>
          Waar in de zaak?{' '}
          <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
        </FormLabel>
        <div className="flex flex-wrap gap-2">
          {PLEK_OPTIONS.map((p) => {
            const active = plek === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPlek(active ? null : p)}
                className={cn(
                  'min-h-[44px] px-4 rounded-polar-md text-sm font-medium border transition-all duration-150',
                  active
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/30',
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Foto */}
      <div className="space-y-2">
        <FormLabel>
          Foto{' '}
          <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
        </FormLabel>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
        />
        {photoPreview ? (
          <div className="relative overflow-hidden rounded-polar-xl border border-border bg-muted">
            <img
              src={photoPreview}
              alt="Voorbeeld"
              className="w-full max-h-[320px] object-cover block"
            />
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Foto verwijderen"
              className="absolute top-3 right-3 w-9 h-9 rounded-polar-md bg-black/55 text-white flex items-center justify-center hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full min-h-[96px] rounded-polar-xl border border-dashed border-border bg-card text-muted-foreground flex flex-col items-center justify-center gap-1.5 hover:bg-muted transition-all duration-150"
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm font-medium">Foto maken of kiezen</span>
          </button>
        )}
      </div>

      {/* Toelichting */}
      <div className="space-y-2">
        <FormLabel>
          Toelichting{' '}
          <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
        </FormLabel>
        <Textarea
          value={toelichting}
          onChange={(e) => setToelichting(e.target.value)}
          placeholder="Extra details die je kwijt wilt..."
          rows={3}
          maxLength={1000}
          className="rounded-polar-md resize-none p-3"
        />
      </div>

      {/* Meta */}
      <div className="rounded-polar-md bg-muted px-4 py-3 text-xs text-muted-foreground">
        Vestiging: <strong className="text-foreground capitalize">{actor.vestiging}</strong>{' '}
        &middot; Melder: <strong className="text-foreground">{actor.naam}</strong>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || createTicket.isPending}
        size="lg"
        className="w-full"
      >
        {uploading || createTicket.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Versturen...
          </>
        ) : (
          'Verstuur melding'
        )}
      </Button>
    </div>
  );
}
