/**
 * Mock Authentication Service
 * Replace these functions with real API calls when the backend is ready.
 */

const MOCK_USERS = [
  {
    id: 'user-001',
    fullName: 'Sarah Chen',
    email: 'sarah@example.com',
    password: 'Password1',
    avatar: null,
    professionalTitle: 'Senior Frontend Developer',
    isFirstLogin: false,
    createdAt: '2025-11-15T10:00:00Z',
  },
];

const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginUser(email, password) {
  await delay(1000);

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (user) {
    if (user.password !== password) {
      throw new Error('Invalid email or password');
    }
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token: `mock-token-${Date.now()}` };
  }

  // Allow any login with proper format for demo
  if (email.includes('@') && password.length >= 8) {
    return {
      user: {
        id: `user-${Date.now()}`,
        fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        avatar: null,
        professionalTitle: '',
        isFirstLogin: false,
        createdAt: new Date().toISOString(),
      },
      token: `mock-token-${Date.now()}`,
    };
  }

  throw new Error('Invalid email or password');
}

export async function signupUser({ fullName, email, password }) {
  await delay(1200);

  if (!fullName || !email || !password) {
    throw new Error('All fields are required');
  }

  const exists = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    throw new Error('An account with this email already exists');
  }

  return {
    user: {
      id: `user-${Date.now()}`,
      fullName,
      email,
      avatar: null,
      professionalTitle: '',
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
    },
    token: `mock-token-${Date.now()}`,
  };
}

export async function logoutUser() {
  await delay(300);
  return { success: true };
}

export function getCurrentUser() {
  try {
    const stored =
      localStorage.getItem('resumeflow_user') ||
      sessionStorage.getItem('resumeflow_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
