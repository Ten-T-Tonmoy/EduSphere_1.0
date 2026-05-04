import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/Authcontext';
import { useNavigate } from 'react-router-dom';
import MyGroups from '../components/groups/MyGroups';
import CreateGroup from '../components/groups/CreateGroup';
import JoinGroup from '../components/groups/JoinGroup';
import RequestsApproval from '../components/groups/RequestsApproval';
import NoticeBoard from '../components/noticeboard/NoticeBoard';
import NoticeNotifications from '../components/noticeboard/NoticeNotifications';
import api from '../services/api';
import './GroupManagement.css'; // <-- Premium styles
import Header from '../components/layout/Header';



const GroupManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State definitions
  const [activePage, setActivePage] = useState('my-groups');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedGroupForNotices, setSelectedGroupForNotices] = useState(null);
  const [showNoticeBoard, setShowNoticeBoard] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // FIXED: Added useRef definition to handle the strict mode/double fetch check
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchMyGroups();
    }
  }, []);

  const handleViewNotices = (group) => {
    setSelectedGroupForNotices(group);
    setShowNoticeBoard(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch user's groups
  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups/my-groups');
      if (response.data.success) {
        setMyGroups(response.data.groups);
        console.log('Fetched groups:', response.data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Event listener for opening notice board from notifications
  useEffect(() => {
    // FIXED: Now fetchedRef is defined, so this block works correctly
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchMyGroups();
    }

    const handleOpenNoticeBoard = (event) => {
      const { groupId, noticeId, groupName } = event.detail;
      console.log('Opening notice board for group:', groupId, 'notice:', noticeId);
      
      // Find the group in myGroups
      const groupItem = myGroups.find(g => g.group._id === groupId);
      
      if (groupItem) {
        // Set the selected group and open notice board
        setSelectedGroupForNotices(groupItem.group);
        setShowNoticeBoard(true);
        
        // Store the notice ID to highlight it
        sessionStorage.setItem('highlightNotice', noticeId);
        
        // Switch to my-groups tab if not already there
        setActivePage('my-groups');
      } else {
        console.log('Group not found in myGroups, fetching again...');
        // If group not found, fetch groups again and try once more
        fetchMyGroups().then(() => {
          // Small delay to ensure state is updated
          setTimeout(() => {
            const retryGroupItem = myGroups.find(g => g.group._id === groupId);
            if (retryGroupItem) {
              setSelectedGroupForNotices(retryGroupItem.group);
              setShowNoticeBoard(true);
              sessionStorage.setItem('highlightNotice', noticeId);
              setActivePage('my-groups');
            } else {
              console.error('Group still not found after refresh:', groupId);
            }
          }, 500);
        });
      }
    };

    window.addEventListener('openNoticeBoard', handleOpenNoticeBoard);
    
    return () => {
      window.removeEventListener('openNoticeBoard', handleOpenNoticeBoard);
    };
  }, [myGroups]); // Add myGroups as dependency

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
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'cr':
        return 'CR';
      default:
        return 'Student';
    }
  };

  const getRoleBadgeStyle = () => {
    switch(user?.role) {
      case 'admin':
        return 'bg-purple-600 text-white';
      case 'teacher':
        return 'bg-blue-600 text-white';
      case 'cr':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const isAdmin = user && ['admin', 'teacher', 'cr'].includes(user.role);

  // Page navigation items
  const navItems = [
    { id: 'my-groups', label: 'My Groups', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'create', label: 'Create Group', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
    { id: 'join', label: 'Join Group', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  ];

  // Add Requests Approval for admins
  if (isAdmin) {
    navItems.push({ 
      id: 'requests', 
      label: 'Requests Approval', 
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' 
    });
  }

  return (
    <div className="group-management">
      {/* Header with glass effect */}
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                UniLife Manager
              </h1>
              <div className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getRoleBadgeStyle()}`}>
                {getRoleDisplayName(user?.role)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NoticeNotifications />
              
              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="focus:outline-none"
                >
                  <div className="user-avatar">
                    {getInitials(user?.name || 'User')}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="premium-tabs">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`premium-tab flex items-center space-x-2 ${
                  activePage === item.id ? 'active' : ''
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.label}</span>
                {item.id === 'requests' && (
                  <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                    New
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Page Content */}
        <div className="content-card">
          {activePage === 'my-groups' && (
            <MyGroups onViewNotices={handleViewNotices} />
          )}
          {activePage === 'create' && <CreateGroup onGroupCreated={() => setActivePage('my-groups')} />}
          {activePage === 'join' && <JoinGroup />}
          {activePage === 'requests' && <RequestsApproval />}
        </div>
      </main>

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
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Board Modal */}
      {showNoticeBoard && selectedGroupForNotices && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center">
          <div className="notice-board-modal p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Notice Board - {selectedGroupForNotices.name}
              </h2>
              <button
                onClick={() => {
                  setShowNoticeBoard(false);
                  setSelectedGroupForNotices(null);
                  sessionStorage.removeItem('highlightNotice');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NoticeBoard
              groupId={selectedGroupForNotices._id}
              groupName={selectedGroupForNotices.name}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;