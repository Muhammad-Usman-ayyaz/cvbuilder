import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../../context/UIContext';
import { useAuth } from '../../auth/context/AuthContext';
import { fadeScale, fadeOnly } from '../../../lib/motion';

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings, activeSettingsTab, setActiveSettingsTab } = useUI();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
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
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          variants={fadeOnly}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            variants={fadeScale}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-card rounded-2xl w-full max-w-2xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
          >

        {/* Navigation Tabs */}
        <div className="w-full md:w-48 bg-bg-main p-4 border-b md:border-b-0 md:border-r border-border flex md:flex-col gap-1">
          <button
            onClick={() => setActiveSettingsTab('account')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeSettingsTab === 'account'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-card'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Account
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary capitalize">
                {activeSettingsTab} Settings
              </h3>
              <button
                onClick={closeSettings}
                className="text-text-secondary hover:text-text-primary p-1 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="settings-form" onSubmit={handleSave} className="space-y-4 text-sm">
              {activeSettingsTab === 'account' && (
                <>
                  <div>
                    <label className="block font-medium mb-1 text-text-primary">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-text-primary">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-bg-main text-text-secondary cursor-not-allowed"
                    />
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={closeSettings}
              className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-bg-main text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settings-form"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}