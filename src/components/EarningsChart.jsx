import React from 'react';
import { TrendingUp } from 'lucide-react';

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

export default EarningsChart;