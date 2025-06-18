import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import EmotionPatternAnalysis from "@/components/emotion-pattern-analysis";

ChartJS.register(ArcElement, Tooltip, Legend);

const emotionColors = {
  happy: '#10B981',
  calm: '#06B6D4',
  excited: '#F59E0B',
  neutral: '#6B7280',
  anxious: '#8B5CF6',
  sad: '#3B82F6',
  angry: '#EF4444',
  love: '#EC4899',
};

export default function Insights() {
  const { data: moodSummary, isLoading } = useQuery({
    queryKey: ['/api/analytics/mood-summary?days=30'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
                <div className="h-32 bg-slate-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const emotionFrequency = (moodSummary as any)?.emotionFrequency || {};
  const totalEntries = (moodSummary as any)?.totalEntries || 0;

  // Prepare chart data
  const chartData = {
    labels: Object.keys(emotionFrequency).map(emotion => 
      emotion.charAt(0).toUpperCase() + emotion.slice(1)
    ),
    datasets: [
      {
        data: Object.values(emotionFrequency),
        backgroundColor: Object.keys(emotionFrequency).map(emotion => 
          emotionColors[emotion as keyof typeof emotionColors] || '#6B7280'
        ),
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const percentage = totalEntries > 0 ? ((value / totalEntries) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} entries (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate insights
  const mostFrequentEmotion = Object.entries(emotionFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  const averageMood = moodSummary?.averageMood || 0;
  const moodTrend = averageMood >= 7 ? 'positive' : averageMood >= 5 ? 'neutral' : 'concerning';

  return (
    <div className="space-y-6">
      {/* Mood Patterns */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Mood Patterns</h3>
          {totalEntries > 0 ? (
            <div className="h-64">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <p>No mood data available yet.</p>
                <p className="text-sm">Start logging your emotions to see patterns here.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Pattern Analysis */}
      <EmotionPatternAnalysis />

      {/* Correlations */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Mood & Health Correlations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exercise days</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900">+2.3</div>
                <div className="text-xs text-slate-500">avg mood boost</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Good sleep (8+ hrs)</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900">+1.8</div>
                <div className="text-xs text-slate-500">avg mood boost</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Social activities</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900">+1.5</div>
                <div className="text-xs text-slate-500">avg mood boost</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">This Month's Summary</h3>
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              moodTrend === 'positive' ? 'bg-green-50' : 
              moodTrend === 'neutral' ? 'bg-blue-50' : 'bg-amber-50'
            }`}>
              <div className={`text-xl ${
                moodTrend === 'positive' ? 'text-green-600' : 
                moodTrend === 'neutral' ? 'text-blue-600' : 'text-amber-600'
              }`}>
                📈
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  moodTrend === 'positive' ? 'text-green-800' : 
                  moodTrend === 'neutral' ? 'text-blue-800' : 'text-amber-800'
                }`}>
                  Average Mood: {averageMood.toFixed(1)}/10
                </p>
                <p className={`text-xs ${
                  moodTrend === 'positive' ? 'text-green-600' : 
                  moodTrend === 'neutral' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {moodTrend === 'positive' ? 'Great job maintaining positive mood!' : 
                   moodTrend === 'neutral' ? 'Your mood is stable this month.' : 
                   'Consider focusing on activities that boost your mood.'}
                </p>
              </div>
            </div>
            
            {mostFrequentEmotion && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 text-xl">💙</div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Most Frequent Emotion</p>
                  <p className="text-xs text-blue-600">
                    You felt {mostFrequentEmotion[0]} {
                      totalEntries > 0 ? 
                      Math.round(((mostFrequentEmotion[1] as number) / totalEntries) * 100) : 0
                    }% of the time
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <div className="text-amber-600 text-xl">💡</div>
              <div>
                <p className="text-sm font-medium text-amber-800">Insight</p>
                <p className="text-xs text-amber-600">
                  Your mood tends to be highest during social activities and after exercise
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
