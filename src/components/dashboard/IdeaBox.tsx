import { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';
import { devError } from "@/lib/devLog";

export function IdeaBox() {
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { userLocation } = useUserLocation();

  const handleSubmit = async () => {
    if (!idea.trim() || !userLocation) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('idee-melden', {
        body: { ideaText: idea.trim(), location: userLocation },
      });

      if (error) throw error;

      const mislukt = (data as { mislukt?: number } | null)?.mislukt ?? 0;
      const ontvangers = (data as { ontvangers?: number } | null)?.ontvangers ?? 0;

      if (mislukt > 0 && mislukt === ontvangers) {
        toast.error('Idee opgeslagen, maar versturen van mail naar MT is mislukt.');
      } else if (mislukt > 0) {
        toast.warning(`Idee verstuurd, maar ${mislukt} van ${ontvangers} mails faalden.`);
      } else {
        toast.success('Bedankt! Je idee is anoniem verstuurd naar het MT.');
      }
      setIdea('');
    } catch (error) {
      devError('Error submitting idea:', error);
      toast.error('Er ging iets mis bij het versturen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-card border border-border/60 rounded-[20px] shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-secondary">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Ideeënbus</h3>
          <span className="text-xs text-muted-foreground">— anoniem</span>
        </div>
        
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Deel je idee, suggestie of feedback..."
          maxLength={500}
          className="min-h-[80px] text-sm resize-none mb-2"
          disabled={submitting}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {idea.length}/500
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!idea.trim() || submitting}
          >
            <Send size={14} />
            {submitting ? 'Versturen...' : 'Verstuur'}
          </Button>
        </div>
    </div>
  );
}
