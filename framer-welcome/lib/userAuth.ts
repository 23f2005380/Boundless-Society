import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const email = user.email ?? "";
  if (!email.endsWith("iitm.ac.in")) {
    await signOut(auth);
    alert("Only iitm.ac.in email IDs are allowed.");
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function logout() {
  await signOut(auth);
}
