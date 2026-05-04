import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCi4jx3_DL5M8Xfltx2rJ4KpyhTXyoDvgw",
  authDomain: "unilife-manager-29c5f.firebaseapp.com",
  projectId: "unilife-manager-29c5f",
  storageBucket: "unilife-manager-29c5f.firebasestorage.app",
  messagingSenderId: "660281122323",
  appId: "1:660281122323:web:3c86fa409173eb8585a9e6",
  measurementId: "G-FZ65WN4648"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);