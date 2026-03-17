import React, { useEffect, useState } from 'react';
import { Car, Home, UtensilsCrossed, Loader2 } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { EmissionsChart } from './EmissionsChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentActivity } from './RecentActivity';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t: globalT } = useLanguage();
  const t = globalT.dashboard;
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<'day' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.activities.list();
        setActivities(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Use only manual activities
  const allActivities = [...activities].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Time-wise aggregation logic
  const getAggregatedData = () => {
    const now = new Date();
    if (timeView === 'day') {
      const results = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
        const value = allActivities
          .filter(a => {
            const ad = new Date(a.date);
            return ad.toDateString() === d.toDateString();
          })
          .reduce((sum, a) => sum + (a.emissions || 0), 0);
        results.push({ label, value });
      }
      return { data: results, target: 0.08 }; // ~2.5 / 30
    } else if (timeView === 'month') {
      const results = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleString(undefined, { month: 'short' });
        const value = allActivities
          .filter(a => {
            const ad = new Date(a.date);
            return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
          })
          .reduce((sum, a) => sum + (a.emissions || 0), 0);
        results.push({ label, value });
      }
      return { data: results, target: 2.5 };
    } else {
      const results = [];
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const label = year.toString();
        const value = allActivities
          .filter(a => new Date(a.date).getFullYear() === year)
          .reduce((sum, a) => sum + (a.emissions || 0), 0);
        results.push({ label, value });
      }
      return { data: results, target: 30 }; // ~2.5 * 12
    }
  };

  const { data: chartData, target: chartTarget } = getAggregatedData();

  // Calculate current stats
  const now = new Date();
  const currentMonthEmissions = allActivities
    .filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, a) => sum + (a.emissions || 0), 0);

  const previousMonthEmissions = 3.8;
  const percentageChange = ((currentMonthEmissions - previousMonthEmissions) / previousMonthEmissions) * 100;

  // Category breakdown
  const calculateCategoryTotal = (cat: string) => {
    return allActivities
      .filter(a => a.category === cat)
      .reduce((sum, a) => sum + (a.emissions || 0), 0);
  };

  const totalEmissions = allActivities.reduce((sum, a) => sum + (a.emissions || 0), 0);

  const categories = [
    { name: 'Transport', value: calculateCategoryTotal('transport'), icon: Car, color: 'bg-blue-500', percentage: 0 },
    { name: 'Energy', value: calculateCategoryTotal('energy'), icon: Home, color: 'bg-red-500', percentage: 0 },
    { name: 'Food', value: calculateCategoryTotal('food'), icon: UtensilsCrossed, color: 'bg-green-500', percentage: 0 },
  ];

  categories.forEach(cat => {
    cat.percentage = totalEmissions > 0 ? Math.round((cat.value / totalEmissions) * 100) : 0;
  });

  const handleClearActivities = async () => {
    if (!window.confirm('Are you sure you want to clear your activity history? This cannot be undone.')) {
      return;
    }

    try {
      await api.activities.clear();
      setActivities([]);
    } catch (err: any) {
      console.error('Failed to clear activities:', err);
      alert(`Failed to clear history: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="dark:text-white">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['day', 'month', 'year'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTimeView(view)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${timeView === view
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
              >
                {view.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <StatsCard
          title={timeView === 'day' ? "Today" : timeView === 'month' ? t.title : "This Year"}
          value={`${chartData[chartData.length - 1].value.toFixed(3)} ${t.tons}`}
          change={timeView === 'month' ? percentageChange : 0}
          icon={<div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">💨</div>}
        />
        <StatsCard
          title="Total Lifetime"
          value={`${totalEmissions.toFixed(3)} ${t.tons}`}
          change={0}
          icon={<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">📅</div>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions Over Time</h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded capitalize">
              {timeView} View
            </span>
          </div>
          <EmissionsChart data={chartData} target={chartTarget} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Category Breakdown</h3>
          <CategoryBreakdown categories={categories} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.activities}</h3>
          <button
            onClick={handleClearActivities}
            className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md transition-colors"
          >
            Clear History
          </button>
        </div>
        <RecentActivity activities={allActivities.slice(0, 5)} />
      </div>
    </div>
  );
};