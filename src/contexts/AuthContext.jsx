import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function useControlAuth() {
  return useContext(AuthContext);
}

export function ControlAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('control_auth_key') === 'superadmin_access_granted';
  });

  const login = (passcode) => {
    if (passcode === 'admin123' || passcode === 'superadmin' || passcode === '1107') {
      localStorage.setItem('control_auth_key', 'superadmin_access_granted');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('control_auth_key');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
