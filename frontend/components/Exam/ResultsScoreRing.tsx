import React from 'react';

interface ResultsScoreRingProps {
  score: number;
  status: 'passed' | 'failed';
  size?: number;
  strokeWidth?: number;
}

export const ResultsScoreRing: React.FC<ResultsScoreRingProps> = ({ 
  score, 
  status,
  size = 240,
  strokeWidth = 14
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const isPassed = status === 'passed';
  const colorStart = isPassed ? '#4F46E5' : '#EF4444';
  const colorEnd = isPassed ? '#7C3AED' : '#F87171';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`scoreGradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#scoreGradient-${status})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[52px] font-bold text-slate-800 leading-none">
          {score}%
        </span>
        <span className={`text-[16px] font-semibold mt-2 ${isPassed ? 'text-primary' : 'text-error'}`}>
          Score: {score}/100
        </span>
        <div className={`
          mt-3 px-3 py-1 rounded-full text-[14px] font-bold flex items-center gap-1
          ${isPassed ? 'bg-green-100 text-success' : 'bg-red-100 text-error'}
        `}>
          {isPassed ? 'PASSED ✓' : 'FAILED ✗'}
        </div>
      </div>
    </div>
  );
};
