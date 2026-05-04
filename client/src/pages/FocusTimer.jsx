import React, { useState, useEffect, useRef } from 'react';
import { Target, Coffee, Play, Pause, RotateCcw, Volume2, VolumeX, X, Music } from 'lucide-react';

// FIX: Replaced broken links with verified, permanent Google Action Ambiences and CORS-free Music CDNs
const FOCUS_MODES = [
  { 
    id: 'calm', 
    name: 'Calm Breeze', 
    color: 'from-blue-400 to-indigo-600', 
    // Mixed: Field/Crop wind ambience + Bird chirping
    audio: [
      'https://actions.google.com/sounds/v1/ambiences/outdoor_summer_ambience.ogg',
      'https://actions.google.com/sounds/v1/animals/birds_in_forest.ogg'
    ] 
  },
  { 
    id: 'rain', 
    name: 'Rainy Vibe', 
    color: 'from-slate-600 to-slate-900', 
    // Single: Continuous heavy rain
    audio: [
      'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg'
    ] 
  },
  { 
    id: 'thunder', 
    name: 'Thunderstorm', 
    color: 'from-gray-700 to-black', 
    // Mixed: Continuous rain + Thunder strikes
    audio: [
      'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
      'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg'
    ] 
  },
  { 
    id: 'spring', 
    name: 'Spring Focus', 
    color: 'from-emerald-400 to-green-700', 
    // Single: Happy, mindful, focused background music (Reliable CORS-free server)
    audio: [
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
    ] 
  },
  { 
    id: 'night', 
    name: 'Campfire Night', 
    color: 'from-indigo-900 to-purple-900', 
    // Mixed: Quiet night crickets + Fire burning + Far night-bird (Owl)
    audio: [
      'https://actions.google.com/sounds/v1/animals/crickets_and_insects.ogg',
      'https://actions.google.com/sounds/v1/ambiences/fire.ogg',
      'https://actions.google.com/sounds/v1/animals/owl_hoot.ogg'
    ] 
  }
];

