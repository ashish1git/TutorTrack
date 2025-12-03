import React from "react";
import { TrendingUp } from "lucide-react";

/**
 * IMPROVED BAR CHART COMPONENT
 * -------------------------------------
 * ✓ Added animated bar growth
 * ✓ Added Y‑axis with labels for better understanding
 * ✓ Added grid lines
 * ✓ More spacing & visual clarity
 * ✓ FIXED: Bars now have a minimum visible height
 */

const EarningsChart = ({ data }) => {
  // Prevent division by zero and ensure chart looks good even with low data
  const maxVal = Math.max(...data.map((d) => d.amount), 100);
  const ySteps = 4; 
  const stepValue = Math.ceil(maxVal / ySteps);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors w-full">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
        <TrendingUp size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" />
        Weekly Earnings Overview
      </h3>

      <div className="flex w-full h-64">
        {/* Y‑AXIS LABELS */}
        <div className="flex flex-col justify-between items-end pr-4 text-xs text-slate-400 dark:text-slate-500 font-mono h-full pb-6 w-12 shrink-0">
          {Array.from({ length: ySteps + 1 }).map((_, i) => (
            <span key={i}>₹{Math.round(stepValue * (ySteps - i))}</span>
          ))}
        </div>

        {/* GRAPH AREA */}
        <div className="relative flex-1 flex flex-col h-full">
          
          {/* GRID LINES LAYER */}
          <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
            {Array.from({ length: ySteps + 1 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-full border-t border-dashed ${i === ySteps ? 'border-slate-300 dark:border-slate-600' : 'border-slate-100 dark:border-slate-700/50'}`}
              />
            ))}
          </div>

          {/* BARS LAYER */}
          <div className="relative flex items-end justify-between h-full pb-6 gap-2 sm:gap-4 z-10 pl-2">
            {data.map((day, idx) => {
              // Calculate percentage relative to max value
              const rawPercent = (day.amount / maxVal) * 100;
              
              // Ensure even small amounts are visible (min 2%), but 0 stays 0
              const heightPercent = day.amount > 0 ? Math.max(rawPercent, 2) : 0;

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group">
                  
                  {/* The Bar Container */}
                  <div className="relative w-full flex justify-center items-end h-full">
                    
                    {/* Tooltip (Hover) */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-20 pointer-events-none">
                       <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                         ₹{day.amount}
                       </div>
                       {/* Tooltip Arrow */}
                       <div className="w-2 h-2 bg-slate-800 dark:bg-white transform rotate-45 mx-auto -mt-1"></div>
                    </div>

                    {/* The Bar Itself */}
                    <div
                      className={`
                        w-full max-w-[30px] rounded-t-md transition-all duration-700 ease-out relative
                        ${day.amount > 0 
                          ? 'bg-indigo-200 dark:bg-indigo-900/50 hover:bg-indigo-500 dark:hover:bg-indigo-400 cursor-pointer' 
                          : 'bg-transparent h-px'
                        }
                      `}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Optional: Add a subtle shine effect for non-zero bars */}
                      {day.amount > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-md"></div>
                      )}
                    </div>
                  </div>

                  {/* X-Axis Label */}
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium uppercase tracking-wide">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsChart;