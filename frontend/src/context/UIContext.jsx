import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UIContext = createContext();

export function UIProvider({ children }) {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  const [isCreateResumeOpen, setIsCreateResumeOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const openSettings = (tab = 'account') => {
    setActiveSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => setIsSettingsOpen(false);
  const toggleNotifications = () => setIsNotificationsOpen((prev) => !prev);
  const closeNotifications = () => setIsNotificationsOpen(false);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const openCreateResume = () => navigate('/templates');
  const closeCreateResume = () => setIsCreateResumeOpen(false);

  return (
    <UIContext.Provider
      value={{
        isSettingsOpen,
        openSettings,
        closeSettings,
        activeSettingsTab,
        setActiveSettingsTab,
        isNotificationsOpen,
        toggleNotifications,
        closeNotifications,
        theme,
        toggleTheme,
        isCreateResumeOpen,
        openCreateResume,
        closeCreateResume,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => useContext(UIContext);