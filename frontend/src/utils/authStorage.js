const AUTH_STORAGE_KEY = 'smart_healthcare_auth';

export const setAuthData = (authData) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
};

export const getAuthData = () => {
  const rawData = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawData) return null;

  try {
    return JSON.parse(rawData);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getToken = () => {
  const authData = getAuthData();
  return authData?.token || null;
};

export const getUser = () => {
  const authData = getAuthData();
  return authData?.user || null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};

export const isEmailVerified = () => {
  const user = getUser();
  return !!user?.isVerified;
};

export const isAccountActive = () => {
  const user = getUser();
  return user?.accountStatus === 'active';
};