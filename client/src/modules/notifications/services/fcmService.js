import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/firebaseClient";
import api from "../../../services/api"; // Your existing axios instance

const VAPID_KEY = "BKQNe1UgfoFPagbUEVQqKJRrUQ0Anj-BgiPVXtF9I-DsxjaleMMLXxXjoCEWgHesw2zL6tS6ayGxiuCkjmpLACw"; // From Firebase Console -> Cloud Messaging

export const setupFCMToken = async () => {
  try {
    let permission = Notification.permission;

    // Only request permission if it hasn't been asked yet
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    
    // ✅ FIX: Removed the duplicate 'const permission = ...' line that was causing a crash here
    
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await api.post("/notifications/save-token", { token, deviceType: "web" });
        return token;
      }
    }
  } catch (error) {
    console.error("FCM Token setup failed", error);
  }
};

export const listenForMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};