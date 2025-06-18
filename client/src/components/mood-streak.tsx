import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Target, TrendingUp } from "lucide-react";
import { format, differenceInDays, startOfDay } from "date-fns";

interface MoodEntry {
  id: number;
  userId: number;
  emotion: string;
  intensity: number;
  timestamp: string;
}

export default function MoodStreak() {
  const { data: moodEntries, isLoading } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood-entries'],
    staleTime: 5 * 60 * 1000,
  });

  const calculateStreak = (entries: MoodEntry[]) => {
    if (!entries || entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastLoggedDate: null };
    }

    // Sort entries by date (newest first)
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Get unique days with mood entries
    const uniqueDays = new Set();
    sortedEntries.forEach(entry => {
      const day = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      uniqueDays.add(day);
    });

    const uniqueDaysArray = Array.from(uniqueDays).sort().reverse() as string[];
    
    if (uniqueDaysArray.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastLoggedDate: null };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));

    // Check if user logged today or yesterday to continue streak
    const lastLoggedDay = startOfDay(new Date(uniqueDaysArray[0]));
    const daysSinceLastLog = differenceInDays(today, lastLoggedDay);

    if (daysSinceLastLog <= 1) {
      // Start counting from the most recent day
      let checkDate = lastLoggedDay;
      
      for (let i = 0; i < uniqueDaysArray.length; i++) {
        const entryDate = startOfDay(new Date(uniqueDaysArray[i]));
        const expectedDate = new Date(checkDate.getTime() - i * 24 * 60 * 60 * 1000);
        
        if (entryDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDaysArray.length; i++) {
      const currentDate = new Date(uniqueDaysArray[i]);
      const previousDate = new Date(uniqueDaysArray[i - 1]);
      const dayDiff = differenceInDays(previousDate, currentDate);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastLoggedDate: uniqueDaysArray[0]
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const streakData = calculateStreak(moodEntries || []);
  const streakLevel = streakData.currentStreak >= 7 ? 'hot' : 
                     streakData.currentStreak >= 3 ? 'warm' : 'cool';

  const getStreakColor = () => {
    if (streakData.currentStreak >= 7) return 'text-red-500';
    if (streakData.currentStreak >= 3) return 'text-orange-500';
    return 'text-blue-500';
  };

  const getStreakBadge = () => {
    if (streakData.currentStreak >= 30) return { label: 'Master', color: 'bg-purple-500' };
    if (streakData.currentStreak >= 14) return { label: 'Expert', color: 'bg-red-500' };
    if (streakData.currentStreak >= 7) return { label: 'Pro', color: 'bg-orange-500' };
    if (streakData.currentStreak >= 3) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Beginner', color: 'bg-slate-500' };
  };

  const badge = getStreakBadge();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Flame className={`w-5 h-5 ${getStreakColor()}`} />
            Mood Streak
          </h3>
          <Badge className={`${badge.color} text-white`}>
            {badge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className={`text-2xl font-bold ${getStreakColor()}`}>
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Current Streak
            </div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {streakData.longestStreak}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Best Streak
            </div>
          </div>
        </div>

        {streakData.lastLoggedDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <Calendar className="w-4 h-4" />
            Last logged: {format(new Date(streakData.lastLoggedDate), 'MMM d, yyyy')}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Progress to next level</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {streakData.currentStreak >= 30 ? 'Max Level!' : 
               `${streakData.currentStreak}/${getNextTarget(streakData.currentStreak)}`}
            </span>
          </div>
          
          {streakData.currentStreak < 30 && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  streakData.currentStreak >= 7 ? 'bg-red-500' :
                  streakData.currentStreak >= 3 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ 
                  width: `${(streakData.currentStreak / getNextTarget(streakData.currentStreak)) * 100}%` 
                }}
              ></div>
            </div>
          )}
        </div>

        {streakData.currentStreak === 0 && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
              <Target className="w-4 h-4" />
              Start your streak by logging your mood today!
            </div>
          </div>
        )}

        {streakData.currentStreak >= 7 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
              <TrendingUp className="w-4 h-4" />
              You're on fire! Keep up the amazing consistency!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getNextTarget(currentStreak: number): number {
  if (currentStreak < 3) return 3;
  if (currentStreak < 7) return 7;
  if (currentStreak < 14) return 14;
  if (currentStreak < 30) return 30;
  return 30; // Max level
}