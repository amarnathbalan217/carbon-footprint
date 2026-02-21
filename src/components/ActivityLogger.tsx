import React, { useState, useEffect } from 'react';
import { Car, Home, UtensilsCrossed, Plus, Flame, Loader2, ArrowRightLeft } from 'lucide-react';
import { api } from '../lib/api';

const KM_TO_MILES = 0.621371;

export const ActivityLogger: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('transport');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    distance: '',
    vehicle: 'car',
    energy: '',
    lpg: '',
    meal: 'beef',
    year: new Date().getFullYear().toString(),
    fuelType: 'petrol'
  });
  const [dbFactors, setDbFactors] = useState<any[]>([]);

  useEffect(() => {
    const fetchFactors = async () => {
      try {
        const factors = await api.admin.getFactors();
        setDbFactors(factors);
      } catch (err) {
        console.error('Failed to fetch emission factors', err);
      }
    };
    fetchFactors();
  }, []);

  const categories = [

    { id: 'transport', label: 'Transport', icon: Car, color: 'bg-blue-500' },
    { id: 'energy', label: 'Energy', icon: Home, color: 'bg-red-500' },
    { id: 'lpg', label: 'LPG', icon: Flame, color: 'bg-orange-500' },
    { id: 'food', label: 'Food', icon: UtensilsCrossed, color: 'bg-green-500' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const calculateEmissions = () => {
    if (dbFactors.length === 0) return '0.0000';

    const getFactor = (cat: string, sub: string) => {
      const f = dbFactors.find(x => x.category === cat && x.subcategory === sub);
      return f ? f.factor : 0;
    };

    switch (selectedCategory) {
      case 'transport':
        const distanceKm = parseFloat(formData.distance) || 0;
        let factor = 0;

        if (formData.vehicle === 'car') {
          factor = getFactor('transport', formData.fuelType);
        } else {
          factor = getFactor('transport', formData.vehicle);
        }

        // Granular Year factor
        const year = parseInt(formData.year) || new Date().getFullYear();
        if (year < 2000) factor *= 1.3;
        else if (year < 2005) factor *= 1.2;
        else if (year < 2010) factor *= 1.15;
        else if (year < 2015) factor *= 1.05;
        else if (year < 2020) factor *= 1.0;
        else if (year < 2025) factor *= 0.95;
        else factor *= 0.9;

        return (distanceKm * factor).toFixed(4);
      case 'energy':
        const energy = parseFloat(formData.energy) || 0;
        return (energy * getFactor('energy', 'electricity')).toFixed(4);
      case 'lpg':
        const lpg = parseFloat(formData.lpg) || 0;
        return (lpg * getFactor('lpg', 'lpg')).toFixed(4);
      case 'food':
        const mealFactor = getFactor('food', formData.meal);
        return mealFactor.toFixed(4);
      default:
        return '0';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let value = 0;
      let subcategory = '';

      switch (selectedCategory) {
        case 'transport':
          value = parseFloat(formData.distance) || 0; // value in km
          subcategory = formData.vehicle;
          break;
        case 'energy':
          value = parseFloat(formData.energy) || 0;
          subcategory = 'electricity';
          break;
        case 'lpg':
          value = parseFloat(formData.lpg) || 0;
          subcategory = 'lpg';
          break;
        case 'food':
          value = 1; // 1 meal
          subcategory = formData.meal;
          break;
      }

      const emissions = parseFloat(calculateEmissions());

      if (value <= 0 && selectedCategory !== 'food') {
        throw new Error('Please enter a valid amount');
      }

      await api.activities.create({
        category: selectedCategory,
        subcategory,
        value,
        emissions,
        date: new Date().toISOString()
      });

      setSuccess('Activity logged successfully!');

      // Reset relevant form fields
      setFormData(prev => ({
        ...prev,
        distance: '',
        energy: '',
        lpg: '',
        year: new Date().getFullYear().toString(),
        fuelType: 'petrol'
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedCategory) {
      case 'transport':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <select
                value={formData.vehicle}
                onChange={(e) => handleInputChange('vehicle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="car">Car</option>
                <option value="bus">Public Bus</option>
                <option value="motorbike">Motorbike</option>
              </select>
            </div>
            {formData.vehicle === 'car' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleInputChange('fuelType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
              <input
                type="number"
                value={formData.distance}
                onChange={(e) => handleInputChange('distance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter distance in kilometers"
              />
            </div>
            {parseFloat(formData.distance) > 0 && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Distance & Emission Calculation</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance entered:</span>
                    <span className="font-medium text-gray-900">{parseFloat(formData.distance).toFixed(2)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equivalent in miles:</span>
                    <span className="font-medium text-gray-900">{(parseFloat(formData.distance) * KM_TO_MILES).toFixed(2)} miles</span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.vehicle}{formData.vehicle === 'car' ? ` (${formData.fuelType})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CO₂ Emissions:</span>
                    <span className="font-bold text-emerald-700">{calculateEmissions()} tons</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formula: {parseFloat(formData.distance).toFixed(2)} km × emission factor × year adjustment</p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Year</label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 'energy':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Energy Usage (kWh)</label>
            <input
              type="number"
              value={formData.energy}
              onChange={(e) => handleInputChange('energy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter energy consumption"
            />
          </div>
        );
      case 'lpg':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LPG Usage (kg)</label>
            <input
              type="number"
              value={formData.lpg}
              onChange={(e) => handleInputChange('lpg', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter LPG consumption in kilograms"
            />
          </div>
        );
      case 'food':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
            <select
              value={formData.meal}
              onChange={(e) => handleInputChange('meal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="beef">Beef</option>
              <option value="chicken">Chicken</option>
              <option value="fish">Fish</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Log Your Activity</h2>
        <p className="text-gray-600 mt-2">Track your daily activities to monitor your carbon footprint</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h3>
          <div className="space-y-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedCategory === category.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-2 ${category.color} rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Log {categories.find(c => c.id === selectedCategory)?.label} Activity
            </h3>

            {renderForm()}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Estimated CO₂ Emissions:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {calculateEmissions()} tons
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Log Activity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};