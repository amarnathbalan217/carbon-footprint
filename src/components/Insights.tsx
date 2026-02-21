import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: string;
  difficulty: string;
  category: string;
  color: string;
  bg: string;
}

interface Trend {
  period: string;
  change: number;
  description: string;
}

interface InsightsData {
  recommendations: Recommendation[];
  trends: Trend[];
  comparisons: {
    national: { value: number; comparison: string };
    global: { value: number; comparison: string };
    city: { value: number; comparison: string };
  };
  impact: {
    totalSaved: number;
    trees: number;
    km: number;
    meatlessDays: number;
  };
}

export const Insights: React.FC = () => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await api.insights.get();
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'No data available'}
      </div>
    );
  }

  const { recommendations, trends, impact } = data;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Personalized Insights</h2>
        <p className="text-gray-600 mt-2">Data-driven recommendations to reduce your carbon footprint</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              Admin Suggestions
            </h3>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`px-2 py-1 ${rec.bg} rounded-full`}>
                          <span className={`text-xs font-medium ${rec.color}`}>{rec.category}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${rec.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {rec.difficulty}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <p className="text-sm font-medium text-emerald-600">
                        Potential savings: {rec.impact}
                      </p>
                    </div>
                    <button className="ml-4 p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-200">
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
              Trend Analysis
            </h3>

            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium text-gray-900">{trend.period}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${trend.change < 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {trend.change}% {trend.change < 0 ? 'decrease' : 'increase'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{trend.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">


          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Leaf className="h-5 w-5 text-emerald-500 mr-2" />
              Impact Summary
            </h3>

            <div className="space-y-4">
              <div className="text-center p-6 bg-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{impact.totalSaved || 0} tons</div>
                <div className="text-sm text-emerald-700 mb-2">CO₂ saved this year</div>
                <div className="text-xs text-emerald-600">
                  Equivalent to planting {impact.trees} trees! 🌳
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{impact.km}</div>
                  <div className="text-xs text-blue-600">Km by bus</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{impact.meatlessDays}</div>
                  <div className="text-xs text-green-600">Meatless days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};