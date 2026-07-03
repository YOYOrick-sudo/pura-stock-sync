import { useRef, useState } from 'react';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTicket } from '@/hooks/maintenance/useMaintenanceTickets';
import { uploadMaintenancePhoto } from '@/hooks/maintenance/useMaintenancePhoto';
import { PLEK_OPTIONS, type MaintenanceUser, type Prioriteit } from '@/types/maintenance';
import { toast } from 'sonner';

interface NewTicketFormProps {
  user: MaintenanceUser;
  onBack: () => void;
  onSuccess: () => void;
}

const prioriteitOptions: { value: Prioriteit; label: string; hint: string; color: string }[] = [
  { value: 'laag', label: 'Laag', hint: 'Kan wachten', color: '#2D8E6F' },
  { value: 'midden', label: 'Normaal', hint: 'Deze week', color: '#F59E0B' },
  { value: 'hoog', label: 'Hoog', hint: 'Nu regelen', color: '#EF4444' },
];

const backButtonStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '14px',
  border: '1.5px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

export function NewTicketForm({ user, onBack, onSuccess }: NewTicketFormProps) {
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
        vestiging: user.vestiging,
        titel: titel.trim(),
        toelichting: toelichting.trim() || undefined,
        prioriteit,
        plek: plek || null,
        foto_url,
        ...(user.isStaff
          ? { melder_user_id: user.id, melder_naam: user.naam }
          : { melder_id: user.id, melder_naam: user.naam }),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={backButtonStyle} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-semibold text-foreground">Nieuwe melding</h1>
      </div>

      <div className="space-y-6" style={{ maxWidth: '640px' }}>
        {/* Titel */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Wat is er aan de hand? *
          </label>
          <Input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="bijv. Kraan lekt, deur klemt, lamp kapot"
            autoFocus
            maxLength={120}
            className="rounded-[14px] border-1.5 text-base h-[52px] px-4"
          />
        </div>

        {/* Urgentie */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Hoe urgent? *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {prioriteitOptions.map((opt) => {
              const active = prioriteit === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPrioriteit(opt.value)}
                  className="active:scale-95"
                  style={{
                    padding: '14px 8px',
                    borderRadius: '20px',
                    border: active ? `3px solid ${opt.color}` : '1.5px solid hsl(var(--border))',
                    backgroundColor: active ? opt.color : 'hsl(var(--card))',
                    color: active ? '#fff' : 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '72px',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{opt.label}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      opacity: active ? 0.9 : 0.55,
                      fontWeight: 500,
                    }}
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
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Waar in de zaak?{' '}
            <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PLEK_OPTIONS.map((p) => {
              const active = plek === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlek(active ? null : p)}
                  className="active:scale-95"
                  style={{
                    minHeight: '44px',
                    padding: '0 16px',
                    borderRadius: '14px',
                    border: active
                      ? '2px solid hsl(var(--primary))'
                      : '1.5px solid hsl(var(--border))',
                    backgroundColor: active
                      ? 'hsl(var(--primary) / 0.1)'
                      : 'hsl(var(--card))',
                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Foto */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Foto{' '}
            <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
          />
          {photoPreview ? (
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: '20px',
                border: '1.5px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--muted))',
              }}
            >
              <img
                src={photoPreview}
                alt="Voorbeeld"
                style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={clearPhoto}
                className="hover:bg-black/70"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="hover:bg-muted active:scale-[0.99]"
              style={{
                width: '100%',
                minHeight: '96px',
                borderRadius: '20px',
                border: '1.5px dashed hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm font-medium">Foto maken of kiezen</span>
            </button>
          )}
        </div>

        {/* Toelichting */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Toelichting{' '}
            <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
          </label>
          <Textarea
            value={toelichting}
            onChange={(e) => setToelichting(e.target.value)}
            placeholder="Extra details die je kwijt wilt..."
            rows={3}
            maxLength={1000}
            className="rounded-[14px] border-1.5 text-base resize-none p-4"
          />
        </div>

        {/* Meta */}
        <div className="rounded-[14px] bg-muted p-3 px-4 text-[13px] text-muted-foreground">
          Vestiging: <strong className="text-foreground capitalize">{user.vestiging}</strong>{' '}
          &middot; Melder: <strong className="text-foreground">{user.naam}</strong>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createTicket.isPending}
          className="w-full h-14 rounded-[20px] text-base font-semibold"
          style={{
            backgroundColor: canSubmit ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            color: 'hsl(var(--primary-foreground))',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
        >
          {uploading || createTicket.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Versturen...
            </span>
          ) : (
            'Verstuur melding'
          )}
        </Button>
      </div>
    </div>
  );
}
