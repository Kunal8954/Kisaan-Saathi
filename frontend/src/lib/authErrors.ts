import { getDictionary, type Locale } from "./i18n";

export function getFirebaseErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

export function mapAuthError(error: unknown, locale: Locale): string {
  const messages = getDictionary(locale).auth.errors;

  switch (getFirebaseErrorCode(error)) {
    case "auth/invalid-email":
      return messages.invalidEmail;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return messages.wrongCredentials;
    case "auth/email-already-in-use":
      return messages.emailInUse;
    case "auth/weak-password":
      return messages.weakPassword;
    case "auth/too-many-requests":
      return messages.tooManyRequests;
    case "auth/network-request-failed":
      return messages.network;
    default:
      return messages.generic;
  }
}
