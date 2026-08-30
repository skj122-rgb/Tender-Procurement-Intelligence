import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = (newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          // API returns { success, message, data: { user } }
          const userData = response.data?.data?.user || response.data?.user;
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Token validation failed', error);
          setToken(null);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []); // Only run once on mount

  const login = async (identifier, password) => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    // API returns { success, message, data: { accessToken, user } }
    const resData = response.data?.data || response.data;
    const accessToken = resData.accessToken || resData.token;
    const userData = resData.user;

    setToken(accessToken);
    setUser(userData);
    return resData;
  };

  const signup = async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data?.data || response.data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Logout endpoint might fail if token expired — that's fine
    }
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, signup, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
