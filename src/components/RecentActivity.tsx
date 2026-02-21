import React from 'react';
import { Car, Home, UtensilsCrossed, Trash2 } from 'lucide-react';

interface RecentActivityProps {
  activities: any[];
}

const getIcon = (type: string) => {
  switch (type) {
    case 'transport': return Car;
    case 'energy': return Home;
    case 'food': return UtensilsCrossed;
    case 'waste': return Trash2;
    default: return Car;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'transport': return 'text-blue-600 bg-blue-100';
    case 'energy': return 'text-red-600 bg-red-100';
    case 'food': return 'text-green-600 bg-green-100';
    case 'waste': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getIcon(activity.category || activity.transport_mode);
        const colorClass = getColor(activity.category || 'transport');
        const [textColor, bgColor] = colorClass.split(' ');

        return (
          <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-4">
              <div className={`p-2 ${bgColor} rounded-lg`}>
                <Icon className={`h-5 w-5 ${textColor}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{activity.description || `${activity.transport_mode} trip`}</p>
                <p className="text-sm text-gray-600">{new Date(activity.date || activity.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">+{activity.emissions} tons</p>
              <p className="text-sm text-gray-600">CO₂</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};