import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
import { UIProvider } from '../context/UIContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Layouts
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Auth pages
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import TermsPage from '../features/legal/pages/TermsPage';

// Onboarding & Profile pages
import ProfileSetupPage from '../features/onboarding/pages/ProfileSetupPage';
import ProfilePage from '../features/profile/pages/ProfilePage';

// App features pages
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import MyResumesPage from '../features/resume/pages/MyResumesPage';
import ResumeStudioPage from '../features/resume/pages/ResumeStudioPage';
import TemplateGalleryPage from '../features/templates/pages/TemplateGalleryPage';
import ATSCheckerPage from '../features/ats/pages/ATSCheckerPage';
import AITailoringPage from '../features/ai-tailoring/pages/AITailoringPage';
import ApplicationsPage from '../features/applications/pages/ApplicationsPage';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UIProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile-setup" element={<ProfileSetupPage />} />
              <Route path="/onboarding" element={<ProfileSetupPage />} />

              {/* Main Authenticated Dashboard App Layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-resumes" element={<MyResumesPage />} />
                <Route path="/resume-builder" element={<TemplateGalleryPage />} />
                <Route path="/templates" element={<TemplateGalleryPage />} />
                <Route path="/ats-checker" element={<ATSCheckerPage />} />
                <Route path="/ai-tailor" element={<AITailoringPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
              </Route>

              {/* Resume Studio — standalone */}
              <Route path="/resume-studio/:resumeId" element={<ResumeStudioPage />} />
            </Route>

            {/* Default Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </UIProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;