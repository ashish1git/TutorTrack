import React from 'react';
import { Save } from 'lucide-react';

// NOTE: In your local project, you should import these from '../utils'.
// For this online preview, we define them here to avoid import errors.
// import { formatCurrency, calculateDuration } from '../utils';

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

const SessionForm = ({ currentSession, setCurrentSession, handleSaveSession }) => {
  return (
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
           <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Lecture/Topics</label>
           <input 
             type="text" 
             placeholder="e.g. Gravitation "
             className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
             value={currentSession.subject}
             onChange={e => setCurrentSession({...currentSession, subject: e.target.value})}
           />
         </div>
         <div className="grid grid-cols-2 gap-4 mb-3">
           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Type</label>
             <input 
               type="text" 
               placeholder="e.g. Theory/Numerical"
               className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-colors text-base"
               value={currentSession.chapter}
               onChange={e => setCurrentSession({...currentSession, chapter: e.target.value})}
             />
           </div>
           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Page No:</label>
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
        Save Session 🫡
      </button>
    </form>
  );
};

export default SessionForm;