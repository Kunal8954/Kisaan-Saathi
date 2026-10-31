"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const configured = isFirebaseConfigured;

  useEffect(() => {
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

  const signOutUser = useCallback(async () => {
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
    () => ({ user, loading, configured, signOutUser }),
    [user, loading, configured, signOutUser]
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
