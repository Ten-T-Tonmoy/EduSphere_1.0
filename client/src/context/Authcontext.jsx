import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/Api";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Verify token and get user profile on refresh
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (error) {
          console.error("Session expired or invalid token");
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token); // Store token first
      setUser(res.data.user); // Set state for immediate UI update
      return res.data.user;
    }
    throw new Error("Login failed: No token received");
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error("Registration failed: No token received");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // Optional: window.location.href = '/login';
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
  <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
    {loading ? (
      /* Splash Screen Style Loader */
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
        <UniLifeLoader size="1.5" />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">UniLife</h1>
          <p className="text-indigo-500 font-bold text-xs uppercase tracking-[0.3em] mt-2 animate-pulse">
            Establishing Secure Session
          </p>
        </div>
      </div>
    ) : (
      children
    )}
  </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};