import React, { useEffect, useState, createContext } from "react";
import { setupFCMToken, listenForMessages } from "../services/fcmService";
import InteractiveToast from "../components/InteractiveToast";
import { useAuth } from "../../../context/Authcontext"; // Existing auth context

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (user) {
      if (Notification.permission === "granted") {
        // Safe to call immediately if already granted (no violation)
        setupFCMToken();
      } else if (Notification.permission === "default") {
        // Wait for the user's first click anywhere on the page to request permission
        const handleFirstClick = () => {
          setupFCMToken();
        };
        
        // { once: true } ensures this event listener instantly destroys itself after 1 click
        document.addEventListener("click", handleFirstClick, { once: true });

        return () => {
          document.removeEventListener("click", handleFirstClick);
        };
      }
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = listenForMessages((payload) => {
      setActiveNotification(payload);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
    });

    return () => unsubscribe();
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      
      {/* Fixed container for the toast */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, pointerEvents: 'none' }}>
        {activeNotification && (
          <InteractiveToast 
            payload={activeNotification} 
            onClose={() => setActiveNotification(null)} 
          />
        )}
      </div>
    </NotificationContext.Provider>
  );
};