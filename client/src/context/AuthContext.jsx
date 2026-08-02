import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth session validity on mount
  const checkAuthSession = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Initial session lookup returned unauthenticated status');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
        return { success: true, user: res.data.data.user };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (error) {
      console.error('AuthContext Login failure:', error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', { name, email, password });
      if (res.data?.success) {
        // According to acceptance criteria, the user can log in even before verifying email.
        // Let's log them in automatically after registration by making a login request or setting local state!
        // The endpoint register returns user details. Let's log in immediately after registration by calling login:
        const loginRes = await login(email, password);
        return { success: true, user: loginRes.user, message: res.data.data.message };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (error) {
      console.error('AuthContext Register failure:', error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await API.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('AuthContext Logout failure:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, checkAuthSession, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
