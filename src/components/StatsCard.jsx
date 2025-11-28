import React from 'react';

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

export default StatsCard;