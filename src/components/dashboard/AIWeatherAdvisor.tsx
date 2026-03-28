import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, Lightbulb, Utensils, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface Suggestion {
  id: string;
  text: string;
  reasoning: string;
}

interface AIWeatherAdvisorProps {
  onRefresh: () => void;
  canRefresh?: boolean;
}

export function AIWeatherAdvisor({ onRefresh, canRefresh = true }: AIWeatherAdvisorProps) {
  const { userLocation } = useUserLocation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, {
    showNote: boolean;
    note: string;
  }>>({});

  useEffect(() => {
    fetchAdvice();
  }, [userLocation]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather-ai-advisor', {
        body: { location: userLocation }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      setFeedbackStates({});
    } catch (error) {
      console.error('Error fetching advice:', error);
      toast.error('Kon advies niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (suggestionId: string, title: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Je moet ingelogd zijn');
        return;
      }

      const { error: taskError } = await supabase
        .from('foh_tasks')
        .insert({
          location: userLocation,
          title: title,
          due_date: new Date().toISOString().split('T')[0],
          priority: 2,
          category: 'Weer & AI',
          phase: null,
        });

      if (taskError) throw taskError;

      toast.success('Taak aangemaakt');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij aanmaken taak');
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      await supabase
        .from('ai_suggestions')
        .update({ user_feedback: 'accepted' })
        .eq('id', suggestionId);

      toast.success('Feedback opgeslagen');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      const note = feedbackStates[suggestionId]?.note || null;

      await supabase
        .from('ai_suggestions')
        .update({
          user_feedback: 'rejected',
          feedback_note: note
        })
        .eq('id', suggestionId);

      toast.success('Feedback opgeslagen');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  if (loading) {
    return (
      <Card className="bg-muted border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-foreground">
              AI Dagadvies
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={loading || !canRefresh}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Ververs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Advies wordt gegenereerd...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted border border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-foreground">
            AI Dagadvies
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Ververs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 rounded-polar-md bg-card border border-border/30"
            >
              <h4 className="font-semibold text-base mb-2 text-foreground">
                {suggestion.text}
              </h4>

              <p className="text-sm mb-3 text-muted-foreground">
                {suggestion.reasoning}
              </p>

              {feedbackStates[suggestion.id]?.showNote && (
                <Textarea
                  placeholder="Waarom niet relevant? (optioneel)"
                  value={feedbackStates[suggestion.id]?.note || ''}
                  onChange={(e) => setFeedbackStates(prev => ({
                    ...prev,
                    [suggestion.id]: { ...prev[suggestion.id], note: e.target.value }
                  }))}
                  className="mb-3 min-h-[60px]"
                />
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCreateTask(suggestion.id, suggestion.text, suggestion.reasoning)}
                  className="rounded-polar-md bg-primary text-primary-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Maak Taak
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcceptSuggestion(suggestion.id)}
                  className="rounded-polar-md"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Nuttig
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (feedbackStates[suggestion.id]?.showNote) {
                      handleRejectSuggestion(suggestion.id);
                    } else {
                      setFeedbackStates(prev => ({
                        ...prev,
                        [suggestion.id]: { showNote: true, note: '' }
                      }));
                    }
                  }}
                  className="rounded-polar-md"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {feedbackStates[suggestion.id]?.showNote ? 'Verstuur' : 'Niet relevant'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
