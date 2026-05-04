import React, { useState } from 'react';
import api from '../../utils/Api';
import UniLifeLoader from '../Loader/UniLifeLoader';

const CreateGroup = ({ onGroupCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const response = await api.post('/groups/create', formData);
      if (response.data.success) {
        setSuccess('Group created successfully!');
        setFormData({ name: '', pin: '', description: '' });
        if (onGroupCreated) {
          onGroupCreated(response.data.group);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-form-card">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
          Create New Group
        </h3>
        <p className="text-sm text-gray-500 mt-1 font-medium">Set up a new workspace for your peers.</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="groupName" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Group Name</label>
          <input 
            type="text" 
            id="groupName" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            className="premium-input w-full px-4 py-3 text-gray-800" 
            placeholder="e.g. Computer Science 101" 
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Group PIN <span className="text-gray-400 font-normal">(4-10 chars)</span></label>
          <input 
            type="text" 
            id="pin" 
            name="pin" 
            value={formData.pin} 
            onChange={handleChange} 
            required 
            minLength="4" 
            maxLength="10" 
            className="premium-input w-full px-4 py-3 text-gray-800 tracking-widest font-mono" 
            placeholder="••••••••" 
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-bold tracking-wide text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows="3" 
            className="premium-input w-full px-4 py-3 text-gray-800 resize-none" 
            placeholder="What is this group about?" 
          />
        </div>


        <button 
  type="submit" 
  disabled={loading} 
  className={`btn-gradient-primary w-full py-3.5 px-4 mt-2 flex justify-center items-center ${loading ? 'opacity-70 cursor-wait' : ''}`}
>
  {loading ? (
    <div className="h-6 flex items-center overflow-hidden"> 
      <UniLifeLoader size="0.4" />  {/* Shrink it to 40% to fit the button height */}
    </div>
  ) : 'Create Group'}


  

        </button>
      </form>
    </div>
  );
};

export default CreateGroup;