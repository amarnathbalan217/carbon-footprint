import React from 'react';
import { Leaf, BarChart3, Plus, Target, Lightbulb, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: t.nav.dashboard, icon: BarChart3 },
    { id: 'logger', label: t.nav.activity, icon: Plus },
    { id: 'goals', label: t.nav.goals, icon: Target },
    { id: 'insights', label: t.nav.insights, icon: Lightbulb },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  const adminTabs = [
    { id: 'dashboard', label: t.nav.dashboard, icon: BarChart3 },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  const mobileTabs = isAdmin ? adminTabs : tabs;

  return (
    <>
      {/* Top Header Bar */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Leaf className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isAdmin ? t.nav.admin : 'Carbon Tracker'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {isAdmin ? 'System Management' : 'Monitor & Reduce Your Footprint'}
                </p>
              </div>
            </div>

            {/* Mobile: Logout button in top bar */}
            <div className="flex md:hidden">
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 transition-all duration-200 border border-red-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1 items-center">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t.nav.dashboard}
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'profile'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t.nav.profile}
                  </button>
                </>
              ) : (
                tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })
              )}
              <button
                onClick={signOut}
                className="inline-flex items-center ml-2 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 transition-all duration-200 border border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.nav.logout}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className={`p-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium leading-tight ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
