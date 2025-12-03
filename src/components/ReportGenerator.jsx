import React, { useState, useMemo } from 'react';
import { Share2, Printer, FileText, Calendar } from 'lucide-react';

// Helper to format currency inside this component
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const ReportGenerator = ({ sessions }) => {
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Filter sessions based on range
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.date >= startDate && s.date <= endDate);
  }, [sessions, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSessions.reduce((acc, s) => ({
      earnings: acc.earnings + s.earnings,
      hours: acc.hours + s.duration,
      count: acc.count + 1
    }), { earnings: 0, hours: 0, count: 0 });
  }, [filteredSessions]);

  // Quick Date Selectors
  const handleQuickSelect = (type) => {
    const now = new Date();
    let start, end;

    if (type === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (type === 'lastWeek') {
      // Last 7 days
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 7);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Share functionality (WhatsApp/Email)
  const handleShare = async () => {
    // Construct a nice text summary
    let text = `📅 *TutorTrack Report* -Ashish\n(${startDate} to ${endDate})\n\n`;
    text += `💰 Total Earnings: ${formatCurrency(totals.earnings)}\n`;
    text += `⏱ Total Hours: ${totals.hours.toFixed(1)} hrs\n`;
    text += `📚Total Sessions: ${totals.count}\n\n`;
    text += `*Session Details:*\n`;
    
    filteredSessions.forEach(s => {
      text += `• ${s.date}: ${s.subject || 'Session'} (${s.duration.toFixed(1)}h) - ${formatCurrency(s.earnings)}\n`;
    });

    // Use Native Share if available (Mobile), else Copy to Clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Teaching Report',
          text: text,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Report copied to clipboard! You can paste it in WhatsApp/Email.');
    }
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Controls Section (Hidden when printing) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="text-indigo-600" size={20} /> Generate Salary Report
        </h3>
        
        {/* Quick Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
           <button onClick={() => handleQuickSelect('thisMonth')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">This Month</button>
           <button onClick={() => handleQuickSelect('lastMonth')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">Last Month</button>
           <button onClick={() => handleQuickSelect('lastWeek')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">Last 7 Days</button>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>
      </div>

      {/* 2. The Report Card (Visible in Print) */}
      <div id="printable-report" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        {/* Report Header */}
        <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Teaching Summary</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-2">
            <Calendar size={14} />
            {startDate} <span className="text-slate-300">—</span> {endDate}
          </p>
        </div>

        {/* Big Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Earnings</p>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(totals.earnings)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Hours</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{totals.hours.toFixed(1)}h</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1"> Total Sessions</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{totals.count}</p>
          </div>
        </div>

        {/* Detailed List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Breakdown</h4>
          {filteredSessions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6 italic">No teaching sessions found in this date range.</p>
          ) : (
            filteredSessions.map(session => (
              <div key={session.id} className="flex justify-between items-start text-sm border-b border-slate-50 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">{session.subject || 'Session'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {session.date} • {session.duration.toFixed(1)} hrs • {session.batchType}
                  </div>
                  {session.notes && <div className="text-[10px] text-slate-400 mt-1 italic">Note: {session.notes}</div>}
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {formatCurrency(session.earnings)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Action Buttons (Hidden when printing) */}
      <div className="flex gap-3 print:hidden">
        <button 
          onClick={handleShare} 
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Share2 size={18} /> Share Report
        </button>
        <button 
          onClick={handlePrint} 
          className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          title="Print / Save PDF"
        >
          <Printer size={18} />
        </button>
      </div>

      {/* 4. Print Styles Injection */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
          /* Ensure text is black for printing */
          #printable-report p, #printable-report div, #printable-report h2 { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;