import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../features/auth/context/AuthContext';
import * as profileApi from '../api/profileApi';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await profileApi.getProfile();
        if (mounted) {
          // Normalize default fields if data exists
          setProfile(data || null);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const calculateCompleteness = (prof) => {
    if (!prof) return 0;
    let score = 0;
    
    // Personal Details (30%)
    if (prof.full_name || prof.fullName) score += 10;
    if (prof.email) score += 5;
    if (prof.phone) score += 5;
    if (prof.city || prof.country || prof.location) score += 5;
    if (prof.professional_title || prof.summary) score += 5;

    // Experience (25%)
    if (Array.isArray(prof.experience) && prof.experience.length > 0) score += 25;

    // Education (20%)
    if (Array.isArray(prof.education) && prof.education.length > 0) score += 20;

    // Skills (15%)
    if (Array.isArray(prof.skills) && prof.skills.length > 0) score += 15;

    // Projects / Links (10%)
    if ((Array.isArray(prof.projects) && prof.projects.length > 0) || prof.linkedin || prof.linkedin_url || prof.github || prof.github_url || prof.portfolio || prof.portfolio_url) score += 10;

    return Math.min(100, score);
  };

  const getMissingItems = (prof) => {
    const missing = [];
    if (!prof?.full_name && !prof?.fullName) missing.push('Full Name & Contact Info (+15%)');
    if (!prof?.professional_title && !prof?.summary) missing.push('Professional Summary (+15%)');
    if (!Array.isArray(prof?.experience) || prof.experience.length === 0) missing.push('Work Experience (+25%)');
    if (!Array.isArray(prof?.education) || prof.education.length === 0) missing.push('Education History (+20%)');
    if (!Array.isArray(prof?.skills) || prof.skills.length === 0) missing.push('Skills (+15%)');
    if (!Array.isArray(prof?.projects) || prof.projects.length === 0) missing.push('Projects & Social Links (+10%)');
    return missing;
  };

  const updateProfile = async (updates) => {
    try {
      const merged = { ...profile, ...updates };
      const updatedProfile = await profileApi.upsertProfile(merged);
      setProfile(updatedProfile || merged);
      return { success: true, profile: updatedProfile || merged };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    completeness: calculateCompleteness(profile),
    missingItems: getMissingItems(profile),
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
