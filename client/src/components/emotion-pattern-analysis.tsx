import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const emotionColors: Record<string, string> = {
  happy: 'bg-yellow-500',
  excited: 'bg-orange-500',
  love: 'bg-pink-500',
  calm: 'bg-blue-500',
  neutral: 'bg-gray-500',
  anxious: 'bg-purple-500',
  sad: 'bg-indigo-500',
  angry: 'bg-red-500',
};

interface EmotionTransition {
  from: string;
  to: string;
  count: number;
  avgTimeBetween: number;
  triggerPatterns: string[];
}

interface EmotionPatternData {
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;
  weeklyTrends: Record<string, number>;
  commonTransitions: EmotionTransition[];
  emotionTriggers: Record<string, number>;
  timePatterns: Record<string, string[]>;
}

export default function EmotionPatternAnalysis() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  
  const endDate = new Date();
  const startDate = selectedTimeframe === 'week' 
    ? startOfWeek(endDate)
    : subWeeks(endDate, 4);

  const { data: moodData, isLoading } = useQuery({
    queryKey: ['/api/mood-entries/range', startDate.toDateString(), endDate.toDateString()],
    queryFn: async () => {
      const response = await fetch(`/api/mood-entries/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch mood data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const analyzeEmotionPatterns = (entries: any[]): EmotionPatternData => {
    if (!entries || entries.length === 0) {
      return {
        dominantEmotion: 'neutral',
        emotionDistribution: {},
        weeklyTrends: {},
        commonTransitions: [],
        emotionTriggers: {},
        timePatterns: {},
      };
    }

    // Analyze emotion distribution
    const emotionCounts: Record<string, number> = {};
    const emotionTriggers: Record<string, number> = {};
    const timePatterns: Record<string, string[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    entries.forEach((entry: any) => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
      
      // Analyze triggers
      if (entry.emotionTriggers) {
        entry.emotionTriggers.forEach((trigger: string) => {
          emotionTriggers[trigger] = (emotionTriggers[trigger] || 0) + 1;
        });
      }

      // Analyze time patterns
      const hour = new Date(entry.timestamp).getHours();
      if (hour >= 5 && hour < 12) timePatterns.morning.push(entry.emotion);
      else if (hour >= 12 && hour < 17) timePatterns.afternoon.push(entry.emotion);
      else if (hour >= 17 && hour < 21) timePatterns.evening.push(entry.emotion);
      else timePatterns.night.push(entry.emotion);
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    // Analyze transitions
    const transitions: Record<string, EmotionTransition> = {};
    for (let i = 1; i < entries.length; i++) {
      const from = entries[i - 1].emotion;
      const to = entries[i].emotion;
      if (from !== to) {
        const key = `${from}-${to}`;
        if (!transitions[key]) {
          transitions[key] = {
            from,
            to,
            count: 0,
            avgTimeBetween: 0,
            triggerPatterns: [],
          };
        }
        transitions[key].count++;
        
        const timeDiff = new Date(entries[i].timestamp).getTime() - 
                        new Date(entries[i - 1].timestamp).getTime();
        transitions[key].avgTimeBetween = 
          (transitions[key].avgTimeBetween + timeDiff) / transitions[key].count;

        if (entries[i].emotionTriggers) {
          transitions[key].triggerPatterns.push(...entries[i].emotionTriggers);
        }
      }
    }

    const commonTransitions = Object.values(transitions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      dominantEmotion,
      emotionDistribution: emotionCounts,
      weeklyTrends: emotionCounts,
      commonTransitions,
      emotionTriggers,
      timePatterns,
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patterns = analyzeEmotionPatterns(moodData || []);
  const totalEntries = Object.values(patterns.emotionDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Emotion Pattern Analysis
            </h2>
            <div className="flex gap-2">
              <Button
                variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe('week')}
              >
                This Week
              </Button>
              <Button
                variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe('month')}
              >
                Last Month
              </Button>
            </div>
          </div>

          {totalEntries === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No emotion data yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Start logging your emotions to see personalized patterns and insights.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transitions">Transitions</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="timing">Time Patterns</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Dominant Emotion
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${emotionColors[patterns.dominantEmotion]} flex items-center justify-center text-white font-bold text-lg`}>
                          {patterns.dominantEmotion.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-slate-900 dark:text-slate-100">
                            {patterns.dominantEmotion}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Most frequent emotion
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Emotion Balance
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(patterns.emotionDistribution)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 4)
                          .map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${emotionColors[emotion]}`}></div>
                              <span className="text-sm capitalize text-slate-700 dark:text-slate-300 flex-1">
                                {emotion}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {Math.round((count / totalEntries) * 100)}%
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transitions" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Common Emotion Transitions
                    </h3>
                    {patterns.commonTransitions.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                        Not enough data to show transitions. Log more emotions to see patterns.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {patterns.commonTransitions.map((transition, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${emotionColors[transition.from]} flex items-center justify-center text-white text-sm font-bold`}>
                                {transition.from.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-slate-400">→</span>
                              <div className={`w-8 h-8 rounded-full ${emotionColors[transition.to]} flex items-center justify-center text-white text-sm font-bold`}>
                                {transition.to.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                  {transition.from} → {transition.to}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {transition.count} times
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">{transition.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="triggers" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Top Emotion Triggers
                    </h3>
                    {Object.keys(patterns.emotionTriggers).length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                        No trigger data available. Add triggers to your mood entries to see insights.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(patterns.emotionTriggers)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 6)
                          .map(([trigger, count]) => (
                            <div key={trigger} className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                                {trigger.replace('_', ' ')}
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={(count / Math.max(...Object.values(patterns.emotionTriggers))) * 100} 
                                  className="w-24 h-2"
                                />
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(patterns.timePatterns).map(([period, emotions]) => (
                    <Card key={period}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 capitalize flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {period}
                        </h3>
                        {emotions.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No data</p>
                        ) : (
                          <div className="space-y-2">
                            {Array.from(new Set(emotions)).map((emotion) => (
                              <div key={emotion} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${emotionColors[emotion]}`}></div>
                                  <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                                    {emotion}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {emotions.filter(e => e === emotion).length}x
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}