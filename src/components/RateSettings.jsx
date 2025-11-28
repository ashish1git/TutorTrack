import React from 'react';

const RateSettings = ({ rates, setRates, handleUpdateRates }) => {
  return (
    <div>
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
    </div>
  );
};

export default RateSettings;