import React, { useState, useEffect } from 'react';
import { Target, Calendar, TrendingDown, Loader2, Plus } from 'lucide-react';
import { api } from '../lib/api';

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
      // Calculate progress for each goal
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
        current: 0 // Initialize with 0 progress
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
        <h2 className="text-3xl font-bold text-gray-900">Carbon Reduction Goals</h2>
        <p className="text-gray-600 mt-2">Set targets and track your progress toward a greener lifestyle</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
              <button
                onClick={handleClearGoals}
                className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
              >
                Clear Goals
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active goals. Set a new goal to get started!
              </div>
            ) : (
              <div className="space-y-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{goal.title || `${goal.category} reduction`}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(goal.progress || 0) >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : (goal.progress || 0) >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {goal.progress || 0}% Complete
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Current: {goal.current} tons CO₂</span>
                      <span>Target: {goal.target} tons CO₂</span>
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Set New Goal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Reduce Car Emissions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="total">Total Emissions</option>
                  <option value="transport">Transport</option>
                  <option value="energy">Energy</option>
                  <option value="food">Food</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target (tons CO₂)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <button
              onClick={handleCreateGoal}
              disabled={saving}
              className="w-full mt-6 bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span>Create Goal</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Monthly Reduction</span>
                </div>
                <span className="font-bold text-emerald-600">--%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Days Logged</span>
                </div>
                <span className="font-bold text-blue-600">--</span>
              </div>


            </div>
          </div>


        </div>
      </div>
    </div>
  );
};