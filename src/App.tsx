import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { AdminLogin } from './components/AdminLogin';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActivityLogger } from './components/ActivityLogger';
import { Goals } from './components/Goals';
import { Insights } from './components/Insights';
import { Profile } from './components/Profile';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginRole, setLoginRole] = useState<'user' | 'admin'>('user');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return loginRole === 'admin' ? (
      <AdminLogin onSwitchToUser={() => setLoginRole('user')} />
    ) : (
      <Auth onSwitchToAdmin={() => setLoginRole('admin')} />
    );
  }

  const renderContent = () => {
    if (isAdmin) {
      return <AdminDashboard />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'logger':
        return <ActivityLogger />;
      case 'goals':
        return <Goals />;
      case 'insights':
        return <Insights />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
