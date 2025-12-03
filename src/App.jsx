import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar, IndianRupee, BookOpen, Settings, 
  Trash2, Edit2, Search, TrendingUp, Filter, Copy, 
  Moon, Sun, AlertTriangle, LogOut 
} from 'lucide-react';
import { onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, setDoc 
} from 'firebase/firestore';

/* --- LOCAL IMPORTS --- */
import { auth, db, appId } from './firebase';
import { formatCurrency, calculateDuration, formatDate } from './utils';

import LoginScreen from './components/LoginScreen';
import StatsCard from './components/StatsCard';
import EarningsChart from './components/EarningsChart';
import Modal from './components/Modal';
import SessionForm from './components/SessionForm';
import RateSettings from './components/RateSettings';
import ReportGenerator from './components/ReportGenerator';

export default function App() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [rates, setRates] = useState({ morning: 150, evening: 200, default: 150 });
  
  // New state specifically to track if we are checking authentication
  const [authLoading, setAuthLoading] = useState(true); 
  const [dataLoading, setDataLoading] = useState(false);
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
    // Attempt to sign in with environment token if available
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // If no token, we just wait for onAuthStateChanged to pick up existing session
          // or we can sign in anonymously if that's your fallback
           // await signInAnonymously(auth); 
        }
      } catch (error) {
        console.error("Auth init error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Crucial: We only stop "authLoading" once Firebase tells us the status
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    setDataLoading(true);

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
      setDataLoading(false);
    }, (err) => {
      console.error(err);
      if (err.code === 'permission-denied') setDbError('permission-denied');
      setDataLoading(false);
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
      setSessions([]); 
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
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); 
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
  
  // FIX: Check authLoading FIRST. 
  // This prevents the LoginScreen from "flashing" while we are waiting for Firebase to verify the session.
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-indigo-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="font-medium animate-pulse">
            {authLoading ? "Verifying..." : "Loading Your Dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Only show LoginScreen if we are sure auth check is done AND there is no user
  if (!user) {
    return <LoginScreen />;
  }

  if (dbError === 'permission-denied') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
            <AlertTriangle size={32} />
            <h2 className="text-2xl font-bold">Access Denied</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            The security rules are blocking your access. Ensure you have updated the Firestore Rules.
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-20 md:pb-0 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <BookOpen size={20} />
            </div>
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
        
        {/* Navigation Tabs */}
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
          <button 
            onClick={() => setActiveTab('reports')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Reports
            {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
        </div>

        {/* --- VIEW: DASHBOARD --- */}
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

        {/* --- VIEW: ALL SESSIONS --- */}
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

        {/* --- VIEW: REPORTS --- */}
        {activeTab === 'reports' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <ReportGenerator sessions={sessions} />
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
        <SessionForm 
          currentSession={currentSession} 
          setCurrentSession={setCurrentSession} 
          handleSaveSession={handleSaveSession} 
        />
      </Modal>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        title="Settings"
      >
        <RateSettings 
          rates={rates} 
          setRates={setRates} 
          handleUpdateRates={handleUpdateRates} 
          user={user}
        />
      </Modal>

    </div>
  );
}