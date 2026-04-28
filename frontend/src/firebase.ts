import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// 1. Go to console.firebase.google.com and create a project
// 2. Click the Web (</>) icon to add an app and copy your config object here
// 3. Go to "Authentication" -> "Sign-in method" and enable Google and Microsoft
const firebaseConfig = {
  apiKey: "AIzaSyA-jIUPhsaiI-gRWdTMbg8aqhLaruour5E",
  authDomain: "fileguard-6b0df.firebaseapp.com",
  projectId: "fileguard-6b0df",
  storageBucket: "fileguard-6b0df.firebasestorage.app",
  messagingSenderId: "526683054541",
  appId: "1:526683054541:web:235fd7a5707ccb8fc82484",
  measurementId: "G-MYG9943LCH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
// Optional: Force account selection prompt on Google Login
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
