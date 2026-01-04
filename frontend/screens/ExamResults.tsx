import React from 'react';
import { ExamResult } from '../types';
import { ResultsScoreRing } from '../components/Exam/ResultsScoreRing';
import { ProctoringReport } from '../components/Exam/ProctoringReport';
import { QuestionReviewAccordion } from '../components/Exam/QuestionReviewAccordion';
import { Button } from '../components/ui/Button';
import { Download, ArrowRight, CheckCircle, Clock, BarChart } from 'lucide-react';

interface ExamResultsProps {
  onNavigate: (path: string) => void;
}

export const ExamResultsScreen: React.FC<ExamResultsProps> = ({ onNavigate }) => {
  // Mock Data
  const result: ExamResult = {
    id: 'res-1',
    examTitle: 'Advanced Machine Learning Final',
    completedAt: new Date(),
    score: 87,
    totalQuestions: 100,
    correctAnswers: 87,
    timeSpent: '45m 32s',
    difficulty: 'Intermediate',
    status: 'passed',
    questions: [
      {
        id: 'q1',
        text: 'Which algorithm is best suited for classification problems with high dimensionality?',
        userAnswerId: 'o1',
        correctAnswerId: 'o1',
        options: [
          { id: 'o1', text: 'Support Vector Machines (SVM)' },
          { id: 'o2', text: 'K-Means Clustering' },
          { id: 'o3', text: 'Linear Regression' },
        ],
        explanation: 'SVMs are effective in high-dimensional spaces because they find the optimal hyperplane that separates classes with the maximum margin.'
      },
      {
        id: 'q2',
        text: 'What is the primary purpose of regularization in machine learning?',
        userAnswerId: 'o2',
        correctAnswerId: 'o1',
        options: [
          { id: 'o1', text: 'To prevent overfitting' },
          { id: 'o2', text: 'To increase model complexity' },
          { id: 'o3', text: 'To speed up training' },
        ],
        explanation: 'Regularization adds a penalty term to the loss function to discourage complex models, thus reducing overfitting.'
      },
      {
        id: 'q3',
        text: 'In a neural network, what does the activation function do?',
        userAnswerId: 'o3',
        correctAnswerId: 'o3',
        options: [
            { id: 'o1', text: 'Initializes weights' },
            { id: 'o2', text: 'Calculates the loss' },
            { id: 'o3', text: 'Introduces non-linearity' },
        ],
        explanation: 'Without activation functions, a neural network would simply be a linear regression model. Activation functions introduce non-linearity, allowing the network to learn complex patterns.'
      }
    ],
    proctoring: {
      attentionScore: 89,
      checks: {
        faceDetected: true,
        idVerified: true,
        phoneDetected: false,
        multiplePeople: false,
        webcamActive: true,
        screenSharing: true,
      },
      timelineData: [
        { time: 0, score: 100 },
        { time: 5, score: 98 },
        { time: 10, score: 95 },
        { time: 15, score: 90 }, // Dip
        { time: 20, score: 92 },
        { time: 25, score: 85 }, // Dip
        { time: 30, score: 88 },
        { time: 35, score: 95 },
        { time: 40, score: 96 },
        { time: 45, score: 98 },
      ],
      incidents: [
        { id: 'i1', timeLabel: '15:20', timestamp: 15, type: 'Gaze Aversion', severity: 'low' },
        { id: 'i2', timeLabel: '25:10', timestamp: 25, type: 'Background Noise', severity: 'medium' },
      ]
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto animate-slide-up">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-900 mb-1">Exam Completed</h1>
            <p className="text-[12px] text-slate-500">
                Completed on {result.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {result.completedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-[12px] border border-slate-200 shadow-[0_4px_6px_rgba(0,0,0,0.05)] p-8">
            
            {/* Score Ring */}
            <div className="flex justify-center mb-8">
                <ResultsScoreRing score={result.score} status={result.status} />
            </div>

            {/* Breakdown Stats */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox 
                    icon={CheckCircle} 
                    color="text-success" 
                    value={`${result.correctAnswers}/${result.totalQuestions}`} 
                    label="Correct Answers" 
                />
                <StatBox 
                    icon={Clock} 
                    color="text-primary" 
                    value={result.timeSpent} 
                    label="Time Spent" 
                />
                <StatBox 
                    icon={BarChart} 
                    color="text-secondary" 
                    value={result.difficulty} 
                    label="Difficulty Rating" 
                />
            </div>
        </div>

        {/* Proctoring Report */}
        <ProctoringReport session={result.proctoring} />

        {/* Question Review */}
        <QuestionReviewAccordion questions={result.questions} />

        {/* Bottom Actions */}
        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button variant="secondary" className="w-full sm:w-auto px-6">
                <Download className="w-4 h-4 mr-2" />
                Download Report
            </Button>
            <Button variant="primary" onClick={() => onNavigate('/dashboard')} className="w-full sm:w-auto px-6">
                Return to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>

      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, color, value, label }: { icon: any, color: string, value: string, label: string }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
        <div className={`p-3 rounded-full bg-white border border-slate-100 shadow-sm ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className={`text-[20px] font-bold text-slate-800`}>{value}</p>
            <p className="text-[12px] text-slate-400">{label}</p>
        </div>
    </div>
);
