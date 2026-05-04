import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateGroup from '../components/groups/CreateGroup';
import JoinGroup from '../components/groups/JoinGroup';
import JoinRequests from '../components/groups/JoinRequests';
import GroupMembers from '../components/groups/GroupMembers';
import api from '../../../utils/Api';
import './Groups.css'; // Custom styles for the enhanced UI
import UniLifeLoader from '../Loader/UniLifeLoader'; // Import the UniLifeLoader component for loading state


const Groups = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-groups');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups/my-groups');
      if (response.data.success) {
        setMyGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewMembers = (group) => {
    setSelectedGroup(group);
    setShowMembers(true);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'cr':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="dashboard-container min-h-screen bg-gray-50">
      {/* Header with Glassmorphism */}
      <header className="glass-nav bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                UniLife Manager
              </h1>
              <div className={`px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-bold shadow-sm ${getRoleBadgeStyle()}`}>
                {getRoleDisplayName(user?.role)}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 focus:outline-none transform hover:scale-105 transition-transform duration-200"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                    {getInitials(user?.name || 'User')}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 py-2 z-50">
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-lg bg-white">
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
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Animated Tabs */}
        <div className="border-b border-gray-200/50 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['my-groups', 'create', 'join'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`premium-tab py-3 px-1 font-semibold text-sm tracking-wide capitalize ${
                  activeTab === tab 
                    ? 'text-indigo-600 border-b-2 border-indigo-500' 
                    : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'my-groups' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">My Groups</h2>
                {loading ? (
  <div className="flex flex-col justify-center items-center py-12">
    <UniLifeLoader size="1" />
    <p className="mt-4 text-xs font-bold text-indigo-400 tracking-[0.2em] uppercase animate-pulse">
      Loading Your Groups
    </p>
  </div>
                ) : myGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
                    <button
                      onClick={() => setActiveTab('join')}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Join a group now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myGroups.map((item, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{item.group.name}</h3>
                            {item.group.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.group.description}</p>
                            )}
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-xs text-gray-500">
                                Members: {item.group.members?.length || 0}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(item.role)}`}>
                                {getRoleDisplayName(item.role)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewMembers(item.group)}
                            className="ml-4 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            Manage Members
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <CreateGroup onGroupCreated={fetchMyGroups} />
              </div>
            )}

            {activeTab === 'join' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <JoinGroup onRequestSent={() => {}} />
              </div>
            )}
          </div>

          {/* Sidebar - Join Requests for Admins */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <JoinRequests />
            </div>
          </div>
        </div>
      </main>

      {/* Group Members Modal */}
      {showMembers && selectedGroup && (
        <GroupMembers
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowMembers(false);
            setSelectedGroup(null);
            fetchMyGroups();
          }}
        />
      )}
    </div>
  );
};

export default Groups;