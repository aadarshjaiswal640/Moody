import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BreathingAnimation from "@/components/breathing-animation";

const breathingPatterns = {
  '4-4-4-4': { label: '4-4-4-4 (Box)', pattern: [4, 4, 4, 4] },
  '4-7-8': { label: '4-7-8 (Relax)', pattern: [4, 7, 8, 0] },
  '6-2-6-2': { label: '6-2-6-2 (Deep)', pattern: [6, 2, 6, 2] },
};

const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];

const inspirationalQuotes = [
  "Breathe in peace, breathe out stress.",
  "In this moment, you are exactly where you need to be.",
  "Every breath is a new beginning.",
  "Find calm in the chaos through your breath.",
  "Your breath is your anchor to the present moment.",
  "Inhale confidence, exhale doubt.",
  "Let your breath guide you to inner peace.",
  "With each breath, you become more centered.",
];

export default function BreathingTool() {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState('5');
  const [pattern, setPattern] = useState('4-7-8');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCount, setCurrentCount] = useState(4);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentQuote, setCurrentQuote] = useState(inspirationalQuotes[0]);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const phaseTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/breathing-sessions', data);
    },
    onSuccess: () => {
      toast({
        title: "Session completed! 🧘",
        description: "Great job on completing your breathing exercise.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breathing-sessions'] });
    },
  });

  const startSession = () => {
    setIsActive(true);
    setSessionStartTime(new Date());
    setCurrentPhase(0);
    const patternData = breathingPatterns[pattern as keyof typeof breathingPatterns];
    setCurrentCount(patternData.pattern[0]);
    
    // Start the breathing cycle
    breathingCycle();
    
    // Set session timeout
    const sessionDuration = parseInt(duration) * 60 * 1000;
    sessionTimeoutRef.current = setTimeout(() => {
      stopSession(true);
    }, sessionDuration);
  };

  const stopSession = (completed = false) => {
    setIsActive(false);
    
    // Clear all timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    
    // Save session if completed
    if (completed && sessionStartTime) {
      const actualDuration = Math.round(
        (new Date().getTime() - sessionStartTime.getTime()) / 60000
      );
      saveSessionMutation.mutate({
        duration: actualDuration,
        pattern,
      });
    }
    
    setSessionStartTime(null);
    setCurrentPhase(0);
    const patternData = breathingPatterns[pattern as keyof typeof breathingPatterns];
    setCurrentCount(patternData.pattern[0]);
  };

  const breathingCycle = () => {
    if (!isActive) return;
    
    const patternData = breathingPatterns[pattern as keyof typeof breathingPatterns];
    const phaseDuration = patternData.pattern[currentPhase];
    let count = phaseDuration;
    
    setCurrentCount(count);
    
    // Count down for current phase
    intervalRef.current = setInterval(() => {
      count--;
      setCurrentCount(count);
      
      if (count <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Move to next phase
        const nextPhase = (currentPhase + 1) % 4;
        setCurrentPhase(nextPhase);
        
        // Change quote every breathing cycle (when returning to inhale phase)
        if (nextPhase === 0) {
          const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
          setCurrentQuote(randomQuote);
        }
        
        // Short delay before next phase
        phaseTimeoutRef.current = setTimeout(() => {
          breathingCycle();
        }, 100);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, []);

  const refreshQuote = () => {
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    setCurrentQuote(randomQuote);
    toast({
      title: "New inspiration",
      description: "Quote refreshed for your breathing session.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Breathing Exercise</h2>
            <p className="text-slate-600 mb-8">Take a moment to center yourself with guided breathing</p>
            
            {/* Breathing Animation */}
            <div className="relative mx-auto mb-8 w-64 h-64 flex items-center justify-center">
              <BreathingAnimation 
                isActive={isActive}
                phase={currentPhase}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white mb-2">
                    {phases[currentPhase]}
                  </div>
                  <div className="text-lg text-white opacity-80">
                    {currentCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                {!isActive ? (
                  <Button 
                    onClick={startSession}
                    size="lg"
                    className="px-8 py-3"
                  >
                    Start Session
                  </Button>
                ) : (
                  <Button 
                    onClick={() => stopSession(false)}
                    variant="secondary"
                    size="lg"
                    className="px-8 py-3"
                  >
                    Stop
                  </Button>
                )}
              </div>
              
              {/* Session Settings */}
              {!isActive && (
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600">Duration:</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600">Pattern:</label>
                    <Select value={pattern} onValueChange={setPattern}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(breathingPatterns).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspirational Quotes */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daily Inspiration</h3>
            <button
              onClick={refreshQuote}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              New Quote
            </button>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <div className="text-center">
              <div className="text-4xl text-indigo-500 mb-4">✨</div>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                "{currentQuote}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
