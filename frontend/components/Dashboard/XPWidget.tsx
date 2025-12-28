import React from 'react';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const XPWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 transform rotate-3 group-hover:rotate-6 transition-transform">
            <Trophy className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-3xl font-bold text-slate-800 mb-1">2,400 XP</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">You're in the top 10% this week!</p>
        
        <div className="grid grid-cols-2 gap-3 w-full">
            <button className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Redeem
            </button>
            <button className="w-full py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold shadow-md shadow-green-500/20 hover:shadow-lg transition-all">
                Collect
            </button>
        </div>
      </div>
    </div>
  );
};