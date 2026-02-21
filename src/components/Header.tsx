import React from 'react';
import { Leaf, BarChart3, Plus, Target, Lightbulb, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const { signOut } = useAuth();
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'logger', label: 'Log Activity', icon: Plus },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isAdmin ? 'Admin Portal' : 'Carbon Tracker'}
              </h1>
              <p className="text-sm text-gray-600">
                {isAdmin ? 'System Management' : 'Monitor & Reduce Your Footprint'}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 items-center">
            {!isAdmin && tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={signOut}
              className="inline-flex items-center ml-2 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 transition-all duration-200 border border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
