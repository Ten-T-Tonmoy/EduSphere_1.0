import React, { useState } from 'react';
import api from '../../utils/Api';
import { useAuth } from '../../context/Authcontext';
import UniLifeLoader from '../Loader/UniLifeLoader';


const JoinGroup = ({ onRequestSent }) => {
  const [formData, setFormData] = useState({
    groupName: '',
    pin: '',
    requestedRole: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/groups/join-request', formData);
      if (response.data.success) {
        setSuccess('Join request sent successfully! Waiting for admin approval.');
        setFormData({ groupName: '', pin: '', requestedRole: 'student' });
        if (onRequestSent) {
          onRequestSent(response.data.request);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  // Determine available roles based on user's actual role
  const getAvailableRoles = () => {
    if (user?.role === 'teacher') {
      return [
        { value: 'student', label: 'Student' },
        { value: 'teacher', label: 'Teacher' }
      ];
    } else if (user?.role === 'cr') {
      return [
        { value: 'student', label: 'Student' },
        { value: 'cr', label: 'CR' }
      ];
    } else {
      return [{ value: 'student', label: 'Student' }];
    }
  };

  return (
    <div className="premium-form-card">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">
          Join Existing Group
        </h3>
        <p className="text-sm text-gray-500 mt-1 font-medium">Enter the credentials to send a join request.</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="groupName" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Group Name</label>
          <input 
            type="text" 
            id="groupName" 
            name="groupName" 
            value={formData.groupName} 
            onChange={handleChange} 
            required 
            className="premium-input w-full px-4 py-3 text-gray-800" 
            placeholder="Enter exactly as provided" 
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Group PIN</label>
          <input 
            type="text" 
            id="pin" 
            name="pin" 
            value={formData.pin} 
            onChange={handleChange} 
            required 
            className="premium-input w-full px-4 py-3 text-gray-800 tracking-widest font-mono" 
            placeholder="••••••••" 
          />
        </div>

        <div>
          <label htmlFor="requestedRole" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Request as Role</label>
          <select 
            id="requestedRole" 
            name="requestedRole" 
            value={formData.requestedRole} 
            onChange={handleChange} 
            className="premium-input w-full px-4 py-3 text-gray-800 bg-white appearance-none cursor-pointer"
          >
            {getAvailableRoles().map(role => (
              <option key={role.value} value={role.value} className="font-medium text-gray-700">{role.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2 font-medium flex items-center">
            <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            You can only request roles that match your actual role
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className={`btn-gradient-success w-full py-3.5 px-4 mt-2 flex justify-center items-center space-x-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
        {loading ? (
    <div className="flex items-center justify-center h-5 overflow-hidden">
      {/* We scale it down to 0.4 to fit perfectly inside the button height */}
      <div style={{ transform: 'scale(0.4)', transformOrigin: 'center' }}>
        <UniLifeLoader />
      </div>
    </div>
  ) : 'Request to Join'}
        </button>
      </form>
    </div>
  );
};

export default JoinGroup;