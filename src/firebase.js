// Firebase Configuration for System Control Panel
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBRxsuOV1OnZsJpgO3IFOQt9k55jVQWl-I",
  authDomain: "panel-adefe.firebaseapp.com",
  databaseURL: "https://panel-adefe-default-rtdb.firebaseio.com",
  projectId: "panel-adefe",
  storageBucket: "panel-adefe.appspot.com",
  messagingSenderId: "36720490892",
  appId: "1:36720490892:web:1931fb5ff5bd7f28731b8a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
