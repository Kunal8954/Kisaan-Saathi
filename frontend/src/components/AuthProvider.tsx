"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  isDevAuthEnabled,
  readDevUser,
  signInDevUser,
  signOutDevUser,
  type AppUser,
} from "@/lib/devAuth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  signOutUser: () => Promise<void>;
  signInDev: (email: string, password: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(
    isFirebaseConfigured || isDevAuthEnabled
  );
  const configured = isFirebaseConfigured;

  useEffect(() => {
    if (isDevAuthEnabled) {
      setUser(readDevUser());
      setLoading(false);
      return;
    }

    if (!configured) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (nextUser) => {
          if (!active) {
            return;
          }
          setUser(nextUser);
          setLoading(false);
        },
        () => {
          if (!active) {
            return;
          }
          setUser(null);
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured]);

  const signInDev = useCallback((email: string, password: string) => {
    const next = signInDevUser(email, password);
    setUser(next);
  }, []);

  const signOutUser = useCallback(async () => {
    if (isDevAuthEnabled) {
      signOutDevUser();
      setUser(null);
      return;
    }
    if (!configured) {
      return;
    }
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setUser(null);
    }
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, configured, signOutUser, signInDev }),
    [user, loading, configured, signOutUser, signInDev]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
