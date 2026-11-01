import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, logout as logoutRequest } from "../services/api";

const AuthContext = createContext(null);

function normalizeAuthUser(data) {
  const rawUser = data?.user || data;

  if (!rawUser?.email || !rawUser?.role) {
    return null;
  }

  return {
    id: rawUser.userId || rawUser.id || null,
    email: rawUser.email,
    role: String(rawUser.role).toUpperCase(),
    status: rawUser.status || "active",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAuthResponse = useCallback((data) => {
    const nextUser = normalizeAuthUser(data);
    setUser(nextUser);
    return nextUser;
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCurrentUser();
      return applyAuthResponse(data);
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyAuthResponse]);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The UI should still clear stale auth state even if the request fails.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      applyAuthResponse,
      refreshAuth,
      signOut,
    }),
    [user, loading, applyAuthResponse, refreshAuth, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
