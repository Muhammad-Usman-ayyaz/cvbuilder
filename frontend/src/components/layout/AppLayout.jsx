import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import SettingsModal from '../../features/settings/components/SettingsModal';
import CreateResumeModal from '../../features/resume/components/CreateResumeModal';
import PageTransition from '../common/PageTransition';
import { useUI } from '../../context/UIContext';
import { useResumes } from '../../features/resume/hooks/useResumes';

export default function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isCreateResumeOpen, closeCreateResume } = useUI();
  const { createResume } = useResumes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (params) => {
    setIsSubmitting(true);
    try {
      const resume = await createResume(params);
      closeCreateResume();
      navigate(`/resume-studio/${resume.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] flex overflow-hidden">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNavbar onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[var(--color-bg-main)]">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <SettingsModal />
      <CreateResumeModal
        isOpen={isCreateResumeOpen}
        onClose={closeCreateResume}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}