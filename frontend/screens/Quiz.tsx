
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../components/Quiz/QuizQuestion';
import { QuizResults } from '../components/Quiz/QuizResults';
import { FloatingWebcam } from '../components/Exam/FloatingWebcam';
import { QuizQuestion as QuizQuestionType } from '../types';
import { X, Clock, ChevronRight, Flag, ArrowRight, AlertTriangle } from 'lucide-react';

interface QuizScreenProps {
  onNavigate: (path: string) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ onNavigate }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Mock Quiz Data
  const questions: QuizQuestionType[] = [
    {
      id: 'q1',
      text: 'Which hook should you use for side effects in a functional component?',
      correctOptionId: 'o2',
      options: [
        { id: 'o1', text: 'useState' },
        { id: 'o2', text: 'useEffect' },
        { id: 'o3', text: 'useContext' },
        { id: 'o4', text: 'useReducer' },
      ]
    },
    {
      id: 'q2',
      text: 'What is the virtual DOM in React?',
      correctOptionId: 'o1',
      options: [
        { id: 'o1', text: 'A lightweight copy of the real DOM used for performance optimization' },
        { id: 'o2', text: 'A browser extension for debugging React apps' },
        { id: 'o3', text: 'A direct interface to the browser rendering engine' },
        { id: 'o4', text: 'A database for storing component state' },
      ]
    },
    {
      id: 'q3',
      text: 'How do you pass data from a parent to a child component?',
      correctOptionId: 'o3',
      options: [
        { id: 'o1', text: 'Using State' },
        { id: 'o2', text: 'Using Context' },
        { id: 'o3', text: 'Using Props' },
        { id: 'o4', text: 'Using Redux' },
      ]
    }
  ];

  const totalTime = 600;

  // Timer Logic
  useEffect(() => {
    if (isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (id: string) => {
    setSelectedOptionId(id);
  };

  const handleSubmit = () => {
    if (!isSubmitted) {
      // Submit Answer
      setIsSubmitted(true);
      if (selectedOptionId === questions[currentQuestionIdx].correctOptionId) {
        setScore(score + 1);
      }
    } else {
      // Next Question
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setSelectedOptionId(null);
        setIsSubmitted(false);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIdx(0);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setTimeLeft(totalTime);
  };

  const progress = Math.round(((currentQuestionIdx + (isSubmitted ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* 1. FIXED HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm relative">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => onNavigate('/dashboard')}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
                <h1 className="font-bold text-slate-900 text-sm">React Fundamentals</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Mid-Term Quiz</p>
            </div>
        </div>

        {/* Central Progress Bar */}
        {!isFinished && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 hidden md:block">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                    <span>Progress</span>
                    <span>{currentQuestionIdx + 1} / {questions.length}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        )}

        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
            </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto relative z-0 pb-32 custom-scrollbar">
        <div className="min-h-full flex flex-col items-center p-6 md:p-12">
            {isFinished ? (
              <QuizResults 
                score={score}
                totalQuestions={questions.length}
                onRetry={handleRetry}
                onContinue={() => onNavigate('/dashboard')}
              />
            ) : (
              <div className="w-full max-w-4xl">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                        Question {currentQuestionIdx + 1}
                    </span>
                    <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                        Multiple Choice
                    </span>
                 </div>
                 
                 <QuizQuestion 
                    question={questions[currentQuestionIdx]}
                    selectedOptionId={selectedOptionId}
                    onSelectOption={handleOptionSelect}
                    isSubmitted={isSubmitted}
                 />
              </div>
            )}
        </div>
      </main>

      {/* 3. FIXED FOOTER (Navigation) */}
      {!isFinished && (
          <footer className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-6 md:px-12 fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">Flag for Review</span>
              </button>

              <div className="flex items-center gap-4">
                  <div className="hidden sm:flex text-xs text-slate-400 font-medium mr-4">
                      {questions.length - currentQuestionIdx - 1} questions remaining
                  </div>
                  
                  <button 
                    onClick={handleSubmit}
                    disabled={!selectedOptionId && !isSubmitted}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95
                        ${isSubmitted 
                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed'}
                    `}
                  >
                      {isSubmitted ? (
                          <>Next Question <ChevronRight className="w-4 h-4" /></>
                      ) : (
                          <>Submit Answer <ArrowRight className="w-4 h-4" /></>
                      )}
                  </button>
              </div>
          </footer>
      )}

      {/* 4. FLOATING WEBCAM (Proctoring) */}
      {/* Positioned higher to avoid footer overlap, but minimizable */}
      <FloatingWebcam className="bottom-24 right-6" />

    </div>
  );
};
