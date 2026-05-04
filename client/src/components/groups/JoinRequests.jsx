import React, { useState, useEffect } from 'react';
import api from '../../../utils/Api';
import { useAuth } from '../../context/Authcontext';
import UniLifeLoader from '../Loader/UniLifeLoader';


const JoinRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching join requests for user:', user?.email);
      
      const response = await api.get('/groups/join-requests');
      console.log('Join requests response:', response.data);
      
      if (response.data.success) {
        setRequests(response.data.requests);
        if (response.data.requests.length === 0) {
          console.log('No pending requests found');
        }
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (requestId, status) => {
    const request = requests.find(r => r._id === requestId);
    const actionType = status === 'approved' ? 'approve' : 'reject';
    const roleToAssign = selectedRole[requestId] || request?.requestedRole || 'student';
    
    setPendingAction({
      requestId,
      status,
      userName: request?.user.name,
      roleToAssign: status === 'approved' ? roleToAssign : null
    });
    setShowConfirmModal(true);
  };

  const handleConfirmedAction = async () => {
    if (!pendingAction) return;

    const { requestId, status, roleToAssign } = pendingAction;
    
    setProcessingId(requestId);
    setError('');
    setShowConfirmModal(false);

    try {
      const response = await api.put(`/groups/join-request/${requestId}`, { 
        status,
        assignRole: roleToAssign 
      });
      
      if (response.data.success) {
        setRequests(requests.filter(req => req._id !== requestId));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setProcessingId(null);
      setPendingAction(null);
    }
  };

  const handleRoleChange = (requestId, role) => {
    setSelectedRole({
      ...selectedRole,
      [requestId]: role
    });
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

  // Only show for admins (teacher, cr, admin)
  if (!user || !['admin', 'teacher', 'cr'].includes(user.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center h-32">
          <UniLifeLoader size="1" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sidebar-request-card">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">Pending Requests</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Approve new members</p>
          </div>
          <button onClick={fetchRequests} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-xl transition-all shadow-sm" title="Refresh">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-gray-200">
            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-gray-500 font-semibold mb-1">Inbox Zero!</p>
            <p className="text-xs text-gray-400">No pending join requests</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {requests.map((request) => (
              <div key={request._id} className="mini-request-item p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold shadow-inner">
                    {request.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{request.user.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{request.user.email}</p>
                  </div>
                </div>

                <div className="bg-gray-50/80 rounded-lg p-2.5 mb-3 border border-gray-100">
                  <p className="text-xs text-gray-600 truncate"><span className="font-bold">Group:</span> {request.group.name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-md font-bold">
                      Req: {request.requestedRole || 'student'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <select 
                    value={selectedRole[request._id] || request.requestedRole || 'student'} 
                    onChange={(e) => handleRoleChange(request._id, e.target.value)} 
                    className="w-full text-xs font-medium border border-gray-200 bg-gray-50 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="student">Approve as Student</option>
                    <option value="teacher">Approve as Teacher</option>
                    <option value="cr">Approve as CR</option>
                  </select>

                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={() => confirmAction(request._id, 'approved')} 
                      disabled={processingId === request._id} 
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-white transition-all shadow-sm ${
                        processingId === request._id 
                          ? 'bg-emerald-400' 
                          : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {processingId === request._id ? '...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => confirmAction(request._id, 'rejected')} 
                      disabled={processingId === request._id} 
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        processingId === request._id 
                          ? 'bg-red-100 text-red-400' 
                          : 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:-translate-y-0.5'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Confirmation Modal (unchanged) */}
      {showConfirmModal && pendingAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                pendingAction.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {pendingAction.status === 'approved' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {pendingAction.status === 'approved' ? 'Approve Request' : 'Reject Request'}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Are you sure you want to {pendingAction.status} the request from{' '}
                <span className="font-medium text-gray-700">{pendingAction.userName}</span>?
              </p>
              {pendingAction.status === 'approved' && (
                <p className="text-sm text-gray-500 mb-4">
                  They will be added as <span className="font-medium text-indigo-600">{pendingAction.roleToAssign}</span>
                </p>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmedAction}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    pendingAction.status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Yes, {pendingAction.status === 'approved' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JoinRequests;