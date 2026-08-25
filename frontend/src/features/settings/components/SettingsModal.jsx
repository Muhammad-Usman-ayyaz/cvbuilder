import { useState, useEffect } from 'react';
import { useUI } from '../../../context/UIContext';
import { useAuth } from '../../auth/context/AuthContext';

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings, activeSettingsTab, setActiveSettingsTab } = useUI();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    apiKey: '',
  });

  // Keep modal form state in sync when user object or modal visibility changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
      }));
    }
  }, [user, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();

    // 1. Update global AuthContext (instantly syncs Sidebar, TopNavbar, & Dashboard)
    if (updateUser) {
      updateUser({
        fullName: formData.fullName,
      });
    }

    // 2. Close modal
    closeSettings();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-card)] rounded-2xl w-full max-w-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">

        {/* Navigation Tabs */}
        <div className="w-full md:w-48 bg-[var(--color-bg-main)] p-4 border-b md:border-b-0 md:border-r border-[var(--color-border)] flex md:flex-col gap-1">
          <button
            onClick={() => setActiveSettingsTab('account')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeSettingsTab === 'account'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Account
          </button>

          {/* <button
            onClick={() => setActiveSettingsTab('ai')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeSettingsTab === 'ai'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)]'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            AI Settings
          </button> */}
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] capitalize">
                {activeSettingsTab} Settings
              </h3>
              <button
                onClick={closeSettings}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="settings-form" onSubmit={handleSave} className="space-y-4 text-sm">
              {activeSettingsTab === 'account' && (
                <>
                  <div>
                    <label className="block font-medium mb-1 text-[var(--color-text-primary)]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-[var(--color-text-primary)]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-main)] text-[var(--color-text-secondary)] cursor-not-allowed"
                    />
                  </div>
                </>
              )}

              {activeSettingsTab === 'ai' && (
                <div>
                  <label className="block font-medium mb-1 text-[var(--color-text-primary)]">
                    Custom OpenAI API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Leave empty to use default system keys.
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={closeSettings}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settings-form"
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}