
import React, { useState, useEffect } from 'react';
import { 
  Clock, MessageSquare, ChevronLeft, ChevronRight, 
  Flag, Type, AlertCircle, Send, CheckCircle2, Grip, Info
} from 'lucide-react';
import { CodeEditor } from '../components/Lab/CodeEditor';
import { FloatingWebcam } from '../components/Exam/FloatingWebcam';
import { ExamQuestion } from '../types';

interface LiveExamScreenProps {
  onNavigate: (path: string) => void;
}

// Mock Exam Data
const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    text: 'Which of the following is NOT a React Hook?',
    marks: 2,
    options: [
      { id: 'a', text: 'useState' },
      { id: 'b', text: 'useFetch' },
      { id: 'c', text: 'useEffect' },
      { id: 'd', text: 'useReducer' },
    ],
    correctOptionId: 'b'
  },
  {
    id: 'q2',
    type: 'coding',
    text: 'Write a function `isPalindrome` that checks if a string is a palindrome. Return true or false.',
    marks: 10,
    starterCode: 'function isPalindrome(str) {\n  // Your code here\n  // Palindrome: reads same forwards and backwards\n\n  return true;\n}',
    language: 'javascript',
    testCases: []
  },
  {
    id: 'q3',
    type: 'mcq',
    text: 'What is the time complexity of binary search?',
    marks: 2,
    options: [
      { id: 'a', text: 'O(n)' },
      { id: 'b', text: 'O(n^2)' },
      { id: 'c', text: 'O(log n)' },
      { id: 'd', text: 'O(1)' },
    ],
    correctOptionId: 'c'
  },
  {
    id: 'q4',
    type: 'coding',
    text: 'Create a function that flattens a nested array.',
    marks: 8,
    starterCode: 'function flatten(arr) {\n  // Your code here\n}',
    language: 'javascript',
    testCases: []
  }
];

