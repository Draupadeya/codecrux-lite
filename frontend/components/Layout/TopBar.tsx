import React from 'react';
import { Search, Bell, Menu, Moon, ChevronDown } from 'lucide-react';
import { User } from '../../types';

interface TopBarProps {
  onMenuClick: () => void;
  currentUser?: User;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, currentUser }) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="hidden sm:flex items-center relative group">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search for courses, skills, or videos..."
            className="w-64 lg:w-96 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative border border-transparent hover:border-slate-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

        <button className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
            </div>
            <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">{currentUser?.name || 'Alex Johnson'}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Student</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
        </button>
      </div>
    </header>
  );
};