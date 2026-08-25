import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import SettingsModal from '../../features/settings/components/SettingsModal';

export default function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] flex overflow-hidden">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNavbar onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[var(--color-bg-main)]">
          <Outlet />
        </main>
      </div>

      <SettingsModal />
    </div>
  );
}