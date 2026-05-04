import React, { useState, useEffect } from 'react';
import { Car, Home, UtensilsCrossed, Plus, Flame, Loader2, ArrowRightLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const KM_TO_MILES = 0.621371;

const FOOD_GROUPS: { label: string; items: { value: string; label: string; emoji: string }[] }[] = [
  {
    label: '🥩 Meat & Seafood',
    items: [
      { value: 'beef', label: 'Beef', emoji: '🥩' },
      { value: 'lamb', label: 'Lamb', emoji: '🐑' },
      { value: 'pork', label: 'Pork', emoji: '🥓' },
      { value: 'chicken', label: 'Chicken', emoji: '🍗' },
      { value: 'fish', label: 'Fish', emoji: '🐟' },
      { value: 'shrimp', label: 'Shrimp', emoji: '🦐' },
    ],
  },
  {
    label: '🧀 Dairy & Eggs',
    items: [
      { value: 'eggs', label: 'Eggs', emoji: '🥚' },
      { value: 'cheese', label: 'Cheese', emoji: '🧀' },
      { value: 'milk', label: 'Milk', emoji: '🥛' },
      { value: 'butter', label: 'Butter', emoji: '🧈' },
      { value: 'yogurt', label: 'Yogurt', emoji: '🥛' },
    ],
  },
  {
    label: '🌾 Grains & Staples',
    items: [
      { value: 'rice', label: 'Rice', emoji: '🍚' },
      { value: 'bread', label: 'Bread', emoji: '🍞' },
      { value: 'pasta', label: 'Pasta', emoji: '🍝' },
    ],
  },
  {
    label: '🥬 Plant-Based',
    items: [
      { value: 'lentils', label: 'Lentils / Beans', emoji: '🫘' },
      { value: 'tofu', label: 'Tofu / Soy', emoji: '🧊' },
      { value: 'nuts', label: 'Nuts', emoji: '🥜' },
      { value: 'fruits', label: 'Fruits', emoji: '🍎' },
      { value: 'vegetables', label: 'Vegetables', emoji: '🥬' },
    ],
  },
  {
    label: '☕ Beverages',
    items: [
      { value: 'coffee', label: 'Coffee', emoji: '☕' },
      { value: 'tea', label: 'Tea', emoji: '🍵' },
      { value: 'juice', label: 'Juice', emoji: '🧃' },
    ],
  },
  {
    label: '🍕 Prepared / Snacks',
    items: [
      { value: 'pizza', label: 'Pizza', emoji: '🍕' },
      { value: 'burger', label: 'Burger', emoji: '🍔' },
      { value: 'ice_cream', label: 'Ice Cream', emoji: '🍦' },
      { value: 'chocolate', label: 'Chocolate', emoji: '🍫' },
    ],
  },
];

export const ActivityLogger: React.FC = () => {
  const { t: globalT } = useLanguage();
  const t = globalT.activity;
  
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
    foodQuantity: '0.5',
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
    { id: 'transport', label: t.transport, icon: Car, color: 'bg-blue-500' },
    { id: 'energy', label: t.energy, icon: Home, color: 'bg-red-500' },
    { id: 'lpg', label: t.lpg, icon: Flame, color: 'bg-orange-500' },
    { id: 'food', label: t.food, icon: UtensilsCrossed, color: 'bg-green-500' },
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
        const quantity = parseFloat(formData.foodQuantity) || 0;
        const mealFactor = getFactor('food', formData.meal);
        return (quantity * mealFactor).toFixed(4);
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
          value = parseFloat(formData.distance) || 0;
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
          value = parseFloat(formData.foodQuantity) || 0;
          subcategory = formData.meal;
          break;
      }

      const emissions = parseFloat(calculateEmissions());

      if (value <= 0) {
        throw new Error('Please enter a valid amount');
      }

      await api.activities.create({
        category: selectedCategory,
        subcategory,
        value,
        emissions,
        date: new Date().toISOString()
      });

      setSuccess(t.success);

      setFormData(prev => ({
        ...prev,
        distance: '',
        energy: '',
        lpg: '',
        foodQuantity: '0.5',
        year: new Date().getFullYear().toString(),
        fuelType: 'petrol'
      }));

    } catch (err: any) {
      setError(err.message || t.error);
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.vehicleType}</label>
              <select
                value={formData.vehicle}
                onChange={(e) => handleInputChange('vehicle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="car">Car</option>
                <option value="bus">Public Bus</option>
                <option value="motorbike">Motorbike</option>
              </select>
            </div>
            {formData.vehicle === 'car' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.fuelType}</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleInputChange('fuelType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.distance}</label>
              <input
                type="number"
                value={formData.distance}
                onChange={(e) => handleInputChange('distance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter distance in kilometers"
              />
            </div>
            {parseFloat(formData.distance) > 0 && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Distance & Emission Calculation</span>
                </div>
                <div className="space-y-2 text-sm dark:text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Distance entered:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{parseFloat(formData.distance).toFixed(2)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Equivalent in miles:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{(parseFloat(formData.distance) * KM_TO_MILES).toFixed(2)} miles</span>
                  </div>
                  <hr className="border-blue-200 dark:border-blue-800" />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{formData.vehicle}{formData.vehicle === 'car' ? ` (${formData.fuelType})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">CO₂ Emissions:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{calculateEmissions()} tons</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.vehicleYear}</label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.energyUsage}</label>
            <input
              type="number"
              value={formData.energy}
              onChange={(e) => handleInputChange('energy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter energy consumption"
            />
          </div>
        );
      case 'lpg':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.lpgUsage}</label>
            <input
              type="number"
              value={formData.lpg}
              onChange={(e) => handleInputChange('lpg', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter LPG consumption in kilograms"
            />
          </div>
        );
      case 'food':
        const isDrink = ['coffee', 'tea', 'juice', 'milk'].includes(formData.meal);
        const unit = isDrink ? 'liters' : 'kilograms';
        const unitShort = isDrink ? 'L' : 'kg';

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Food Item
              </label>
              <select
                value={formData.meal}
                onChange={(e) => handleInputChange('meal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FOOD_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.emoji} {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity ({unitShort})
              </label>
              <input
                type="number"
                value={formData.foodQuantity}
                onChange={(e) => handleInputChange('foodQuantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={`Enter quantity in ${unit}`}
                min="0.01"
                step="0.1"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[0.1, 0.25, 0.5, 1, 2, 5].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleInputChange('foodQuantity', qty.toString())}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
                      parseFloat(formData.foodQuantity) === qty
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    {qty} {unitShort}
                  </button>
                ))}
              </div>
            </div>

            {parseFloat(formData.foodQuantity) > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <UtensilsCrossed className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">Food Emission Breakdown</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Food Item:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {formData.meal.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {parseFloat(formData.foodQuantity).toFixed(2)} {unitShort}
                    </span>
                  </div>
                  <hr className="border-green-200 dark:border-green-800" />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">CO₂ Emissions:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {calculateEmissions()} tons
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.selectCat}</h3>
          <div className="space-y-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${selectedCategory === category.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <div className={`p-2 ${category.color} rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium dark:text-gray-200">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Log {categories.find(c => c.id === selectedCategory)?.label}
            </h3>

            {renderForm()}

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.estimated}:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {calculateEmissions()} tons
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm border border-green-100 dark:border-green-800">
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
                  <span>{t.logBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};