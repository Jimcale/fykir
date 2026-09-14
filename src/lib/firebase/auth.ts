import { deleteApp, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { auth, firebaseApp } from "./client";
import { pagesCol } from "./collections";

const googleProvider = new GoogleAuthProvider();

export function signInAsGuest() {
  return signInAnonymously(auth);
}

export function signOutUser() {
  return signOut(auth);
}

/**
 * Upgrades the current anonymous session to a Google account so the user's
 * page survives across devices/browsers.
 *
 * If that Google account is already linked to a different Firebase user
 * (e.g. they protected a page from another browser before), linking fails
 * with "credential-already-in-use". We peek at that other account via a
 * throwaway secondary app (without disturbing the current session, so we
 * still have write access to the current page) and, if it has no page of
 * its own yet, hand the current page over to it before switching the main
 * session to that account — so the page the user was just using keeps
 * working under their Google identity instead of appearing to vanish.
 */
export async function protectPageWithGoogle(currentUser: User) {
  try {
    return { user: (await linkWithPopup(currentUser, googleProvider)).user, merged: false };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== "auth/credential-already-in-use") throw err;

    const credential = GoogleAuthProvider.credentialFromError(
      err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
    );
    if (!credential) throw err;

    const probeApp = initializeApp(firebaseApp.options, `protect-probe-${Date.now()}`);
    let targetUid: string;
    try {
      const probeResult = await signInWithCredential(getAuth(probeApp), credential);
      targetUid = probeResult.user.uid;
    } finally {
      await deleteApp(probeApp);
    }

    const targetAlreadyHasPage = !(
      await getDocs(query(pagesCol, where("owner_uid", "==", targetUid), limit(1)))
    ).empty;

    if (!targetAlreadyHasPage) {
      const currentPage = await getDocs(
        query(pagesCol, where("owner_uid", "==", currentUser.uid), limit(1))
      );
      if (!currentPage.empty) {
        await updateDoc(currentPage.docs[0].ref, { owner_uid: targetUid });
      }
    }

    const result = await signInWithCredential(auth, credential);
    return { user: result.user, merged: true };
  }
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}
