import { useState, useEffect } from 'react';
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
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { showNote: boolean; note: string }>>({});
  const [dismissedTexts, setDismissedTexts] = useState<Set<string>>(new Set());

  // Reset states when suggestions change
  useEffect(() => {
    setDismissedTexts(new Set());
    setFeedbackStates({});
  }, [suggestions]);

  const handleFeedback = async (suggestionText: string, feedback: 'accepted' | 'rejected', note?: string) => {
    try {
      const { data: dbSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('suggestion_text', suggestionText)
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
      
      setDismissedTexts(prev => new Set(prev).add(suggestionText));
      setFeedbackStates(prev => {
        const newStates = { ...prev };
        delete newStates[suggestionText];
        return newStates;
      });

      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Fout bij opslaan feedback');
    }
  };

  const handleCreateTask = async (suggestion: Suggestion) => {
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
      
      setDismissedTexts(prev => new Set(prev).add(suggestion.text));
      
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij aanmaken taak');
    }
  };

  const toggleNote = (suggestionText: string) => {
    setFeedbackStates(prev => ({
      ...prev,
      [suggestionText]: {
        showNote: !prev[suggestionText]?.showNote,
        note: prev[suggestionText]?.note || '',
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
          .filter(s => !dismissedTexts.has(s.text))
          .map((suggestion) => (
          <div 
            key={suggestion.text}
            className="p-4 rounded-lg transition-all duration-300"
            style={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(197, 197, 202, 0.3)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Render markdown met secties */}
                <div className="space-y-3">
                  {suggestion.text.split('\n').map((line, i) => {
                    if (line.startsWith('### 🎯')) {
                      return <h3 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: '#282E3A' }}>{line.replace('###', '').trim()}</h3>;
                    }
                    if (line.startsWith('### 💰')) {
                      return <h3 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: '#282E3A' }}>{line.replace('###', '').trim()}</h3>;
                    }
                    if (line.startsWith('### 🎁')) {
                      return <h3 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: '#282E3A' }}>{line.replace('###', '').trim()}</h3>;
                    }
                    if (line.startsWith('### ✨')) {
                      return <h3 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: '#282E3A' }}>{line.replace('###', '').trim()}</h3>;
                    }
                    if (line.startsWith('### ⚡')) {
                      return <h3 key={i} className="text-base font-semibold mt-3 mb-1" style={{ color: '#282E3A' }}>{line.replace('###', '').trim()}</h3>;
                    }
                    if (line.trim()) {
                      return <p key={i} className="text-sm mb-2" style={{ color: '#282E3A' }}>{line}</p>;
                    }
                    return null;
                  })}
                </div>
                
                {/* Reasoning onderaan in klein grijze tekst */}
                {suggestion.reasoning && (
                  <p className="text-xs mt-3" style={{ color: '#73747B' }}>
                    {suggestion.reasoning}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleCreateTask(suggestion)}
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
                onClick={() => handleFeedback(suggestion.text, 'accepted')}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleNote(suggestion.text)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            {feedbackStates[suggestion.text]?.showNote && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Optioneel: waarom niet relevant?"
                  value={feedbackStates[suggestion.text]?.note || ''}
                  onChange={(e) => setFeedbackStates(prev => ({
                    ...prev,
                    [suggestion.text]: { ...prev[suggestion.text], note: e.target.value }
                  }))}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFeedback(suggestion.text, 'rejected', feedbackStates[suggestion.text]?.note)}
                  >
                    Verstuur Feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFeedback(suggestion.text, 'rejected')}
                  >
                    Afwijzen zonder reden
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleNote(suggestion.text)}
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
