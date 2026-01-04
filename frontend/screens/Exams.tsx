
import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { ExamCard } from '../components/Dashboard/ExamCard';
import { User, Exam } from '../types';
import { Search, Filter, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ExamsScreenProps {
  onNavigate: (path: string) => void;
}

export const ExamsScreen: React.FC<ExamsScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  
  // User Data
  const user: User = {
    id: '1',
    name: 'Arka Maulana',
    email: 'arka.m@university.edu',
  };

  const exams: Exam[] = [
    { id: 'e1', title: 'Frontend Engineering Certification', date: new Date(), durationMinutes: 60, status: 'upcoming' },
    { id: 'e2', title: 'Data Structures & Algorithms', date: new Date(Date.now() + 86400000 * 2), durationMinutes: 120, status: 'upcoming' },
    { id: 'e3', title: 'System Design Fundamentals', date: new Date(Date.now() + 86400000 * 5), durationMinutes: 90, status: 'upcoming' },
    { id: 'e4', title: 'Database Management Systems', date: new Date(Date.now() - 86400000 * 10), durationMinutes: 60, status: 'completed' },
  ];

  const displayedExams = exams.filter(e => 
    activeTab === 'upcoming' ? e.status === 'upcoming' : e.status !== 'upcoming'
  );

  return (
    <DashboardLayout currentUser={user} onNavigate={onNavigate} currentPath="/exams">
      <div className="animate-slide-up pb-12 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Examinations</h1>
                <p className="text-slate-500 text-sm max-w-xl">
                    View upcoming assessments, check your eligibility, and review past performance.
                </p>
            </div>
            
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Upcoming
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    History
                </button>
            </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search exams..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    <Calendar className="w-4 h-4" />
                    Date
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>
        </div>

        {/* Exams Grid */}
        {displayedExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedExams.map(exam => (
                    <div key={exam.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                        <ExamCard exam={exam} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Clock className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No exams found</h3>
                <p className="text-slate-500 text-sm">Check back later for new assessments.</p>
            </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">Proctoring Guidelines</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                    All exams are monitored via AI proctoring. Ensure you have a working webcam, microphone, and stable internet connection before starting.
                    ID verification is required for all certification exams.
                </p>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
