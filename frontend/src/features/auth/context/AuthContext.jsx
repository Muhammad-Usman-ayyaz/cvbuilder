import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const data = await authApi.getMe();
        if (!cancelled && data.success) {
          setUser(data.user);
        }
      } catch (err) {
        // Not authenticated or session expired
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signup = async ({ email, password, fullName }) => {
    setLoading(true);
    try {
      const data = await authApi.signup(email, password, fullName);
      if (data.success && data.user) {
        setUser(data.user);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials.email, credentials.password);
      if (data.success && data.user) {
        setUser(data.user);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
      }
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedFields) => {
    if (!user) return;

    if (updatedFields.fullName !== undefined) {
      await authApi.updateProfile(updatedFields.fullName);
    }

    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('access_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        updateUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);