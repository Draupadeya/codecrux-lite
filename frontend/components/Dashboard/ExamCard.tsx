import React from 'react';
import { Exam } from '../../types';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface ExamCardProps {
  exam: Exam;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isUrgent = daysUntil <= 3;

  return (
    <div className="min-w-[280px] bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden group">
      {isUrgent && (
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
              <div className="absolute top-[6px] right-[-24px] rotate-45 bg-warning text-white text-[10px] font-bold py-1 w-24 text-center shadow-sm">
                  SOON
              </div>
          </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <div>
            <h4 className="text-[16px] font-semibold text-slate-900 line-clamp-1">{exam.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                <Calendar className="w-3 h-3" />
                <span>{new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${isUrgent ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} Days`}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{exam.durationMinutes} mins</span>
        </div>
      </div>

      <button 
        onClick={() => window.location.hash = '/proctoring'}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold py-2 rounded-lg hover:shadow-md transition-all active:scale-[0.98]"
      >
        Prepare Now
      </button>
    </div>
  );
};
