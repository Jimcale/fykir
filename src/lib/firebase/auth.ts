import {
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./client";

const googleProvider = new GoogleAuthProvider();

export function signInAsGuest() {
  return signInAnonymously(auth);
}

export function signOutUser() {
  return signOut(auth);
}

/**
 * Upgrades the current anonymous session to a Google account so the user's
 * page survives across devices/browsers. If that Google account is already
 * linked elsewhere, falls back to a plain Google sign-in (a fresh uid) —
 * the caller decides how to reconcile page ownership in that rare case.
 */
export async function protectPageWithGoogle(currentUser: User) {
  try {
    return { user: (await linkWithPopup(currentUser, googleProvider)).user, merged: false };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/credential-already-in-use") {
      const credential = GoogleAuthProvider.credentialFromError(
        err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
      );
      if (credential) {
        const result = await signInWithCredential(auth, credential);
        return { user: result.user, merged: true };
      }
    }
    throw err;
  }
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}
