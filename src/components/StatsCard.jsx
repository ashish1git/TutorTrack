import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatsCard = ({ title, value, subtext, icon: Icon, colorClass, darkColorClass }) => (
  <div className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    
    {/* Decorative background blob that matches the icon color */}
    <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-150 ${colorClass} ${darkColorClass}`}></div>
    
    <div className="relative z-10 flex items-start justify-between">
      <div className="flex flex-col">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">
          {value}
        </h3>
        
        {subtext && (
          <div className="inline-flex items-center gap-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-opacity-10 dark:bg-opacity-20 ${colorClass.replace('bg-', 'text-').replace('text-white', '')} ${colorClass.replace('text-white', 'bg-')}`}>
              <ArrowUpRight size={10} />
              {subtext}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
          </div>
        )}
      </div>
      
      {/* Icon Container with Glassmorphism-like feel */}
      <div className={`p-3.5 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none text-white transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${colorClass} ${darkColorClass}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  </div>
);

export default StatsCard;