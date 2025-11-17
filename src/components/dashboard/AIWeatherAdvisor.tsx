import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface Suggestion {
  id?: string;
  type: string;
  text: string;
  reasoning: string;
}

interface AIWeatherAdvisorProps {
  suggestions: Suggestion[];
  onRefresh: () => void;
}

export function AIWeatherAdvisor({ suggestions, onRefresh }: AIWeatherAdvisorProps) {
  const { userLocation } = useUserLocation();
  const [feedbackStates, setFeedbackStates] = useState<Record<number, { showNote: boolean; note: string }>>({});
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

  const handleFeedback = async (index: number, feedback: 'accepted' | 'rejected', note?: string) => {
    try {
      const suggestion = suggestions[index];
      
      // Find the suggestion in database by matching text and recent timestamp
      const { data: dbSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('suggestion_text', suggestion.text)
        .eq('location', userLocation)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbSuggestions && dbSuggestions.length > 0) {
        await supabase
          .from('ai_suggestions')
          .update({
            user_feedback: feedback,
            feedback_note: note || null,
          })
          .eq('id', dbSuggestions[0].id);
      }

      toast.success(feedback === 'accepted' ? 'Suggestie geaccepteerd' : 'Feedback opgeslagen');
      
      // Mark as dismissed and clear note state
      setDismissedIndices(prev => new Set(prev).add(index));
      setFeedbackStates(prev => ({
        ...prev,
        [index]: { showNote: false, note: '' }
      }));

      // Fetch new suggestions after a short delay for animation
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  const handleCreateTask = async (suggestion: Suggestion, index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Je moet ingelogd zijn');
        return;
      }

      const { data: insertedTask, error: taskError } = await supabase
        .from('foh_tasks')
        .insert({
          location: userLocation,
          title: suggestion.text,
          due_date: new Date().toISOString().split('T')[0],
          priority: 2,
          category: 'Weer & AI',
          phase: null,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Update suggestion with created task
      const { data: dbSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('suggestion_text', suggestion.text)
        .eq('location', userLocation)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbSuggestions && dbSuggestions.length > 0) {
        await supabase
          .from('ai_suggestions')
          .update({
            user_feedback: 'accepted',
            created_task_id: insertedTask.id,
          })
          .eq('id', dbSuggestions[0].id);
      }

      toast.success('Taak aangemaakt');
      
      // Mark as dismissed and fetch new suggestion
      setDismissedIndices(prev => new Set(prev).add(index));
      
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij aanmaken taak');
    }
  };

  const toggleNote = (index: number) => {
    setFeedbackStates(prev => ({
      ...prev,
      [index]: {
        showNote: !prev[index]?.showNote,
        note: prev[index]?.note || '',
      }
    }));
  };

  return (
    <Card 
      className="p-6"
      style={{ 
        backgroundColor: '#F6F7DD',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5" style={{ color: '#1B7867' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#282E3A' }}>
          AI Suggesties voor Vandaag
        </h3>
      </div>

      <div className="space-y-4">
        {suggestions
          .filter((_, index) => !dismissedIndices.has(index))
          .map((suggestion, index) => (
          <div 
            key={index} 
            className="p-4 rounded-lg transition-all duration-300"
            style={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(197, 197, 202, 0.3)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium mb-1" style={{ color: '#282E3A' }}>
                  {suggestion.text}
                </p>
                <p className="text-sm" style={{ color: '#73747B' }}>
                  {suggestion.reasoning}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleCreateTask(suggestion, index)}
                className="gap-1"
                style={{ 
                  backgroundColor: '#1B7867',
                  color: '#FFFFFF'
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Maak Taak
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFeedback(index, 'accepted')}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleNote(index)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            {feedbackStates[index]?.showNote && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Optioneel: waarom niet relevant?"
                  value={feedbackStates[index]?.note || ''}
                  onChange={(e) => setFeedbackStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], note: e.target.value }
                  }))}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFeedback(index, 'rejected', feedbackStates[index]?.note)}
                  >
                    Verstuur Feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFeedback(index, 'rejected')}
                  >
                    Afwijzen zonder reden
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleNote(index)}
                  >
                    Annuleer
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
