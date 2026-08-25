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
          setProfile(data);
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
    if (prof.full_name) score += 15;
    if (prof.professional_title) score += 15;
    if (prof.email) score += 15;
    if (prof.city || prof.country) score += 15;
    if (Array.isArray(prof.education) && prof.education.length > 0) score += 20;
    if (Array.isArray(prof.skills) && prof.skills.length > 0) score += 20;
    return score;
  };

  const updateProfile = async (updates) => {
    try {
      const updatedProfile = await profileApi.upsertProfile({ ...profile, ...updates });
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
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
