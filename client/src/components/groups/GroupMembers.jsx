import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import './GroupMembers.css'; // Import custom styles for the GroupMembers component
import UniLifeLoader from '../Loader/UniLifeLoader'; // Import the UniLifeLoader component for loading state

const GroupMembers = ({ groupId, groupName, onClose }) => {
  const [members, setMembers] = useState({ 
    admins: [], 
    students: [], 
    all: [], 
    isCurrentUserAdmin: false,
    totalMembers: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'student' });

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching members for group:', groupId); // Debug log
      
      const response = await api.get(`/groups/${groupId}/members`);
      console.log('Members response:', response.data); // Debug log
      
      if (response.data.success) {
        setMembers(response.data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError(err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const roleLabel = newRole === 'cr' || newRole === 'class_rep' ? 'Class Representative' : newRole;
    if (!window.confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
      return;
    }

    setProcessingId(userId);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/groups/${groupId}/members/${userId}/role`, {
        role: newRole
      });
      
      if (response.data.success) {
        setSuccess('Role updated successfully');
        fetchMembers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from the group? This action cannot be undone.`)) {
      return;
    }

    setProcessingId(userId);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/groups/${groupId}/members/${userId}`);
      
      if (response.data.success) {
        setSuccess('Member removed successfully');
        fetchMembers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.userId) {
      setError('Please enter an email address');
      return;
    }

    setProcessingId('add');
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/groups/${groupId}/members`, {
        userId: newMember.userId,
        role: newMember.role
      });
      
      if (response.data.success) {
        setSuccess('Member added successfully');
        setShowAddMember(false);
        setNewMember({ userId: '', role: 'student' });
        fetchMembers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 modal-glass-overlay flex items-center justify-center p-4 z-50">
        <div className="relative modal-glass-content w-full max-w-2xl h-[400px] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          {/* Brand Animation */}
          <UniLifeLoader size="1" />
          
          {/* Subtle loading text */}
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm font-bold text-gray-400 tracking-widest uppercase animate-pulse">
              Fetching Members
            </p>
            {/* Optional: Add a very slim progress bar look */}
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full mt-2 opacity-50"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 modal-glass-overlay flex items-center justify-center p-4">
      <div className="relative modal-glass-content w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white/50 backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
              {groupName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                {members.totalMembers || members.all?.length || 0} Active Members
              </p>
            </div>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors focus:outline-none">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Add Member Button & Form */}
          {members.isCurrentUserAdmin && (
            <div className="mb-6">
              <button onClick={() => setShowAddMember(!showAddMember)} className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center space-x-2 shadow-sm">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>{showAddMember ? 'Close Form' : 'Add Member Manually'}</span>
              </button>

              {showAddMember && (
                <div className="mt-4 p-5 border border-indigo-100 rounded-2xl bg-indigo-50/50 backdrop-blur-sm">
                  <h4 className="text-sm font-extrabold text-indigo-900 mb-3 uppercase tracking-wider">Invite via Email</h4>
                  <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email" 
                      value={newMember.userId} 
                      onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })} 
                      placeholder="Email address" 
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      required 
                    />
                    <select 
                      value={newMember.role} 
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} 
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="cr">CR</option>
                    </select>
                    <button 
                      type="submit" 
                      disabled={processingId === 'add'} 
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {processingId === 'add' ? '...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Members Lists */}
          <div className="space-y-8 pb-4">
            
            {/* Admins */}
            {members.admins && members.admins.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold text-gray-400 mb-3 uppercase tracking-widest pl-2">
                  Leadership ({members.admins.length})
                </h4>
                <div className="space-y-3">
                  {members.admins.map((member) => (
                    <div key={member.user._id} className="member-row flex items-center justify-between p-3.5 pl-4 pr-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-extrabold shadow-inner border border-purple-50">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.user.name}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {member.user.studentId && `ID: ${member.user.studentId} • `}
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                         {/* Static Badge if not admin or if it's the current user */}
                        {(!members.isCurrentUserAdmin || member.user._id === members.currentUserRole?._id) && (
                           <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                            {member.role}
                          </span>
                        )}

                        {/* Controls for Admin */}
                        {members.isCurrentUserAdmin && member.user._id !== members.currentUserRole?._id && (
                          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                            <select 
                              value={member.role} 
                              onChange={(e) => handleRoleChange(member.user._id, e.target.value)} 
                              disabled={processingId === member.user._id} 
                              className="custom-select-mini"
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="cr">CR</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button 
                              onClick={() => handleRemoveMember(member.user._id, member.user.name)} 
                              disabled={processingId === member.user._id} 
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors" 
                              title="Remove member"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students */}
            {members.students && members.students.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold text-gray-400 mb-3 uppercase tracking-widest pl-2">
                  Students ({members.students.length})
                </h4>
                <div className="space-y-3">
                  {members.students.map((member) => (
                    <div key={member.user._id} className="member-row flex items-center justify-between p-3.5 pl-4 pr-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-extrabold shadow-inner border border-gray-50">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.user.name}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {member.user.studentId && `ID: ${member.user.studentId} • `}
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {!members.isCurrentUserAdmin && (
                           <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                            Student
                          </span>
                        )}

                        {members.isCurrentUserAdmin && (
                          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                            <select 
                              value={member.role} 
                              onChange={(e) => handleRoleChange(member.user._id, e.target.value)} 
                              disabled={processingId === member.user._id} 
                              className="custom-select-mini"
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="cr">CR</option>
                            </select>
                            <button 
                              onClick={() => handleRemoveMember(member.user._id, member.user.name)} 
                              disabled={processingId === member.user._id} 
                              className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors" 
                              title="Remove member"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!members.admins || members.admins.length === 0) && (!members.students || members.students.length === 0) && (
              <div className="text-center py-10">
                <p className="text-gray-400 font-bold">No members found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMembers;