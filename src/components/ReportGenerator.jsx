import React, { useState, useMemo } from 'react';
import { Share2, Printer, FileText, Calendar, Clock, BookOpen, Hash, StickyNote, Eye, EyeOff, Type } from 'lucide-react';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to format time (e.g., 14:00 to 2:00 PM)
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Helper to format date as dd-mm-yy
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const ReportGenerator = ({ sessions }) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [tutorName, setTutorName] = useState('Ashish'); 
  
  // View Settings State
  const [showNotes, setShowNotes] = useState(true);
  const [tableTextSize, setTableTextSize] = useState('text-xs'); // Options: text-sm, text-xs, text-[10px]

  // Filter sessions based on range
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => s.date >= startDate && s.date <= endDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
  }, [sessions, startDate, endDate]);

  // Group sessions by Batch
  const groupedSessions = useMemo(() => {
    const groups = { Morning: [], Evening: [], Custom: [] };
    filteredSessions.forEach(session => {
      const type = session.batchType || 'Custom';
      if (!groups[type]) groups[type] = [];
      groups[type].push(session);
    });
    return groups;
  }, [filteredSessions]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSessions.reduce((acc, s) => ({
      earnings: acc.earnings + (s.earnings || 0),
      hours: acc.hours + (s.duration || 0),
      count: acc.count + 1
    }), { earnings: 0, hours: 0, count: 0 });
  }, [filteredSessions]);

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
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 7);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleShare = async () => {
    let text = `📅 *TutorTrack Report*\n`;
    if (tutorName) text += `👤 Tutor: ${tutorName}\n`; 
    text += `(${formatDate(startDate)} to ${formatDate(endDate)})\n\n`;
    text += `💰 Total Earnings: ${formatCurrency(totals.earnings)}\n`;
    text += `⏱ Total Hours: ${totals.hours.toFixed(1)} hrs\n`;
    text += `📚 Total Sessions: ${totals.count}\n\n`;
    
    // Simplified list for text sharing (PDF is for details)
    filteredSessions.forEach(s => {
      text += `• ${formatDate(s.date)}: ${s.subject || 'Session'} - ${formatCurrency(s.earnings || 0)}\n`;
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Teaching Report', text: text });
      } catch (err) { console.log('Share dismissed'); }
    } else {
      navigator.clipboard.writeText(text);
      alert('Report summary copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSessionTable = (sessions, title) => {
    if (!sessions || sessions.length === 0) return null;
    
    // Calculate subtotal for this batch
    const subtotal = sessions.reduce((acc, s) => acc + (s.earnings || 0), 0);
    const hoursTotal = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    return (
      <div className="mb-6 break-inside-avoid">
        <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5 border-b-2 border-indigo-100 dark:border-indigo-900/50 pb-1 flex justify-between items-end">
          <span>{title} Batch</span>
          <span className="text-[10px] text-slate-400 font-normal normal-case">{sessions.length} sessions</span>
        </h4>
        <table className={`w-full text-left border-collapse ${tableTextSize}`}>
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 uppercase tracking-wider font-bold text-[0.9em]">
              <th className="p-2 border border-slate-200 dark:border-slate-600 w-24">Date</th>
              <th className="p-2 border border-slate-200 dark:border-slate-600 w-32">Time Info</th>
              <th className="p-2 border border-slate-200 dark:border-slate-600 w-1/3">Topic & Details</th>
              {showNotes && <th className="p-2 border border-slate-200 dark:border-slate-600">Notes</th>}
              <th className="p-2 border border-slate-200 dark:border-slate-600 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            {sessions.map((s, index) => (
              <tr key={s.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700/20'} print:bg-white`}>
                <td className="p-2 border border-slate-200 dark:border-slate-700 align-top font-bold whitespace-nowrap">
                  {formatDate(s.date)}
                </td>
                <td className="p-2 border border-slate-200 dark:border-slate-700 align-top">
                   <div className="flex flex-col gap-0.5 text-[0.95em]">
                     <span className="flex items-center gap-1.5 whitespace-nowrap">
                       <Clock size={10} className="text-slate-400"/> {formatTime(s.startTime)} - {formatTime(s.endTime)}
                     </span>
                     <span className="font-semibold text-indigo-600 dark:text-indigo-400 pl-4">
                       {s.duration ? s.duration.toFixed(2) : 0} hrs
                     </span>
                   </div>
                </td>
                <td className="p-2 border border-slate-200 dark:border-slate-700 align-top">
                  <div className="font-bold text-slate-900 dark:text-white mb-1 leading-tight">{s.subject || '—'}</div>
                  <div className="flex flex-wrap gap-1.5 text-[0.85em] text-slate-500 dark:text-slate-400">
                    {/* Updated Tags for Visibility */}
                    {s.chapter && (
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded print:bg-white print:text-black print:border-slate-400 tag-badge">
                        <BookOpen size={9} /> {s.chapter}
                      </span>
                    )}
                    {s.pages && (
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded print:bg-white print:text-black print:border-slate-400 tag-badge">
                        <Hash size={9} /> {s.pages}
                      </span>
                    )}
                  </div>
                </td>
                {showNotes && (
                  <td className="p-2 border border-slate-200 dark:border-slate-700 align-top">
                    {s.notes ? (
                      <div className="text-[0.9em] italic text-slate-500 leading-snug flex items-start gap-1">
                        <StickyNote size={10} className="mt-0.5 shrink-0 opacity-50"/>
                        {s.notes}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[0.9em]">-</span>
                    )}
                  </td>
                )}
                <td className="p-2 border border-slate-200 dark:border-slate-700 align-top text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(s.earnings)}</div>
                  <div className="text-[0.8em] text-slate-400 mt-0.5">@ {s.rate}/hr</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 font-semibold text-[0.9em] print:bg-slate-50">
               <td colSpan="2" className="p-1.5 text-right text-slate-500 uppercase">Subtotal</td>
               <td className="p-1.5 text-slate-700 dark:text-slate-300">{hoursTotal.toFixed(2)} hrs</td>
               {showNotes && <td></td>}
               <td className="p-1.5 text-right text-slate-800 dark:text-white">{formatCurrency(subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Controls Section (Hidden in Print) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 print:hidden">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="text-indigo-600" size={20} /> Generate Earning Report
        </h3>
        
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tutor Name (Watermark & Signature)</label>
          <input 
            type="text" 
            placeholder="Enter your name" 
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* View Settings Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">View Options</label>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowNotes(!showNotes)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${showNotes ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'}`}
                    >
                        {showNotes ? <Eye size={14}/> : <EyeOff size={14}/>}
                        {showNotes ? 'Notes Visible' : 'Notes Hidden'}
                    </button>

                    <div className="flex items-center gap-2">
                         <Type size={14} className="text-slate-400"/>
                         <select 
                            value={tableTextSize} 
                            onChange={(e) => setTableTextSize(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                         >
                             <option value="text-sm">Normal Size</option>
                             <option value="text-xs">Compact (Default)</option>
                             <option value="text-[10px]">Tiny / Dense</option>
                         </select>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
           <button onClick={() => handleQuickSelect('thisMonth')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">This Month</button>
           <button onClick={() => handleQuickSelect('lastMonth')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">Last Month</button>
           <button onClick={() => handleQuickSelect('lastWeek')} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">Last 7 Days</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Report Card (This part gets printed) */}
      <div 
        id="printable-report" 
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden min-h-[500px]"
      >
        
        {/* WATERMARK LAYER */}
        {tutorName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] print:opacity-5 select-none print:fixed print:inset-0 print:flex print:items-center print:justify-center">
            <h1 className="text-[15vw] md:text-[80px] font-black text-slate-900 dark:text-white -rotate-45 whitespace-nowrap uppercase transform scale-125">
              {tutorName}
            </h1>
          </div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 dark:border-slate-200 pb-4 mb-4">
            {tutorName && <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wide">{tutorName}</h1>}
            <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Session Log & Earning Report</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-2">
              <span>{formatDate(startDate)}</span> 
              <span className="text-slate-300">—</span> 
              <span>{formatDate(endDate)}</span>
            </p>
          </div>

          {/* Summary Boxes */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Earnings</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(totals.earnings)}</p>
            </div>
            <div className="text-center p-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Hours</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{totals.hours.toFixed(1)}<span className="text-xs text-slate-400 ml-1">hrs</span></p>
            </div>
            <div className="text-center p-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Sessions</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{totals.count}</p>
            </div>
          </div>

          {/* Detailed Table Separated by Batch */}
          <div className="overflow-x-auto">
            {filteredSessions.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-xl">No teaching sessions found in this date range.</p>
            ) : (
              <div className="space-y-4">
                {renderSessionTable(groupedSessions.Morning, 'Morning')}
                {renderSessionTable(groupedSessions.Evening, 'Evening')}
                {renderSessionTable(groupedSessions.Custom, 'Custom / Other')}
              </div>
            )}
            
            {/* Grand Total Row at the very end */}
             {filteredSessions.length > 0 && (
                <div className="mt-6 pt-2 border-t-2 border-slate-800 dark:border-white flex justify-end items-center gap-6">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grand Total</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(totals.earnings)}</span>
                </div>
             )}
          </div>

          {/* Footer / Signature Area */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end print:flex break-inside-avoid">
             <div className="text-[9px] text-slate-400">
               Generated via TutorTrack • {new Date().toLocaleString()}
             </div>
             <div className="text-center min-w-[120px]">
               <div className="h-10 border-b border-slate-300 dark:border-slate-600 mb-1 flex items-end justify-center pb-1">
                 {tutorName && (
                   <span className="font-serif italic text-lg text-slate-800 dark:text-white transform -rotate-2">
                     {tutorName}
                   </span>
                 )}
               </div>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Signature</p>
             </div>
          </div>

        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <button onClick={handleShare} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
          <Share2 size={18} /> Share Report
        </button>
        <button onClick={handlePrint} className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" title="Print / Save PDF">
          <Printer size={18} />
        </button>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          
          #printable-report {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            min-height: 100vh;
            padding: 1.5rem !important; /* Slightly tighter padding */
            border: 4px solid black !important; /* THE SOLID BLACK MARGIN/BORDER */
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          #printable-report * {
            visibility: visible;
            color: black !important; /* Ensure high contrast for text */
          }

          /* Explicitly remove dark backgrounds in print */
          #printable-report .bg-slate-800, 
          #printable-report .bg-slate-900,
          #printable-report .bg-slate-700,
          #printable-report .dark\\:bg-slate-800,
          #printable-report .dark\\:bg-slate-700\\/20 { 
            background-color: transparent !important; 
            color: black !important; 
          }
          
          /* Ensure headers are light gray, not dark */
          #printable-report thead tr { 
            background-color: #f1f5f9 !important; 
            color: black !important; 
          }
          
          #printable-report tbody tr {
             background-color: transparent !important;
             border-bottom: 1px solid #e2e8f0;
          }

          #printable-report tfoot tr {
             background-color: #f8fafc !important;
             color: black !important;
          }
          
          /* Fix badge visibility */
          #printable-report .tag-badge {
             border: 1px solid #cbd5e1 !important;
             background-color: white !important;
             color: black !important;
          }

          #printable-report .text-white { color: black !important; }
          #printable-report .border-slate-700, #printable-report .border-slate-600 { border-color: #cbd5e1 !important; }
          #printable-report .opacity-50 { opacity: 1 !important; }
          
          /* Signature style in print */
          #printable-report .font-serif {
            font-family: "Times New Roman", serif;
            font-style: italic;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;