export const LiveExamScreen: React.FC<LiveExamScreenProps> = ({ onNavigate }) => {
  // State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reviewList, setReviewList] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(3541); // ~59 mins
  const [fontSize, setFontSize] = useState(16);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'user'|'faculty', text: string}[]>([
      { sender: 'faculty', text: 'Welcome. If you face any technical issues, message here.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const currentQ = EXAM_QUESTIONS[currentIdx];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if(prev <= 0) {
            clearInterval(timer);
            return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const toggleReview = () => {
    const newSet = new Set(reviewList);
    if (newSet.has(currentQ.id)) newSet.delete(currentQ.id);
    else newSet.add(currentQ.id);
    setReviewList(newSet);
  };

  const handleChatSend = () => {
      if(!chatInput.trim()) return;
      setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
      setChatInput('');
      setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'faculty', text: 'Our team is checking your query.' }]);
      }, 2000);
  };

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / EXAM_QUESTIONS.length) * 100);

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-lg tracking-tight">
                SparkLess
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
                <h1 className="font-bold text-slate-900 text-sm">Frontend Engineering</h1>
                <p className="text-[11px] text-slate-500 font-medium">Round 1 • Certification Exam</p>
            </div>
        </div>

        {/* Center Progress (Desktop) */}
        <div className="hidden lg:flex flex-col items-center w-1/3">
             <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                 <span>Exam Progress</span>
                 <span>{answeredCount} / {EXAM_QUESTIONS.length} Answered</span>
             </div>
             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                    style={{ width: `${progress}%` }}
                 ></div>
             </div>
        </div>

        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
            </div>
            <button 
                onClick={() => onNavigate('/exam-results')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
                Finish Exam
            </button>
        </div>
      </header>

      {/* 2. MAIN SPLIT LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: Context / Question */}
        <div className="w-1/2 flex flex-col bg-white border-r border-slate-200 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Question Toolbar */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-[#FAFAFA] shrink-0">
                <div className="flex items-center gap-3">
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">Q{currentIdx + 1}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {currentQ.type === 'mcq' ? 'Multiple Choice' : 'Coding Problem'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                        <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Type className="w-3 h-3" /></button>
                        <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Type className="w-4 h-4" /></button>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{currentQ.marks} Marks</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto">
                    <h2 
                        className="font-medium text-slate-900 leading-relaxed mb-6 transition-all font-sans"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {currentQ.text}
                    </h2>

                    {currentQ.type === 'coding' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Requirements
                                </h4>
                                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1.5 opacity-90">
                                    <li>Function must handle <strong>empty input</strong> strings gracefully.</li>
                                    <li>Ignore case sensitivity (e.g., "Madam" == "madam").</li>
                                    <li>Optimize for <strong>O(n)</strong> time complexity.</li>
                                </ul>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Example Input/Output
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-xs font-mono mt-2">
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-slate-400 mb-1">Input</div>
                                        <div className="text-slate-800">"Racecar"</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-slate-400 mb-1">Output</div>
                                        <div className="text-emerald-600 font-bold">true</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: Work Area (Full Height) */}
        <div className="w-1/2 flex flex-col bg-[#F1F5F9] relative">
            
            {currentQ.type === 'mcq' ? (
                // MCQ View
                <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center">
                    <div className="max-w-xl mx-auto w-full space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Select Correct Option</h3>
                        {(currentQ as any).options.map((opt: any, idx: number) => {
                            const isSelected = answers[currentQ.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(opt.id)}
                                    className={`
                                        w-full text-left p-6 rounded-xl border-2 transition-all duration-200 group relative
                                        ${isSelected 
                                            ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-500/10 z-10 scale-[1.01]' 
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors
                                            ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-400 group-hover:border-slate-400'}
                                        `}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-base font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            {opt.text}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-1/2 -translate-y-1/2 right-6">
                                            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // Coding View (IDE Style)
                <div className="flex-1 flex flex-col h-full bg-[#1E1E1E]">
                    <div className="h-10 bg-[#252526] px-4 flex items-center justify-between border-b border-[#333]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-400 font-bold">JS</span>
                            <span className="text-xs text-slate-400">solution.js</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Editor Mode</span>
                    </div>
                    <div className="flex-1 relative">
                        <CodeEditor 
                            language="javascript" 
                            code={answers[currentQ.id] || (currentQ as any).starterCode} 
                            onChange={handleAnswer} 
                        />
                    </div>
                    <div className="h-12 bg-[#252526] border-t border-[#333] flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                             <CheckCircle2 className="w-3 h-3" /> Auto-saved
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors">
                            Run Test Cases
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* 3. FOOTER */}
      <footer className="h-16 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between px-6 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
              <button 
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                  <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              
              <button 
                  onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-bold ${isPaletteOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                  <Grip className="w-4 h-4" />
                  <span className="hidden sm:inline">Questions</span>
              </button>

              <button 
                  onClick={toggleReview}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${reviewList.has(currentQ.id) ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                  <Flag className={`w-4 h-4 ${reviewList.has(currentQ.id) ? 'fill-amber-700' : ''}`} /> 
                  {reviewList.has(currentQ.id) ? 'Marked' : 'Mark for Review'}
              </button>
          </div>

          <div className="flex items-center gap-4">
              <button 
                  onClick={() => setCurrentIdx(Math.min(EXAM_QUESTIONS.length - 1, currentIdx + 1))}
                  disabled={currentIdx === EXAM_QUESTIONS.length - 1}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                  Save & Next <ChevronRight className="w-4 h-4" />
              </button>
          </div>
      </footer>

      {/* 4. OVERLAYS & WIDGETS */}
      
      {/* FLOATING WEBCAM (Draggable/Minimizable) - Positioned higher to avoid footer overlap */}
      <FloatingWebcam className="bottom-24 right-6" />

      {/* Question Palette Drawer */}
      {isPaletteOpen && (
          <div className="absolute bottom-20 left-6 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-40 animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">Question Navigator</h3>
                  <button onClick={() => setIsPaletteOpen(false)}><ChevronLeft className="w-4 h-4 text-slate-400 rotate-270" /></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                  {EXAM_QUESTIONS.map((q, idx) => {
                      const isAnswered = !!answers[q.id];
                      const isReview = reviewList.has(q.id);
                      const isCurrent = idx === currentIdx;
                      
                      let bg = 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200';
                      if (isReview) bg = 'bg-amber-100 text-amber-700 border-amber-300 font-bold';
                      else if (isAnswered) bg = 'bg-emerald-100 text-emerald-700 border-emerald-300 font-bold';
                      
                      if (isCurrent) bg += ' ring-2 ring-indigo-500 border-indigo-500 z-10';

                      return (
                          <button 
                              key={q.id}
                              onClick={() => { setCurrentIdx(idx); setIsPaletteOpen(false); }}
                              className={`aspect-square rounded-lg text-xs transition-all ${bg}`}
                          >
                              {idx + 1}
                          </button>
                      );
                  })}
              </div>
          </div>
      )}

      {/* Chat Support Widget */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${isChatOpen ? 'bottom-20' : 'bottom-6'}`}>
           {!isChatOpen ? (
               <button 
                onClick={() => setIsChatOpen(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform border border-slate-700"
               >
                   <MessageSquare className="w-4 h-4" />
                   <span className="text-xs font-bold">Proctor Support</span>
               </button>
           ) : (
               <div className="w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
                   <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
                       <span className="text-xs font-bold flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live Support
                       </span>
                       <button onClick={() => setIsChatOpen(false)}><ChevronLeft className="w-4 h-4 -rotate-90" /></button>
                   </div>
                   <div className="h-48 bg-slate-50 p-3 overflow-y-auto space-y-3">
                       {chatMessages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                   {msg.text}
                               </div>
                           </div>
                       ))}
                   </div>
                   <div className="p-2 border-t border-slate-200 flex gap-2">
                       <input 
                           className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-3 py-2 outline-none focus:border-indigo-500"
                           placeholder="Type here..."
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                       />
                       <button onClick={handleChatSend} className="p-2 bg-indigo-600 text-white rounded-lg"><Send className="w-3 h-3" /></button>
                   </div>
               </div>
           )}
      </div>

    </div>
  );
};
