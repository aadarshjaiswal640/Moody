import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { format, subDays } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MoodChart() {
  const endDate = new Date();
  const startDate = subDays(endDate, 7);

  const { data: moodData, isLoading, error } = useQuery({
    queryKey: ['/api/mood-entries/range', startDate.toDateString(), endDate.toDateString()],
    queryFn: async () => {
      const response = await fetch(`/api/mood-entries/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mood data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading chart...</div>
      </div>
    );
  }

  // Process data for chart
  const processData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(endDate, 6 - i);
      return {
        date,
        label: format(date, 'MMM dd'),
        shortLabel: format(date, 'EEE'),
      };
    });

    const dailyMoods = last7Days.map(day => {
      const dayEntries = (moodData || []).filter((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === day.date.toDateString();
      });

      if (dayEntries.length === 0) return null;
      
      const averageMood = dayEntries.reduce((sum: number, entry: any) => sum + entry.intensity, 0) / dayEntries.length;
      return averageMood;
    });

    return {
      labels: last7Days.map(day => day.shortLabel),
      data: dailyMoods,
    };
  };

  const { labels, data } = processData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Mood Score',
        data,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#4F46E5',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return value !== null ? `Mood: ${value.toFixed(1)}/10` : 'No data';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: '#E2E8F0',
        },
        ticks: {
          color: '#64748B',
          stepSize: 2,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748B',
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#4F46E5',
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