const FocusTimer = ({ task, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); 
  const [activeBgm, setActiveBgm] = useState(FOCUS_MODES[0]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      const isWork = timerMode === 'work';
      alert(isWork ? "Pomodoro complete! Time for a short break." : "Break is over! Let's get back to work.");
      setTimerMode(isWork ? 'break' : 'work');
      setTimeLeft(isWork ? 5 * 60 : 25 * 60);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  useEffect(() => {
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.loop = true;
        // Keep volume soft for focus
        audio.volume = 0.4; 
        if (isRunning && !isMuted) {
          audio.play().catch(e => console.log("Audio play blocked until user interacts", e));
        } else {
          audio.pause();
        }
      }
    });
  }, [isRunning, isMuted, activeBgm]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMode = () => {
    const newMode = timerMode === 'work' ? 'break' : 'work';
    setTimerMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    setIsRunning(false);
  };

  const renderVisuals = () => {
    switch (activeBgm.id) {
      case 'rain':
      case 'thunder':
        return Array.from({ length: 30 }).map((_, i) => (
          <div key={`rain-${i}`} className="rain-drop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random()}s` }} />
        ));
      case 'night':
        return (
          <>
            {Array.from({ length: 40 }).map((_, i) => <div key={`star-${i}`} className="star" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`, animationDuration: `${1 + Math.random() * 3}s`, animationDelay: `${Math.random()}s` }} />)}
            {Array.from({ length: 15 }).map((_, i) => <div key={`ember-${i}`} className="fire-ember" style={{ left: `${20 + Math.random() * 60}%`, animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random() * 2}s` }} />)}
          </>
        );
      case 'calm':
        return Array.from({ length: 20 }).map((_, i) => (
          <div key={`crop-${i}`} className="crop-leaf" style={{ left: `${Math.random() * 100}%`, animationDuration: `${3 + Math.random() * 4}s`, animationDelay: `${Math.random() * 2}s` }} />
        ));
      case 'spring':
      default:
        return <div className="spring-glow" />;
    }
  };

  return (
    <div id="focus-timer-section" className={`relative rounded-2xl p-6 mb-8 text-white shadow-2xl overflow-hidden transition-all duration-700 bg-gradient-to-br ${activeBgm.color} ${activeBgm.id === 'thunder' ? 'thunder-flash' : ''}`}>
      
      {/* Visual Effects Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-70">
        {renderVisuals()}
      </div>

      {/* Renders all audio tracks synchronously for the mix */}
      {activeBgm.audio.map((src, index) => (
        <audio 
          key={src} 
          ref={el => {
             if (el) audioRefs.current[index] = el;
          }} 
          src={src} 
        />
      ))}

      {/* Internal Custom CSS for Visual Animations */}
      <style>{`
        .rain-drop { position: absolute; top: -20px; width: 2px; height: 15px; background: rgba(255,255,255,0.4); animation: fall linear infinite; }
        .star { position: absolute; width: 3px; height: 3px; background: rgba(255,255,255,0.8); border-radius: 50%; animation: twinkle ease-in-out infinite alternate; }
        .fire-ember { position: absolute; bottom: -10px; width: 6px; height: 6px; background: #ff9d00; border-radius: 50%; filter: blur(1px); animation: rise linear infinite; }
        .crop-leaf { position: absolute; top: -20px; width: 8px; height: 12px; background: rgba(255, 255, 255, 0.3); border-radius: 50% 0 50% 0; animation: blow-across linear infinite; }
        .spring-glow { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%); animation: pulse-glow 5s ease-in-out infinite alternate; }
        .thunder-flash { animation: lightning 9s infinite; }
        
        @keyframes fall { to { transform: translateY(250px); opacity: 0; } }
        @keyframes twinkle { from { opacity: 0.2; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
        @keyframes rise { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-150px) scale(0); opacity: 0; } }
        @keyframes blow-across { 0% { transform: translate(0, 0) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(150px, 200px) rotate(360deg); opacity: 0; } }
        @keyframes pulse-glow { from { opacity: 0.5; transform: scale(0.95); } to { opacity: 1; transform: scale(1.05); } }
        @keyframes lightning { 0%, 93%, 98%, 100% { filter: brightness(1); } 94%, 99% { filter: brightness(2.8); } }
      `}</style>

      {/* Header Controls */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 drop-shadow-md">
            {timerMode === 'work' ? <Target className="w-5 h-5"/> : <Coffee className="w-5 h-5"/>} 
            {timerMode === 'work' ? 'Deep Focus Mode' : 'Break Time'}
          </h3>
          <p className="text-white/90 mt-1 text-sm font-medium drop-shadow">
            Working on: <span className="font-bold text-white tracking-wide">{task.title}</span>
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-black/20 rounded-xl px-2 py-1 backdrop-blur-md border border-white/10">
            <Music className="w-4 h-4 text-white/70" />
            <select 
              className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer appearance-none pr-4"
              value={activeBgm.id}
              onChange={(e) => {
                const mode = FOCUS_MODES.find(m => m.id === e.target.value);
                setActiveBgm(mode);
              }}
            >
              {FOCUS_MODES.map(mode => <option key={mode.id} value={mode.id} className="text-black">{mode.name}</option>)}
            </select>
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/20 rounded-md transition-colors ml-1">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-300"/> : <Volume2 className="w-4 h-4"/>}
            </button>
          </div>
          
          <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-xl backdrop-blur-md transition-colors border border-white/10">
            <X className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-black/20 px-8 py-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
        <div className="text-6xl font-mono font-bold tracking-wider tabular-nums drop-shadow-lg">
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsRunning(!isRunning)} className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors shadow-lg">
            {isRunning ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6 pl-1"/>}
          </button>
          <button onClick={() => { setIsRunning(false); setTimeLeft(timerMode === 'work' ? 25*60 : 5*60); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title="Reset Timer">
            <RotateCcw className="w-6 h-6 text-white/80"/>
          </button>
          <button onClick={toggleMode} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors" title={timerMode === 'work' ? "Switch to Break" : "Switch to Work"}>
            {timerMode === 'work' ? <Coffee className="w-6 h-6 text-white/80"/> : <Target className="w-6 h-6 text-white/80"/>}
          </button>
        </div>
      </div>

    </div>
  );
};

export default FocusTimer;