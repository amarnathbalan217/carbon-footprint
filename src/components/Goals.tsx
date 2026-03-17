import React, { useState, useEffect } from 'react';
import { Target, Calendar, TrendingDown, Loader2, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Goal {
  id: number;
  title: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  progress?: number;
}

export const Goals: React.FC = () => {
  const { t: globalT } = useLanguage();
  const t = globalT.goals;
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    deadline: '',
    category: 'total'
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await api.goals.list();
      const goalsWithProgress = data.map((goal: any) => ({
        ...goal,
        progress: Math.min(100, Math.round((goal.current / goal.target) * 100))
      }));
      setGoals(goalsWithProgress);
    } catch (err) {
      console.error(err);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.target || !newGoal.deadline) {
      setError('Please fill in all fields');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.goals.create({
        ...newGoal,
        target: parseFloat(newGoal.target),
        current: 0
      });
      setNewGoal({ title: '', target: '', deadline: '', category: 'total' });
      fetchGoals();
    } catch (err) {
      setError('Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleClearGoals = async () => {
    if (!window.confirm('Are you sure you want to clear all your goals? This cannot be undone.')) {
      return;
    }

    try {
      await api.goals.clear();
      setGoals([]);
    } catch (err: any) {
      console.error('Failed to clear goals:', err);
      alert(`Failed to clear goals: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.activeGoals}</h3>
              <button
                onClick={handleClearGoals}
                className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md transition-colors"
              >
                {t.clearBtn}
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t.noGoals}
              </div>
            ) : (
              <div className="space-y-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.title || `${goal.category} reduction`}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(goal.progress || 0) >= 75
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                        : (goal.progress || 0) >= 50
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                        {(goal.progress || 0)}% {t.complete}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>{t.current}: {goal.current} tons CO₂</span>
                      <span>{t.target}: {goal.target} tons CO₂</span>
                      <span>{t.due}: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${(goal.progress || 0) >= 75
                          ? 'bg-emerald-500'
                          : (goal.progress || 0) >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          }`}
                        style={{ width: `${goal.progress || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t.setNew}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.goalTitle}</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Reduce Car Emissions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.category}</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="total">{globalT.activity.title}</option>
                  <option value="transport">{globalT.activity.transport}</option>
                  <option value="energy">{globalT.activity.energy}</option>
                  <option value="food">{globalT.activity.food}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.target}</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.deadline}</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}

            <button
              onClick={handleCreateGoal}
              disabled={saving}
              className="w-full mt-6 bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span>{t.createBtn}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">Monthly Reduction</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">--%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">Days Logged</span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};