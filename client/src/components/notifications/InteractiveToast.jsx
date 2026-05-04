import React from 'react';
import './InteractiveToast.css';
import { useNavigate } from 'react-router-dom';

const InteractiveToast = ({ payload, closeToast }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (payload.data && payload.data.click_action) {
      navigate(payload.data.click_action);
    }
    if (closeToast) closeToast();
  };

  return (
    <div className="custom-toast-container" onClick={handleClick}>
      <div className="toast-icon">
        {payload.data?.type === 'chat' ? '💬' : '🔔'}
      </div>
      <div className="toast-content">
        <h4 className="toast-title">{payload.notification?.title}</h4>
        <p className="toast-body">{payload.notification?.body}</p>
      </div>
    </div>
  );
};

export default InteractiveToast;