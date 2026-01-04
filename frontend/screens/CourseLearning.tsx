import React, { useState, useEffect } from 'react';
import { 
  Menu, Code2, FileText, Sparkles, Clock, ArrowLeft, ArrowRight, 
  AlertCircle, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, 
  Layout, X, ChevronLeft, ShieldCheck
} from 'lucide-react';
import { CurriculumSidebar } from '../components/Course/CurriculumSidebar';
import { VideoPlayer } from '../components/Course/VideoPlayer';
import { NotesEditor } from '../components/Course/NotesEditor';
import { AIAssistant } from '../components/Course/AIAssistant';
import { CodeEditor } from '../components/Lab/CodeEditor';
import { PreviewPane } from '../components/Lab/PreviewPane';
import { ProctoringWidget } from '../components/Course/ProctoringWidget';
import { Module } from '../types';

interface CourseLearningProps {
  onNavigate: (path: string) => void;
}

export const CourseLearningScreen: React.FC<CourseLearningProps> = ({ onNavigate }) => {
  const [currentModuleId, setCurrentModuleId] = useState('m2');
  const [activeTab, setActiveTab] = useState<'notes' | 'practice' | 'ai'>('notes');
  
  // Layout State
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); // Desktop default
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Timer State
  const INITIAL_TIME = 300; // 5 minutes
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  
  // Proctoring Alerts
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);

  // Practice Lab State
  const [codeJs, setCodeJs] = useState('console.log("Hello World");');

  // Handle mobile initial state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsRightPanelOpen(false); // Default closed on mobile
      } else {
        setIsRightPanelOpen(true); // Default open on desktop
      }
    };
    
    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock Data
  const modules: Module[] = [
    { id: 'm1', title: 'Course Introduction', day: 1, duration: '15 min', status: 'completed' },
    { id: 'm2', title: 'React Core Concepts', day: 2, duration: '45 min', status: 'current' },
    { id: 'm3', title: 'Advanced Hooks', day: 3, duration: '55 min', status: 'locked' },
    { id: 'm4', title: 'State Management', day: 4, duration: '60 min', status: 'locked' },
  ];

  const currentModule = modules.find(m => m.id === currentModuleId) || modules[0];
  const nextModule = modules[modules.findIndex(m => m.id === currentModuleId) + 1];
  const prevModule = modules[modules.findIndex(m => m.id === currentModuleId) - 1];

  useEffect(() => {
    if (timeLeft <= 0) {
        setIsTimerFinished(true);
        return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProctorAlert = (msg: string) => {
      setProctorAlert(msg);
      // Auto dismiss after 6 seconds
      setTimeout(() => setProctorAlert(null), 6000);
  };

  return (
    <div className="flex h-screen w-full bg-[#0F172A] overflow-hidden font-sans text-slate-100 selection:bg-indigo-500/30">
      
      {/* PROFESSIONAL ALERT OVERLAY */}
      {proctorAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-[90%] max-w-lg pointer-events-none">
            <div className="bg-red-500/90 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 border border-red-400/50 ring-1 ring-red-500/20">
                <div className="bg-white/20 p-2 rounded-full shrink-0 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs uppercase tracking-wider opacity-90 mb-0.5">Proctoring Alert</h4>
                    <p className="font-medium text-sm leading-tight truncate">{proctorAlert}</p>
                </div>
            </div>
        </div>
      )}

      {/* --- MOBILE HEADER (Visible < 1024px) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4 z-50 shadow-md">
          <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={() => onNavigate('/dashboard')} 
                className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Back to Dashboard"
              >
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module {modules.findIndex(m => m.id === currentModuleId) + 1}</span>
                  <span className="font-bold text-sm text-white truncate">{currentModule.title}</span>
              </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors"
          >
              <Menu className="w-5 h-5" />
          </button>
      </div>

      {/* --- MOBILE MENU DRAWER (Left Sidebar Content) --- */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-fade-in">
              <div className="absolute top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-white shadow-2xl animate-slide-right flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-900">Course Menu</h3>
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                     <CurriculumSidebar 
                        modules={modules} 
                        currentModuleId={currentModuleId} 
                        onSelectModule={(id) => { setCurrentModuleId(id); setIsMobileMenuOpen(false); }}
                        isCollapsed={false}
                        onToggleCollapse={() => {}}
                        className="border-none w-full h-full"
                     />
                  </div>
              </div>
          </div>
      )}
      
      {/* --- MAIN LAYOUT CONTAINER --- */}
      <div className="flex flex-1 w-full h-full pt-16 lg:pt-0 overflow-hidden relative">
        
        {/* 1. LEFT SIDEBAR (Desktop Only) */}
        <div className={`
            hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out relative z-30 shrink-0
            ${isLeftSidebarOpen ? 'w-80' : 'w-20'}
        `}>
             <CurriculumSidebar 
                modules={modules} 
                currentModuleId={currentModuleId} 
                onSelectModule={setCurrentModuleId}
                isCollapsed={!isLeftSidebarOpen}
                onToggleCollapse={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className="h-full"
             />
        </div>

        {/* 2. MIDDLE CONTENT AREA (Video + Header) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative z-0">
            
            {/* Desktop Header */}
            <header className="hidden lg:flex h-16 bg-[#0f172a] border-b border-slate-800 items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title={isLeftSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {isLeftSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>
                    
                    <div className="h-6 w-px bg-slate-700 mx-2"></div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onNavigate('/dashboard')} 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700 group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-xs font-bold">Dashboard</span>
                        </button>
                        <h1 className="font-semibold text-slate-300 text-sm ml-2">{currentModule.title}</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* Timer */}
                    <div className={`
                        flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all
                        ${isTimerFinished 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'}
                    `}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-bold text-sm">
                            {isTimerFinished ? "COMPLETED" : formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Nav Buttons */}
                    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button 
                            disabled={!prevModule}
                            onClick={() => prevModule && setCurrentModuleId(prevModule.id)}
                            className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-300"
                            title="Previous Module"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button 
                            disabled={!isTimerFinished || !nextModule}
                            onClick={() => nextModule && setCurrentModuleId(nextModule.id)}
                            className={`p-2 rounded-md transition-colors ${isTimerFinished && nextModule ? 'text-white hover:bg-indigo-600 bg-indigo-500 shadow-lg' : 'text-slate-500 disabled:opacity-50'}`}
                            title={isTimerFinished ? "Next Module" : "Finish timer to unlock"}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                        className={`p-2 rounded-lg transition-colors border ${isRightPanelOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'}`}
                        title={isRightPanelOpen ? "Hide Tools" : "Show Tools"}
                    >
                        {isRightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Video Player Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 flex flex-col gap-8">
                     {/* Video Wrapper */}
                     <div className="w-full aspect-video bg-black rounded-xl shadow-2xl border border-slate-800 overflow-hidden relative group ring-1 ring-white/10 z-10">
                        <VideoPlayer title={currentModule.title} />
                     </div>

                     {/* Additional Info below video (Desktop) */}
                     <div className="hidden lg:grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-[#0F172A] p-6 rounded-xl border border-slate-800">
                            <h2 className="text-xl font-bold text-white mb-2">{currentModule.title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                In this module, we will explore the fundamental concepts of React, understanding how the Virtual DOM works and how to create your first components.
                            </p>
                        </div>
                        <div className="col-span-1 bg-[#0F172A] p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Module Progress</h3>
                                <div className="w-full h-2 bg-slate-800 rounded-full mb-2 overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[45%]"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>2/5 Topics</span>
                                    <span>45%</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-white transition-colors">
                                View Resources
                            </button>
                        </div>
                     </div>
                </div>
                
                {/* Spacer for Mobile Bottom Tabs */}
                <div className="lg:hidden h-24"></div>
            </div>
        </main>

        {/* 3. RIGHT TOOLS PANEL (Overlay on Mobile, Sidebar on Desktop) */}
        <aside className={`
            bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40
            fixed inset-x-0 bottom-16 top-16 lg:static lg:inset-auto lg:h-full lg:z-auto
            transition-all duration-300 ease-in-out
            ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            ${isRightPanelOpen ? 'lg:w-[420px]' : 'lg:w-0 lg:border-none lg:overflow-hidden'}
            ${/* Mobile Visibility: Only visible if active, otherwise hidden via transform */ ''}
        `}>
            {/* Tools Header */}
            <div className="h-16 border-b border-slate-200 flex items-center px-4 justify-between bg-white shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <ToolTab id="notes" label="Notes" icon={FileText} active={activeTab} onClick={setActiveTab} />
                    <ToolTab id="practice" label="Lab" icon={Code2} active={activeTab} onClick={setActiveTab} />
                    <ToolTab id="ai" label="AI Tutor" icon={Sparkles} active={activeTab} onClick={setActiveTab} />
                </div>
                
                <button 
                    onClick={() => setIsRightPanelOpen(false)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg lg:hidden"
                    title="Close Panel"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Proctoring Widget */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                 <ProctoringWidget onAlert={handleProctorAlert} />
            </div>

            {/* Tool Content Area */}
            <div className="flex-1 overflow-hidden relative bg-white h-full">
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'notes' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                     <NotesEditor />
                </div>
                
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <div className="h-full p-0">
                        <AIAssistant />
                    </div>
                </div>
                
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'practice' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <div className="flex flex-col h-full">
                        <div className="flex-1 border-b border-slate-200 relative">
                            <CodeEditor language="javascript" code={codeJs} onChange={setCodeJs} />
                        </div>
                        <div className="h-[40%] bg-white">
                            <PreviewPane html="" css="" js={codeJs} runTrigger={Date.now()} />
                        </div>
                    </div>
                </div>
            </div>
        </aside>

      </div>

      {/* --- MOBILE BOTTOM TAB BAR (< 1024px) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
           <MobileTab 
             icon={Layout} 
             label="Video" 
             active={!isRightPanelOpen} 
             onClick={() => setIsRightPanelOpen(false)} 
           />
           <MobileTab 
             icon={FileText} 
             label="Notes" 
             active={isRightPanelOpen && activeTab === 'notes'} 
             onClick={() => { setActiveTab('notes'); setIsRightPanelOpen(true); }} 
           />
           <MobileTab 
             icon={Code2} 
             label="Lab" 
             active={isRightPanelOpen && activeTab === 'practice'} 
             onClick={() => { setActiveTab('practice'); setIsRightPanelOpen(true); }} 
           />
           <MobileTab 
             icon={Sparkles} 
             label="Tutor" 
             active={isRightPanelOpen && activeTab === 'ai'} 
             onClick={() => { setActiveTab('ai'); setIsRightPanelOpen(true); }} 
           />
      </div>

    </div>
  );
};

const ToolTab = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all
            ${active === id 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
        `}
    >
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);

const MobileTab = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 w-16 rounded-lg transition-all active:scale-95 ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
    >
        <Icon className={`w-5 h-5 ${active ? 'fill-indigo-100' : ''}`} />
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);
