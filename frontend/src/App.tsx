import React, { useEffect } from 'react';
import { useNitroStore } from './stores/useNitroStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { MonitorPage } from './pages/MonitorPage';
import { FanControlPage } from './pages/FanControlPage';
import { PerformancePage } from './pages/PerformancePage';
import { FanCurvesPage } from './pages/FanCurvesPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { HardwareInfoPage } from './pages/HardwareInfoPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  const { activeTab, fetchInitialData, initWebSocket } = useNitroStore();

  useEffect(() => {
    fetchInitialData();
    initWebSocket();
  }, [fetchInitialData, initWebSocket]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'monitor':
        return <MonitorPage />;
      case 'fans':
        return <FanControlPage />;
      case 'performance':
        return <PerformancePage />;
      case 'curves':
        return <FanCurvesPage />;
      case 'profiles':
        return <ProfilesPage />;
      case 'hardware':
        return <HardwareInfoPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-nitro-bg text-nitro-text overflow-hidden select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 min-h-0 bg-nitro-bg/95">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
export default App;
