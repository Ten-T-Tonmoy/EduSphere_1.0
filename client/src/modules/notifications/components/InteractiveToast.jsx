import React from 'react';
import './InteractiveToast.css';
import { useNavigate } from 'react-router-dom';

const InteractiveToast = ({ payload, onClose }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (payload.data?.click_action) {
      navigate(payload.data.click_action);
    }
    if (onClose) onClose();
  };

  return (
    <div className="premium-toast-wrapper" onClick={handleClick}>
      <div className="premium-toast-icon">✨</div>
      <div className="premium-toast-content">
        <h4 className="premium-toast-title">{payload.notification?.title}</h4>
        <p className="premium-toast-body">{payload.notification?.body}</p>
      </div>
    </div>
  );
};

export default InteractiveToast;