import { isFirebaseConfigured } from "./firebase";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const isDevAuthEnabled =
  process.env.NODE_ENV !== "production" && !isFirebaseConfigured;

export const DEV_TEST_EMAIL = "demo@kisan.local";
export const DEV_TEST_PASSWORD = "demo1234";
export const DEV_TEST_NAME = "Demo Farmer";

const DEV_USER_KEY = "kisan-saathi:dev-user";

export function readDevUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DEV_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AppUser>;
    if (typeof parsed.uid !== "string" || typeof parsed.email !== "string") {
      return null;
    }
    return {
      uid: parsed.uid,
      email: parsed.email,
      displayName:
        typeof parsed.displayName === "string" ? parsed.displayName : null,
    };
  } catch {
    return null;
  }
}

export function signInDevUser(email: string, password: string): AppUser {
  if (
    email.trim().toLowerCase() !== DEV_TEST_EMAIL ||
    password !== DEV_TEST_PASSWORD
  ) {
    throw new Error("dev-invalid-credentials");
  }

  const user: AppUser = {
    uid: "dev-farmer",
    email: DEV_TEST_EMAIL,
    displayName: DEV_TEST_NAME,
  };
  window.localStorage.setItem(DEV_USER_KEY, JSON.stringify(user));
  return user;
}

export function signOutDevUser(): void {
  window.localStorage.removeItem(DEV_USER_KEY);
}
