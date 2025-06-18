import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EmotionSelector from "@/components/emotion-selector";

const activities = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'exercise', label: 'Exercise', icon: '🏋️' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'eating', label: 'Eating', icon: '🍽️' },
  { id: 'relaxing', label: 'Relaxing', icon: '🛋️' },
  { id: 'studying', label: 'Studying', icon: '📚' },
];

const emotionTriggers = [
  { id: 'work_stress', label: 'Work Stress', category: 'work' },
  { id: 'relationship', label: 'Relationships', category: 'social' },
  { id: 'health', label: 'Health Issues', category: 'personal' },
  { id: 'finances', label: 'Financial Concerns', category: 'personal' },
  { id: 'weather', label: 'Weather', category: 'environment' },
  { id: 'news', label: 'News/Media', category: 'external' },
  { id: 'sleep', label: 'Sleep Quality', category: 'health' },
  { id: 'achievement', label: 'Accomplishment', category: 'positive' },
];

export default function MoodLogger() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([5]);
  const [thoughts, setThoughts] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMoodMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/mood-entries', data);
    },
    onSuccess: () => {
      toast({
        title: "Mood saved! 🎉",
        description: "Your mood entry has been recorded successfully.",
      });
      
      // Reset form
      setSelectedEmotion(null);
      setIntensity([5]);
      setThoughts('');
      setSelectedActivity(null);
      setSelectedTriggers([]);
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/mood-summary'] });
    },
    onError: (error) => {
      toast({
        title: "Error saving mood",
        description: "There was a problem saving your mood entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedEmotion) {
      toast({
        title: "Select an emotion",
        description: "Please choose how you're feeling before saving.",
        variant: "destructive",
      });
      return;
    }

    const moodEntry = {
      emotion: selectedEmotion,
      intensity: intensity[0],
      thoughts: thoughts.trim() || null,
      activity: selectedActivity,
      emotionTriggers: selectedTriggers.length > 0 ? selectedTriggers : null,
    };

    saveMoodMutation.mutate(moodEntry);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">How are you feeling?</h2>
        
        {/* Emotion Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Choose your emotion
          </label>
          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onEmotionSelect={setSelectedEmotion}
          />
        </div>

        {/* Intensity Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Intensity Level
          </label>
          <div className="px-4">
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>1</span>
              <span className="font-medium text-slate-700">{intensity[0]}</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Thoughts Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            What's on your mind?
          </label>
          <Textarea
            placeholder="Describe your thoughts and feelings..."
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Activity Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Current Activity
          </label>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity.id === selectedActivity ? null : activity.id)}
                className={`px-3 py-2 text-sm rounded-full transition-colors flex items-center gap-1 ${
                  selectedActivity === activity.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
              >
                <span>{activity.icon}</span>
                {activity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotion Triggers */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            What triggered this emotion? (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {emotionTriggers.map((trigger) => (
              <button
                key={trigger.id}
                onClick={() => {
                  setSelectedTriggers(prev => 
                    prev.includes(trigger.id) 
                      ? prev.filter(t => t !== trigger.id)
                      : [...prev, trigger.id]
                  );
                }}
                className={`px-3 py-2 text-sm rounded-full transition-colors ${
                  selectedTriggers.includes(trigger.id)
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-700 border border-slate-300'
                }`}
              >
                {trigger.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
            <div className="text-slate-400 text-xl mb-2">📷</div>
            <p className="text-sm text-slate-600">Add Photo</p>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </button>
          <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
            <div className="text-slate-400 text-xl mb-2">📍</div>
            <p className="text-sm text-slate-600">Add Location</p>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </button>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={saveMoodMutation.isPending}
          className="w-full py-4 text-lg font-semibold"
        >
          {saveMoodMutation.isPending ? 'Saving...' : 'Save Mood Entry'}
        </Button>
      </CardContent>
    </Card>
  );
}
