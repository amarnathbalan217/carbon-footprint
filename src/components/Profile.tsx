import React, { useEffect, useState } from 'react';
import { User, Settings, Bell, Shield, Loader2, Sparkles, Key, Eye, EyeOff, Lock, Smartphone, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../lib/translations';

export const Profile: React.FC = () => {
  const { isAdmin } = useAuth();
  const { language, setLanguage, t: globalT } = useLanguage();
  const t = globalT.profile;
  const commonT = globalT.common;

  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    householdSize: '1',
    primaryVehicle: 'gas',
    homeType: 'apartment'
  });

  const [notifications, setNotifications] = useState({
    weeklyReport: true,
    goalReminders: true,
    tipsAndInsights: false,
    achievements: true
  });

  const [displayPrefs, setDisplayPrefs] = useState({
    showWeeklySummary: true,
    showComparison: true,
    darkMode: localStorage.getItem('theme') === 'dark'
  });

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await api.auth.getProfile();
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            location: user.location || '',
            householdSize: user.household_size || '1',
            primaryVehicle: user.primary_vehicle || 'gas',
            homeType: user.home_type || 'apartment'
          });
        }
      } catch (err) {
        console.error(err);
        if (!isAdmin) {
            setMessage({ type: 'error', text: commonT.error });
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isAdmin) {
      loadProfile();
    } else {
      setFormData({
        name: 'Administrator',
        email: 'admin@carbontracker.com',
        location: 'Global',
        householdSize: 'N/A',
        primaryVehicle: 'N/A',
        homeType: 'N/A'
      });
      setLoading(false);
    }
  }, [isAdmin, language]);

  useEffect(() => {
    if (displayPrefs.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [displayPrefs.darkMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleNotificationChange = (field: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleDisplayPrefChange = (field: keyof typeof displayPrefs, value: boolean) => {
    setDisplayPrefs(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    if (activeSection === 'ai') {
        handleSaveAiSettings();
        return;
    }

    if (activeSection === 'privacy') {
        handleUpdatePassword();
        return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (!isAdmin) {
          await api.auth.updateProfile({
            name: formData.name,
            location: formData.location,
            household_size: formData.householdSize,
            primary_vehicle: formData.primaryVehicle,
            home_type: formData.homeType
          });
      }
      setMessage({ type: 'success', text: commonT.success });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: commonT.error });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
        setMessage({ type: 'error', text: t.passFields });
        return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
        setMessage({ type: 'error', text: t.passMatch });
        return;
    }
    if (passwords.newPassword.length < 6) {
        setMessage({ type: 'error', text: t.passLong });
        return;
    }

    setSaving(true);
    try {
        await api.auth.updatePassword(passwords.newPassword);
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setPasswords({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage(null), 3000);
    } catch (err) {
        setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
        setSaving(false);
    }
  };

  const handleSaveAiSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setMessage({ type: 'success', text: t.updateApiKey });
    setTimeout(() => setMessage(null), 3000);
  };

  const menuItems = [
    { id: 'profile', label: t.sections.profile, icon: User },
    { id: 'preferences', label: t.sections.preferences, icon: Settings },
    { id: 'notifications', label: t.sections.notifications, icon: Bell },
    { id: 'privacy', label: t.sections.privacy, icon: Shield },
    { id: 'ai', label: t.sections.ai, icon: Sparkles },
  ];


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">{t.info}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.fullName}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  disabled={isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.location}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="e.g. San Francisco, CA"
                  disabled={isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.householdSize}</label>
                <select
                  value={formData.householdSize}
                  onChange={(e) => handleInputChange('householdSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  disabled={isAdmin}
                >
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5+">5+ people</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">{t.trackerPrefs}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.primaryVehicle}</label>
                <select
                  value={formData.primaryVehicle}
                  onChange={(e) => handleInputChange('primaryVehicle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isAdmin}
                >
                  <option value="gas">Gas Car</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="none">No Car (Public Transport/Walking)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.homeType}</label>
                <select
                  value={formData.homeType}
                  onChange={(e) => handleInputChange('homeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isAdmin}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.lang}</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  >
                    <option value="en">English</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                  </select>
                  <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-emerald-600" />
                    {t.displayPrefs}
                </h4>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-700" 
                        checked={displayPrefs.showWeeklySummary}
                        onChange={(e) => handleDisplayPrefChange('showWeeklySummary', e.target.checked)}
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t.weeklySummary}</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-700" 
                        checked={displayPrefs.darkMode}
                        onChange={(e) => handleDisplayPrefChange('darkMode', e.target.checked)}
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t.darkMode}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">{t.notifSettings}</h3>
            <div className="space-y-3">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Receive alerts related to your {key.toLowerCase()}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleNotificationChange(key as keyof typeof notifications, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">{t.privacy}</h3>
            
            <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl flex items-start gap-4 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <Lock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t.updatePassword}</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Ensure your account stays secure by using a strong password.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.newPassword}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwords.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                                placeholder={t.passPlaceholder}
                            />
                            <Key className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.confirmPassword}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwords.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                                placeholder={t.passRepeat}
                            />
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">{t.aiConfig}</h3>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                {t.aiGlobal}
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.apiKey}</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="Enter key (AIzaSy...)"
                  />
                  <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Get yours at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">Google AI Studio</a>.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-4 text-gray-500">Section not found</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 dark:text-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{globalT.profile.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{globalT.profile.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 space-x-2 lg:space-x-0 lg:space-y-2 no-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMessage(null);
                  }}
                  className={`flex-shrink-0 flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-200 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-gray-800' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-gray-800'
                    }`}>
                        {message.type === 'success' ? <Sparkles className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <div className="min-h-[400px]">
                    {renderContent()}
                </div>

                <div className="mt-10 flex justify-end items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        className="px-6 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium"
                        onClick={() => {
                            setActiveSection('profile');
                            setMessage(null);
                        }}
                    >
                        {commonT.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none disabled:opacity-50 flex items-center text-sm font-semibold"
                    >
                        {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        {activeSection === 'ai' ? t.updateApiKey : commonT.save}
                        {activeSection === 'privacy' ? t.updatePassword : ''}
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
