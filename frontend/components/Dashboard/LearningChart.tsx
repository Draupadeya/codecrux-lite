import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export const LearningChart: React.FC = () => {
  // Data for the chart (Mon-Sun)
  const data = [45, 62, 52, 78, 72, 90, 82];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Chart dimensions logic for a responsive feel
  // We use a fixed viewBox coordinate system that scales with CSS
  const width = 300;
  const height = 120;
  const paddingX = 10;
  const paddingY = 20;
  
  // Calculate points mapped to the SVG coordinate system
  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
    return { x, y, val };
  });

  // Create path line
  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  // Area path (close the loop at the bottom for gradient fill)
  const areaPath = `${pathData} L ${width - paddingX},${height} L ${paddingX},${height} Z`;

  // Focus point configuration (Friday - index 4)
  const focusIndex = 4;
  const focusPoint = points[focusIndex];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full flex flex-col font-sans">
      <div className="flex justify-between items-start mb-8">
        <div>
           <h3 className="text-lg font-bold text-slate-900 leading-tight">Learning Activity</h3>
           <p className="text-xs text-slate-400 mt-1 font-medium">Weekly performance</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/30"></span>
                <span className="text-xs font-semibold text-slate-500">Materials</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-sm shadow-pink-400/30"></span>
                <span className="text-xs font-semibold text-slate-500">Exams</span>
            </div>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors -mr-2">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[180px] relative">
         {/* Background Grid Lines - using absolute positioning to separate from SVG scaling */}
         <div className="absolute inset-0 flex flex-col justify-between pb-8 pt-2 pointer-events-none">
            {[100, 75, 50, 25, 0].map((val) => (
                <div key={val} className="w-full border-b border-dashed border-slate-100 h-0 relative"></div>
            ))}
         </div>

         {/* The Chart */}
         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
            <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
                {/* Soft shadow for the line */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#4F46E5" floodOpacity="0.2"/>
                </filter>
            </defs>
            
            {/* Area Fill */}
            <path d={areaPath} fill="url(#chartGradient)" />
            
            {/* Main Line */}
            <path 
                d={pathData} 
                fill="none" 
                stroke="#4F46E5" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="url(#shadow)"
                className="drop-shadow-sm"
            />
            
            {/* Focus Point Marker */}
            <circle 
                cx={focusPoint.x} 
                cy={focusPoint.y} 
                r="6" 
                fill="white" 
                stroke="#4F46E5" 
                strokeWidth="3.5" 
                className="cursor-pointer hover:scale-125 transition-transform origin-center"
            />

            {/* Tooltip */}
            <g transform={`translate(${focusPoint.x - 24}, ${focusPoint.y - 50})`} className="animate-fade-in">
                {/* Background Rect with rounded corners */}
                <rect width="48" height="30" rx="8" fill="#1e1b4b" filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.15))" />
                {/* Arrow Pointer */}
                <path d="M18,30 L24,36 L30,30 Z" fill="#1e1b4b" />
                {/* Text */}
                <text 
                    x="24" 
                    y="20" 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="12" 
                    fontWeight="600"
                    fontFamily="Poppins, sans-serif"
                    className="select-none"
                >
                    2.4h
                </text>
            </g>
         </svg>
         
         {/* X-Axis Labels */}
         <div className="flex justify-between mt-4 px-1">
             {labels.map((label, i) => (
                 <div key={label} className="flex flex-col items-center gap-1">
                     <span 
                        className={`text-xs ${i === focusIndex ? 'font-bold text-slate-900' : 'font-medium text-slate-400'}`}
                     >
                         {label}
                     </span>
                     {/* Active Indicator Dot */}
                     {i === focusIndex && (
                        <div className="w-1 h-1 rounded-full bg-primary"></div>
                     )}
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
};