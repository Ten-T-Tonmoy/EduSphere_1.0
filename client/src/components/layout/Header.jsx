import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Authcontext';
import { useNavigate } from 'react-router-dom';
import NoticeNotifications from '../noticeboard/NoticeNotifications';
import api from "../../services/api";

const Header = ({ title = 'UniLife Manager' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Teacher';
      case 'cr': return 'CR';
      default: return 'Student';
    }
  };

  const getRoleBadgeStyle = () => {
    switch(user?.role) {
      case 'admin': return 'bg-purple-600 text-white';
      case 'teacher': return 'bg-blue-600 text-white';
      case 'cr': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch quick logs for dropdown
  useEffect(() => {
    const fetchQuickLogs = async () => {
      try {
        const res = await api.get('/notifications/logs');
        setRecentLogs(res.data.logs.slice(0, 5)); // Show only top 5 in dropdown
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    if (user) {
      fetchQuickLogs();
    }
  }, [user]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* BULLETPROOF CSS FOR HOVER ANIMATIONS */}
      <style>{`
        @keyframes profileSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .profile-btn .profile-ring {
          animation: profileSpin 4s linear infinite;
        }
        .profile-btn:hover .profile-ring {
          animation: profileSpin 0.8s linear infinite;
        }
        .hover-zoom-108 {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-btn:hover .hover-zoom-108, 
        .notif-btn:hover .hover-zoom-108 {
          transform: scale(1.08);
        }
        .notif-bg {
          opacity: 0;
          transform: scale(0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notif-btn:hover .notif-bg {
          opacity: 1;
          transform: scale(1);
        }
        .notif-icon-color {
          color: #9ca3af; /* text-gray-400 */
          transition: color 0.3s ease;
        }
        .notif-btn:hover .notif-icon-color {
          color: #4b5563; /* text-gray-600 */
        }
      `}</style>

      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <div className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getRoleBadgeStyle()}`}>
                {getRoleDisplayName(user?.role)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NoticeNotifications />

              {/* ✅ FULLY FIXED NOTIFICATION BELL */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="notif-btn relative p-2 rounded-full focus:outline-none flex items-center justify-center w-10 h-10"
                >
                  {/* Outer Background Circle (z-0 ensures it stays behind the mouse pointer) */}
                  <div className={`absolute inset-0 bg-gray-100 rounded-full notif-bg z-0 ${showNotifDropdown ? 'opacity-100 scale-100' : ''}`}></div>
                  
                  {/* Inner Bell Icon (z-10 ensures it stays clickable) */}
                  <div className="relative z-10 flex items-center justify-center hover-zoom-108 notif-icon-color">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-semibold text-gray-800">Notifications</span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {recentLogs.length === 0 ? (
                        <p className="text-sm text-gray-500 px-4 py-4 text-center">No recent notifications</p>
                      ) : (
                        recentLogs.map((log) => (
                          <div 
                            key={log._id}
                            onClick={() => { setShowNotifDropdown(false); navigate(log.actionUrl); }}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors flex gap-3 items-start ${log.isRead ? 'opacity-70' : 'bg-indigo-50/30'}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                              {log.sender?.avatar ? (
                                <img src={log.sender.avatar} alt="Sender" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">{log.type === 'chat' ? '💬' : log.type === 'notice' ? '📌' : '🔔'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{log.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{log.body}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button 
                        onClick={() => { setShowNotifDropdown(false); navigate('/notifications'); }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
                      >
                        View Full History
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FULLY FIXED PROFILE AVATAR */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="profile-btn relative focus:outline-none p-[3px] rounded-full flex items-center justify-center"
                >
                  {/* Outer Animated Gradient Ring (Speeds up on hover via CSS) */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 profile-ring z-0"></div>
                  
                  {/* Inner container to separate the gradient from the image */}
                  <div className="relative z-10 bg-white rounded-full p-[2px] hover-zoom-108">
                    <div className="user-avatar overflow-hidden rounded-full h-8 w-8 bg-indigo-50">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-sm text-indigo-700">
                          {getInitials(user?.name || 'User')}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="premium-dropdown absolute right-0 mt-2 w-64 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyle()}`}>
                          {getRoleDisplayName(user?.role)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="premium-modal p-6 w-96">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-500 mb-4">Are you sure you want to logout?</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;