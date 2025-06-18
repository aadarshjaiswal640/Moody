import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function HealthStats() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['/api/health-data/today'],
  });

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Steps</p>
              <p className="text-2xl font-bold text-slate-900">
                {healthData?.stepCount?.toLocaleString() || '--'}
              </p>
              <p className="text-xs text-green-600">Today</p>
            </div>
            <div className="text-green-500 text-2xl">👟</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
