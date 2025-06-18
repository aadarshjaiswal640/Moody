import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import MoodChart from "@/components/mood-chart";
import HealthStats from "@/components/health-stats";
import MoodStreak from "@/components/mood-streak";
import { format } from "date-fns";
import type { MoodEntry } from "@shared/schema";

const emotionEmojis = {
  angry: '😠',
  sad: '😢',
  neutral: '😐',
  happy: '😊',
  excited: '🤩',
  love: '😍',
  anxious: '😰',
  calm: '😌'
};

const activityIcons = {
  work: '💼',
  exercise: '🏋️',
  social: '👥',
  eating: '🍽️',
  relaxing: '🛋️',
  studying: '📚'
};

export default function Dashboard() {
  const { data: recentEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/mood-entries?limit=5'],
  });

  const { data: moodSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/analytics/mood-summary?days=7'],
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/health-data/today'],
  });

  if (entriesLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-12 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const todaysMood = moodSummary?.averageMood || 0;
  const previousDayMood = 6.7; // This would come from analytics in a real app
  const moodChange = todaysMood - previousDayMood;

  return (
    <div className="space-y-6">
      {/* Health Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Today's Mood</p>
                <p className="text-2xl font-bold text-slate-900">
                  {todaysMood.toFixed(1)}
                </p>
                <p className={`text-xs ${moodChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {moodChange >= 0 ? '+' : ''}{moodChange.toFixed(1)} from yesterday
                </p>
              </div>
              <div className="text-3xl">😊</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Heart Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {healthData?.heartRate || '--'}
                </p>
                <p className="text-xs text-cyan-600">BPM • Normal</p>
              </div>
              <div className="text-cyan-500 text-2xl">💓</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sleep Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {healthData?.sleepScore || '--'}
                </p>
                <p className="text-xs text-green-600">
                  {healthData?.sleepHours ? `${healthData.sleepHours}h • Good` : '--'}
                </p>
              </div>
              <div className="text-indigo-500 text-2xl">😴</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mood Trend</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg">
                7 Days
              </button>
              <button className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                30 Days
              </button>
            </div>
          </div>
          <div className="h-64">
            <MoodChart />
          </div>
        </CardContent>
      </Card>

      {/* Mood Streak */}
      <MoodStreak />

      {/* Recent Entries */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Entries</h3>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="space-y-3">
              {(recentEntries as MoodEntry[]).map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100">
                  <div className="text-2xl">
                    {emotionEmojis[entry.emotion as keyof typeof emotionEmojis]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 capitalize">
                        {entry.emotion}
                      </span>
                      <span className="text-xs text-slate-500">
                        {entry.intensity}/10
                      </span>
                    </div>
                    {entry.thoughts && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {entry.thoughts}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {format(new Date(entry.timestamp), 'h:mm a')}
                      </span>
                      {entry.activity && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <span>{activityIcons[entry.activity as keyof typeof activityIcons]}</span>
                          <span className="capitalize">{entry.activity}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No mood entries yet.</p>
              <p className="text-sm">Start tracking your emotions to see insights here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
