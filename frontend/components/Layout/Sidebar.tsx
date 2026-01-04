import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  Beaker, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { User as UserType } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  currentUser?: UserType;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentUser, onNavigate, currentPath }) => {
  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number; left: number } | null>(null);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'Analytics', icon: BarChart2, path: '/analytics' },
    { label: 'Practice Labs', icon: Beaker, path: '/lab' },
    { label: 'Exams', icon: FileText, path: '/exams' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Help Center', icon: HelpCircle, path: '/help' },
  ];

  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    // Only show tooltip if sidebar is collapsed (md screen and closed, or just closed if we allow mobile collapse later)
    // In current responsive logic: !isOpen on MD screens = collapsed.
    // On Mobile: !isOpen = hidden (so this event won't fire anyway).
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
        label,
        top: rect.top + rect.height / 2,
        left: rect.right + 12 // 12px gap
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <>
      <aside 
        className={`
          fixed left-0 top-0 h-full bg-[#1e1b4b] text-white z-30 transition-all duration-300 ease-in-out shadow-2xl border-r border-indigo-900/30
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-indigo-900/50">
              <div className={`flex items-center gap-3 transition-all duration-300 ${!isOpen ? 'md:justify-center lg:justify-start w-full' : ''}`}>
                  <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20 shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xl font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${!isOpen ? 'md:hidden lg:block' : ''}`}>
                      SparkLess
                  </span>
              </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
              <p className={`px-2 text-xs font-bold text-indigo-400/80 uppercase tracking-widest mb-4 transition-opacity duration-300 ${!isOpen ? 'md:hidden lg:block' : ''}`}>
                  Menu
              </p>
              
              {menuItems.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                      <button
                          key={item.label}
                          onClick={() => onNavigate(item.path)}
                          onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                          onMouseLeave={handleMouseLeave}
                          className={`
                              w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                              ${isActive 
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-white'
                              }
                              ${!isOpen ? 'md:justify-center lg:justify-start' : ''}
                          `}
                      >
                          <item.icon 
                              className={`
                                  w-5 h-5 transition-transform duration-300 shrink-0
                                  ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-white group-hover:scale-110'}
                              `} 
                          />
                          <span className={`whitespace-nowrap transition-opacity duration-300 ${!isOpen ? 'md:hidden lg:block' : ''}`}>
                              {item.label}
                          </span>
                      </button>
                  );
              })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-indigo-900/50 space-y-2">
            {bottomItems.map((item) => (
              <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-300 hover:bg-white/5 hover:text-white transition-all duration-200 group relative
                      ${!isOpen ? 'md:justify-center lg:justify-start' : ''}
                  `}
              >
                  <item.icon className="w-5 h-5 shrink-0 group-hover:text-white transition-colors" />
                  <span className={`whitespace-nowrap ${!isOpen ? 'md:hidden lg:block' : ''}`}>{item.label}</span>
              </button>
              ))}
              
              <button className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4 group
                  ${!isOpen ? 'md:justify-center lg:justify-start' : ''}
              `}>
                  <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className={`whitespace-nowrap ${!isOpen ? 'md:hidden lg:block' : ''}`}>Sign Out</span>
              </button>
          </div>
        </div>
      </aside>

      {/* Portal Tooltip */}
      {hoveredItem && !isOpen && createPortal(
        <div 
            className="fixed z-[9999] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-700 animate-fade-in pointer-events-none"
            style={{ 
              top: hoveredItem.top, 
              left: hoveredItem.left, 
              transform: 'translateY(-50%)' 
            }}
        >
            {hoveredItem.label}
            {/* Arrow */}
            <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-[5px] border-transparent border-r-slate-900"></div>
        </div>,
        document.body
      )}
    </>
  );
};