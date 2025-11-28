import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  IndianRupee, 
  BookOpen, 
  Settings, 
  Trash2, 
  Edit2, 
  Search, 
  TrendingUp, 
  Filter,
  Save,
  X,
  Copy,
  Moon,
  Sun,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Lock,
  User
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

/* ==========================================
  🚀 YOUR FIREBASE CONFIGURATION
  ==========================================
*/
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC14UtaGopZtOtQUQP5iRma9oqGV21wETg",
  authDomain: "tutortrack-b7360.firebaseapp.com",
  projectId: "tutortrack-b7360",
  storageBucket: "tutortrack-b7360.firebasestorage.app",
  messagingSenderId: "379989040306",
  appId: "1:379989040306:web:a8c7f0792ee96ca4d7fdab",
  measurementId: "G-LEP4DH0V0F"
};

/* --- INITIALIZATION LOGIC --- */
const firebaseConfig = YOUR_FIREBASE_CONFIG;
const appId = 'tutor-track-v1'; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* --- UTILITY FUNCTIONS --- */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startDate = new Date(0, 0, 0, startH, startM, 0);
  const endDate = new Date(0, 0, 0, endH, endM, 0);
  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0; // Invalid time range
  return diff / 1000 / 60 / 60; // Hours
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

/* --- COMPONENTS --- */

