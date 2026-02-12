// src/auth/AuthProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { user_id, email, full_name, role, token }
  const [loading, setLoading] = useState(true);

  // Vite environment variable
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // Load stored user on mount (from localStorage)
  useEffect(() => {
    try {
      const token = localStorage.getItem('app_token');
      const userJson = localStorage.getItem('app_user');

      if (token && userJson) {
        const parsedUser = JSON.parse(userJson);
        setUser({ ...parsedUser, token });
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      localStorage.removeItem('app_token');
      localStorage.removeItem('app_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // LOGIN → POST { email, password } to /login
  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || data?.error || "Invalid credentials";
        return { ok: false, message };
      }

      const token = data?.token;
      const userObj = data?.user;

      if (!token || !userObj) {
        return { ok: false, message: "Invalid API response: missing token or user" };
      }

      // Save to localStorage
      localStorage.setItem("app_token", token);
      localStorage.setItem("app_user", JSON.stringify(userObj));

      // Save to state
      setUser({ ...userObj, token });

      return { ok: true };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, message: "Network error. Please try again." };
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    setUser(null);
  };

  const isAuthenticated = !!user?.token;

  // For protected API calls: fetch(url, { headers: auth.getAuthHeader() })
  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("app_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    API_BASE,
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
