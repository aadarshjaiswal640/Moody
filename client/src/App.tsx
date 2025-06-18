import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import MoodLogger from "@/pages/mood-logger";
import BreathingTool from "@/pages/breathing-tool";
import Insights from "@/pages/insights";
import { useState, useEffect, createContext, useContext } from "react";
import { Heart, Settings, FolderSync } from "lucide-react";
import SettingsModal from "@/components/settings-modal";
import { initializeNotifications } from "@/lib/notifications";

// Theme context
const ThemeContext = createContext<{
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}>({
  darkMode: false,
  setDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function Navigation({ currentTab, setCurrentTab }: { currentTab: string; setCurrentTab: (tab: string) => void }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'logger', label: 'Log Mood', icon: '➕' },
    { id: 'breathing', label: 'Breathe', icon: '🫁' },
    { id: 'insights', label: 'Insights', icon: '🧠' }
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Header({ onSettingsClick, onSyncClick }: { onSettingsClick: () => void; onSyncClick: () => void }) {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">MoodSync</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Emotion & Health Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onSyncClick}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <FolderSync size={18} />
            </button>
            <button 
              onClick={onSettingsClick}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  });

  const toggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    localStorage.setItem('darkMode', JSON.stringify(value));
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Apply dark mode class to document on initial load
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Check for PWA install prompt
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install banner
      const banner = document.createElement('div');
      banner.className = 'fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white p-4';
      banner.innerHTML = `
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span>📱</span>
            <span class="text-sm font-medium">Install MoodSync for a better experience</span>
          </div>
          <div class="flex gap-2">
            <button id="install-btn" class="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">Install</button>
            <button id="dismiss-btn" class="text-white hover:text-gray-200">✕</button>
          </div>
        </div>
      `;
      
      document.body.prepend(banner);
      
      const installBtn = banner.querySelector('#install-btn');
      const dismissBtn = banner.querySelector('#dismiss-btn');
      
      installBtn?.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
          banner.remove();
        }
      });
      
      dismissBtn?.addEventListener('click', () => {
        banner.remove();
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleSync = async () => {
    // Trigger data sync (placeholder for Google Fit sync)
    console.log('Syncing data...');
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'logger':
        return <MoodLogger />;
      case 'breathing':
        return <BreathingTool />;
      case 'insights':
        return <Insights />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeContext.Provider value={{ darkMode, setDarkMode: toggleDarkMode }}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <Header 
              onSettingsClick={() => setShowSettings(true)}
              onSyncClick={handleSync}
            />
            <Navigation 
              currentTab={currentTab} 
              setCurrentTab={setCurrentTab} 
            />
            <main className="max-w-4xl mx-auto px-4 py-6">
              {renderCurrentTab()}
            </main>
            
            <SettingsModal 
              isOpen={showSettings} 
              onClose={() => setShowSettings(false)} 
            />
            
            <Toaster />
          </div>
        </ThemeContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
