import { auth } from '../config/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  signInAnonymously
} from 'firebase/auth';

const AVATARS = ['🌌','⚡','🔥','🌙','🌊','🎭','🦋','🌸'];

export const getAvatars = () => AVATARS;

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not configured");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInGuest = async () => {
  if (!auth) throw new Error("Firebase not configured");
  const result = await signInAnonymously(auth);
  // Set a random guest name if not set
  if (!result.user.displayName) {
    const randomName = "Guest_" + Math.floor(Math.random() * 10000);
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    await firebaseUpdateProfile(result.user, { displayName: randomName, photoURL: randomAvatar });
  }
  return result.user;
};

export const updateProfile = async (updates) => {
  if (auth && auth.currentUser) {
    await firebaseUpdateProfile(auth.currentUser, {
      displayName: updates.displayName,
      photoURL: updates.avatar // We store avatar in photoURL for convenience
    });
    return auth.currentUser;
  }
  return null;
};

export const signOut = () => {
  if (auth) return firebaseSignOut(auth);
};

export const onAuthStateChanged = (callback) => {
  if (!auth) {
    console.warn("Firebase Auth is not initialized. Using dummy user for UI.");
    // Dummy user so UI doesn't crash completely while waiting for config
    callback({ uid: 'dummy_1', displayName: 'ConfigNeeded', photoURL: '⚠️', isAnonymous: false });
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
