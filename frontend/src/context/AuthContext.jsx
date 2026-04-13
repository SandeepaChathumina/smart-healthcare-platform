import { createContext, useEffect, useMemo, useState } from 'react';
import { clearAuthData, getAuthData, setAuthData } from '../utils/authStorage';
import { loginUser, logoutUser } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => getAuthData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = getAuthData();
    setAuth(storedAuth);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);

    const authPayload = {
      token: data.token,
      user: data.user,
    };

    setAuthData(authPayload);
    setAuth(authPayload);

    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // keep silent and still logout locally
    } finally {
      clearAuthData();
      setAuth(null);
    }
  };

  const updateUser = (updatedUser) => {
    if (!auth) return;

    const updatedAuth = {
      ...auth,
      user: updatedUser,
    };

    setAuthData(updatedAuth);
    setAuth(updatedAuth);
  };

  const isAuthenticated = !!auth?.token;
  const user = auth?.user || null;
  const token = auth?.token || null;

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const value = useMemo(
    () => ({
      auth,
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUser,
      hasRole,
    }),
    [auth, user, token, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};