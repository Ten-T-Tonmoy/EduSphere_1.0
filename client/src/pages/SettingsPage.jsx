import React, { useState, useEffect } from 'react';
import { Bell, VolumeX, Vibrate, Clock, Settings, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/Authcontext'; // Corrected path
import api from '../utils/Api'; // Added API

const SettingsPage = () => {
  // Default settings
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    alarmEnabled: true,
    muteEnabled: true,
    muteMode: 'silent' // 'silent' or 'vibrate_simulated'
  });
  const [saved, setSaved] = useState(false);

  // Load from DB first, then fallback to LocalStorage
  useEffect(() => {
    if (user?.appSettings) {
      setSettings(user.appSettings);
    } else {
      const local = localStorage.getItem('unilife_settings');
      if (local) setSettings(JSON.parse(local));
    }
  }, [user]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const saveSettings = async () => {
    try {
      // 1. Save to Database (Centralized Control)
      await api.put('/users/settings', { appSettings: settings });
      
      // 2. Keep local copy for offline speed
      localStorage.setItem('unilife_settings', JSON.stringify(settings));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to sync settings with server.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600" /> App Settings
        </h1>
        <p className="text-slate-500 mt-2">Configure your class alarms and auto-focus preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Alarm Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" /> First Class Alarm
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Get an in-app audio reminder 30 minutes and 15 minutes before your very first class of the day begins.
              </p>
            </div>
            {/* Toggle Switch */}
            <button 
              onClick={() => handleToggle('alarmEnabled')}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.alarmEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.alarmEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4"/> 30 Min Reminder
            </div>
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4"/> 15 Min Reminder
            </div>
          </div>
        </div>

        {/* Auto-Mute Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <VolumeX className="w-5 h-5 text-rose-500" /> Auto In-App Mute
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Automatically mute all incoming chat sounds and notifications while your first class is actively running.
              </p>
            </div>
            <button 
              onClick={() => handleToggle('muteEnabled')}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.muteEnabled ? 'bg-rose-500' : 'bg-slate-200'}`}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.muteEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className={`transition-all duration-300 ${settings.muteEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mute Style</p>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.muteMode === 'silent' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="muteMode" className="hidden" checked={settings.muteMode === 'silent'} onChange={() => {setSettings(p => ({...p, muteMode: 'silent'})); setSaved(false);}} />
                <VolumeX className={`w-5 h-5 ${settings.muteMode === 'silent' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className={`font-bold text-sm ${settings.muteMode === 'silent' ? 'text-rose-700' : 'text-slate-600'}`}>Strict Silent</span>
              </label>
              
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.muteMode === 'vibrate_simulated' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="muteMode" className="hidden" checked={settings.muteMode === 'vibrate_simulated'} onChange={() => {setSettings(p => ({...p, muteMode: 'vibrate_simulated'})); setSaved(false);}} />
                <Vibrate className={`w-5 h-5 ${settings.muteMode === 'vibrate_simulated' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`font-bold text-sm ${settings.muteMode === 'vibrate_simulated' ? 'text-indigo-700' : 'text-slate-600'}`}>Visual Only (No Sound)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={saveSettings}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            {saved ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Save className="w-5 h-5" />}
            {saved ? 'Preferences Saved' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;