// 1. Stats Card
const StatsCard = ({ title, value, subtext, icon: Icon, colorClass, darkColorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between hover:shadow-md transition-all duration-300">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass} ${darkColorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

// 2. Simple Bar Chart
const EarningsChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.amount), 100); 
  
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
        <TrendingUp size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" />
        Weekly Overview
      </h3>
      <div className="flex items-end justify-between h-40 gap-2 overflow-x-auto pb-2">
        {data.map((day, idx) => {
          const heightPercent = (day.amount / maxVal) * 100;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 group min-w-[30px]">
               <div className="relative w-full flex justify-center h-full items-end">
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-8 text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 border border-slate-700 dark:border-slate-600">
                    ₹{day.amount}
                  </span>
                  <div 
                    className="w-full max-w-[24px] bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-500 dark:hover:bg-indigo-500 rounded-t-md transition-all duration-500 ease-out"
                    style={{ height: `${Math.max(heightPercent, 5)}%` }} 
                  ></div>
               </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Modal
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

/* --- LOGIN COMPONENT --- */
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('23106031');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = `${username}@tutortrack.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid username or password.');
      } else {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm mb-4">
             <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-indigo-100 mt-2 text-sm">Sign in to manage your teaching sessions</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-base"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-base"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-400 text-center">
        TutorTrack v2.0 • Secured by Firebase
      </p>
    </div>
  );
};

/* --- MAIN APP COMPONENT --- */

export default function App() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [rates, setRates] = useState({ morning: 150, evening: 200, default: 150 });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // UI State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const initialSessionState = {
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    batchType: 'Evening',
    rate: 0,
    subject: '',
    chapter: '',
    pages: '',
    notes: ''
  };
  const [currentSession, setCurrentSession] = useState(initialSessionState);
  const [editingId, setEditingId] = useState(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false); // Stop loading if not logged in so we show LoginScreen
      }
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const ratesRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'rates');
    const unsubRates = onSnapshot(ratesRef, (docSnap) => {
      setDbError(null);
      if (docSnap.exists()) {
        setRates(docSnap.data());
      } else {
        setDoc(ratesRef, { morning: 150, evening: 200, default: 150 });
      }
    }, (err) => {
      console.error(err);
      if (err.code === 'permission-denied') setDbError('permission-denied');
    });

    const sessionsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sessions');
    const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
      setDbError(null);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        if (b.date !== a.date) return new Date(b.date) - new Date(a.date);
        return b.startTime.localeCompare(a.startTime);
      });
      setSessions(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      if (err.code === 'permission-denied') setDbError('permission-denied');
      setLoading(false);
    });

    return () => {
      unsubRates();
      unsubSessions();
    };
  }, [user]);

  /* --- HANDLERS --- */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSessions([]); // Clear local data
    } catch(err) {
      console.error("Logout failed", err);
    }
  };

  const handleOpenAddSession = () => {
    setEditingId(null);
    const currentHour = new Date().getHours();
    const suggestedBatch = currentHour < 12 ? 'Morning' : 'Evening';
    const suggestedRate = suggestedBatch === 'Morning' ? rates.morning : rates.evening;

    setCurrentSession({
      ...initialSessionState,
      batchType: suggestedBatch,
      rate: suggestedRate
    });
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (session) => {
    setEditingId(session.id);
    setCurrentSession(session);
    setIsSessionModalOpen(true);
  };

  const handleDuplicateSession = (session) => {
    const { id, timestamp, ...dataToCopy } = session;
    setEditingId(null); 
    setCurrentSession({
        ...dataToCopy,
        date: new Date().toISOString().split('T')[0]
    });
    setIsSessionModalOpen(true);
  }

  const handleDeleteSession = async (id) => {
    if(!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', id));
    } catch (err) {
      console.error("Error deleting", err);
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!user) return;

    const duration = calculateDuration(currentSession.startTime, currentSession.endTime);
    if (duration <= 0) {
      alert("Please check start and end times. End time must be after start time.");
      return;
    }

    const earnings = duration * currentSession.rate;
    const payload = {
      ...currentSession,
      duration,
      earnings,
      timestamp: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', editingId), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions'), payload);
      }
      setIsSessionModalOpen(false);
    } catch (err) {
      console.error("Error saving session", err);
    }
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'rates'), rates);
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error("Error saving rates", err);
    }
  };

  useEffect(() => {
    if (isSessionModalOpen && !editingId) {
      if (currentSession.batchType === 'Morning') setCurrentSession(s => ({ ...s, rate: rates.morning }));
      if (currentSession.batchType === 'Evening') setCurrentSession(s => ({ ...s, rate: rates.evening }));
      if (currentSession.batchType === 'Custom') setCurrentSession(s => ({ ...s, rate: rates.default }));
    }
  }, [currentSession.batchType, rates, isSessionModalOpen, editingId]);


  /* --- CALCULATIONS & STATS --- */
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    let todayEarned = 0, todayHours = 0;
    let weekEarned = 0;
    let monthEarned = 0, monthHours = 0;

    sessions.forEach(s => {
      const sDate = s.date;
      const sObj = new Date(sDate);
      
      if (sDate === today) {
        todayEarned += s.earnings;
        todayHours += s.duration;
      }
      if (sObj >= startOfWeek) {
        weekEarned += s.earnings;
      }
      if (sObj >= startOfMonth && sObj.getMonth() === startOfMonth.getMonth()) {
        monthEarned += s.earnings;
        monthHours += s.duration;
      }
    });

    return { todayEarned, todayHours, weekEarned, monthEarned, monthHours };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
      
      const amount = sessions
        .filter(s => s.date === dateStr)
        .reduce((acc, curr) => acc + curr.earnings, 0);
        
      days.push({ label: dayLabel, amount });
    }
    return days;
  }, [sessions]);

  const filteredSessions = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.subject.toLowerCase().includes(q) ||
      s.chapter.toLowerCase().includes(q) ||
      s.batchType.toLowerCase().includes(q) || 
      s.date.includes(q)
    );
  });

  /* --- RENDER --- */
  
  if (!user) {
    return <LoginScreen />;
  }

  // Permission Error Screen
  if (dbError === 'permission-denied') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
            <AlertTriangle size={32} />
            <h2 className="text-2xl font-bold">Access Denied</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            The security rules are blocking your access. Ensure you have updated the Firestore Rules in the Firebase Console as instructed.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-indigo-600">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse">Loading Your Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-20 md:pb-0 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <BookOpen size={20} />
            </div>
            {/* Optimized for mobile: Visible now, just responsive text size */}
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 block">
              TutorTrack
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
             <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Rates Settings"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={handleOpenAddSession}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-all shadow-md shadow-indigo-200 dark:shadow-none active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Log Session</span>
              <span className="sm:hidden text-sm">Log</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs (Mobile friendly) */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Dashboard
            {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            All Sessions
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard 
                title="Today's Earnings" 
                value={formatCurrency(stats.todayEarned)} 
                subtext={`${stats.todayHours.toFixed(1)} hrs taught`}
                icon={IndianRupee}
                colorClass="bg-green-100 text-green-600"
                darkColorClass="dark:bg-green-900/30 dark:text-green-400"
              />
               <StatsCard 
                title="This Week" 
                value={formatCurrency(stats.weekEarned)} 
                subtext="Last 7 days"
                icon={Calendar}
                colorClass="bg-blue-100 text-blue-600"
                darkColorClass="dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatsCard 
                title="This Month" 
                value={formatCurrency(stats.monthEarned)} 
                subtext={`${stats.monthHours.toFixed(1)} hrs total`}
                icon={TrendingUp}
                colorClass="bg-violet-100 text-violet-600"
                darkColorClass="dark:bg-violet-900/30 dark:text-violet-400"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2">
                <EarningsChart data={weeklyChartData} />
              </div>

              {/* Recent Activity List */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Recent Sessions</h3>
                  <button onClick={() => setActiveTab('history')} className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">View All</button>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No sessions logged yet.</p>
                  ) : (
                    sessions.slice(0, 5).map(session => (
                      <div key={session.id} onClick={() => handleEditSession(session)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{session.subject || 'No Subject'}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(session.date)} • {session.batchType}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(session.earnings)}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{session.duration.toFixed(1)}h</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search subject, chapter, or date..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
               {filteredSessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Filter size={48} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                    <p>No sessions found matching your search.</p>
                  </div>
               ) : (
                 <div className="divide-y divide-slate-100 dark:divide-slate-700">
                   {filteredSessions.map(session => (
                     <div key={session.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                              {session.batchType}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{session.date}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{session.subject || 'Untitled Session'}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                             {session.chapter && <span className="flex items-center gap-1"><BookOpen size={12}/> {session.chapter}</span>}
                             {session.pages && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-xs text-slate-600 dark:text-slate-300">pg {session.pages}</span>}
                          </p>
                          {session.notes && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic line-clamp-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">"{session.notes}"</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[200px]">
                           <div className="text-right">
                              <div className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(session.earnings)}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {session.startTime} - {session.endTime} ({session.duration.toFixed(1)}h)
                              </div>
                           </div>
                           <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDuplicateSession(session)} className="p-3 sm:p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg active:scale-95 transition-transform" title="Duplicate">
                                <Copy size={20} />
                              </button>
                              <button onClick={() => handleEditSession(session)} className="p-3 sm:p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg active:scale-95 transition-transform" title="Edit">
                                <Edit2 size={20} />
                              </button>
                              <button onClick={() => handleDeleteSession(session.id)} className="p-3 sm:p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg active:scale-95 transition-transform" title="Delete">
                                <Trash2 size={20} />
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Add/Edit Session Modal */}
      <Modal 
        isOpen={isSessionModalOpen} 
        onClose={() => setIsSessionModalOpen(false)} 
        title={editingId ? "Edit Session" : "Log New Session"}
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date</label>
              <input 
                required
                type="date" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                value={currentSession.date}
                onChange={e => setCurrentSession({...currentSession, date: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Batch</label>
              <select 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                value={currentSession.batchType}
                onChange={e => setCurrentSession({...currentSession, batchType: e.target.value})}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
              <input 
                required
                type="time" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                value={currentSession.startTime}
                onChange={e => setCurrentSession({...currentSession, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">End Time</label>
              <input 
                required
                type="time" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                value={currentSession.endTime}
                onChange={e => setCurrentSession({...currentSession, endTime: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
            <div>
              <label className="block text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1">Rate (₹/hr)</label>
              <input 
                type="number" 
                className="w-24 p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded text-sm focus:outline-none dark:text-white text-base"
                value={currentSession.rate}
                onChange={e => setCurrentSession({...currentSession, rate: parseFloat(e.target.value)})}
              />
            </div>
            <div className="text-right">
              <span className="block text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide">Estimated</span>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {formatCurrency(calculateDuration(currentSession.startTime, currentSession.endTime) * currentSession.rate)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
             <div className="mb-3">
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Subject</label>
               <input 
                 type="text" 
                 placeholder="e.g. Mathematics"
                 className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                 value={currentSession.subject}
                 onChange={e => setCurrentSession({...currentSession, subject: e.target.value})}
               />
             </div>
             <div className="grid grid-cols-2 gap-4 mb-3">
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Chapter</label>
                 <input 
                   type="text" 
                   placeholder="e.g. Algebra"
                   className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                   value={currentSession.chapter}
                   onChange={e => setCurrentSession({...currentSession, chapter: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Page Numbers</label>
                 <input 
                   type="text" 
                   placeholder="e.g. 12-24"
                   className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
                   value={currentSession.pages}
                   onChange={e => setCurrentSession({...currentSession, pages: e.target.value})}
                 />
               </div>
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes</label>
               <textarea 
                 rows="2"
                 placeholder="Topics covered, student progress..."
                 className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none dark:text-white transition-colors text-base"
                 value={currentSession.notes}
                 onChange={e => setCurrentSession({...currentSession, notes: e.target.value})}
               />
             </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
          >
            <Save size={20} />
            Save Session
          </button>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        title="Rate Settings"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Set your default hourly rates here. Changing these will only apply to future sessions.</p>
        <form onSubmit={handleUpdateRates} className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors">
            <span className="font-medium text-slate-700 dark:text-slate-200">Morning Rate (₹/hr)</span>
            <input 
              type="number" 
              className="w-24 p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-right bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-base"
              value={rates.morning}
              onChange={e => setRates({...rates, morning: parseFloat(e.target.value)})}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors">
            <span className="font-medium text-slate-700 dark:text-slate-200">Evening Rate (₹/hr)</span>
            <input 
              type="number" 
              className="w-24 p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-right bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-base"
              value={rates.evening}
              onChange={e => setRates({...rates, evening: parseFloat(e.target.value)})}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors">
            <span className="font-medium text-slate-700 dark:text-slate-200">Custom/Default (₹/hr)</span>
            <input 
              type="number" 
              className="w-24 p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-right bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-base"
              value={rates.default}
              onChange={e => setRates({...rates, default: parseFloat(e.target.value)})}
            />
          </div>
          <button 
            type="submit" 
            className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold transition-all active:scale-95 text-base"
          >
            Update Rates
          </button>
        </form>
      </Modal>

    </div>
  );
}