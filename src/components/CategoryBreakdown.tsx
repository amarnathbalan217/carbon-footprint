import React from 'react';

interface Category {
  name: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  percentage: number;
}

interface CategoryBreakdownProps {
  categories: Category[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <div key={category.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${category.color} rounded-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{category.name}</p>
                <p className="text-sm text-gray-600">{category.value} tons CO₂</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${category.color} rounded-full transition-all duration-500`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-10 text-right">
                {category.percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};