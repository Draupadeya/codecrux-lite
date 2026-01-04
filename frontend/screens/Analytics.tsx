import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { User } from '../types';
import { 
  TrendingUp, Clock, Calendar, Award, Target, 
  ArrowUp, ArrowDown, Download, Filter, MoreHorizontal,
  ChevronDown, Zap, BarChart2, Activity, PieChart
} from 'lucide-react';

interface AnalyticsScreenProps {
  onNavigate: (path: string) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigate }) => {
  const user: User = {
    id: '1',
    name: 'Arka Maulana',
    email: 'arka.m@university.edu',
  };

  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [activeChartTab, setActiveChartTab] = useState<'exams' | 'activity'>('exams');

  // Dynamic Data Model based on Time Range
  const analyticsData = {
    Week: {
      kpi: {
        streak: "12 Days", streakTrend: "+2", streakLabel: "from last week",
        time: "12.5h", timeTrend: "+5%", timeLabel: "vs last week",
        score: "88%", scoreTrend: "+1%", scoreLabel: "improvement",
        tasks: "24", tasksTrend: "+3", tasksLabel: "vs last week"
      },
      exams: {
        data: [75, 78, 80, 82, 81, 85, 88],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      activity: [
        { label: 'Mon', value: 2.5 }, { label: 'Tue', value: 3.8 }, { label: 'Wed', value: 1.5 },
        { label: 'Thu', value: 4.2 }, { label: 'Fri', value: 3.0 }, { label: 'Sat', value: 5.5 }, { label: 'Sun', value: 2.0 }
      ]
    },
    Month: {
      kpi: {
        streak: "12 Days", streakTrend: "+2 days", streakLabel: "vs last month",
        time: "48.5h", timeTrend: "+12%", timeLabel: "vs last month",
        score: "87%", scoreTrend: "+3%", scoreLabel: "improvement",
        tasks: "124", tasksTrend: "+5%", tasksLabel: "vs last month"
      },
      exams: {
        data: [65, 70, 68, 74, 78, 85, 82, 90, 88, 95],
        labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
      },
      activity: [
        { label: 'W1', value: 12 }, { label: 'W2', value: 15 }, { label: 'W3', value: 10 }, { label: 'W4', value: 18 }
      ]
    },
    Year: {
      kpi: {
        streak: "45 Days", streakTrend: "Best", streakLabel: "Personal Best",
        time: "842h", timeTrend: "+15%", timeLabel: "vs last year",
        score: "85%", scoreTrend: "+8%", scoreLabel: "improvement",
        tasks: "1,240", tasksTrend: "+15%", tasksLabel: "vs last year"
      },
      exams: {
        data: [60, 65, 62, 68, 72, 75, 78, 82, 85, 88, 90, 92],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      activity: [
        { label: 'Jan', value: 45 }, { label: 'Feb', value: 52 }, { label: 'Mar', value: 48 },
        { label: 'Apr', value: 60 }, { label: 'May', value: 55 }, { label: 'Jun', value: 70 },
        { label: 'Jul', value: 68 }, { label: 'Aug', value: 80 }, { label: 'Sep', value: 75 },
        { label: 'Oct', value: 85 }, { label: 'Nov', value: 90 }, { label: 'Dec', value: 65 }
      ]
    }
  };

  const currentData = analyticsData[timeRange];

  return (
    <DashboardLayout currentUser={user} onNavigate={onNavigate} currentPath="/analytics">
      <div className="animate-slide-up pb-12 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Performance Analytics</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Deep dive into your learning habits. Track your consistency, course completion rates, and exam performance over time.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
             <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {(['Week', 'Month', 'Year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      timeRange === range 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
             </div>
             
             <button className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all hover:shadow-md" title="Export Data">
                <Download className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <MetricCard 
                label="Study Streak" 
                value={currentData.kpi.streak} 
                trend={currentData.kpi.streakTrend} 
                trendLabel={currentData.kpi.streakLabel}
                trendUp={true}
                icon={Target}
                color="text-orange-600"
                bg="bg-orange-50"
                borderColor="border-orange-100"
            />
            <MetricCard 
                label="Total Study Time" 
                value={currentData.kpi.time} 
                trend={currentData.kpi.timeTrend} 
                trendLabel={currentData.kpi.timeLabel}
                trendUp={true}
                icon={Clock}
                color="text-indigo-600"
                bg="bg-indigo-50"
                borderColor="border-indigo-100"
            />
            <MetricCard 
                label="Avg. Exam Score" 
                value={currentData.kpi.score} 
                trend={currentData.kpi.scoreTrend} 
                trendLabel={currentData.kpi.scoreLabel}
                trendUp={true}
                icon={Award}
                color="text-emerald-600"
                bg="bg-emerald-50"
                borderColor="border-emerald-100"
            />
            <MetricCard 
                label="Tasks Completed" 
                value={currentData.kpi.tasks} 
                trend={currentData.kpi.tasksTrend} 
                trendLabel={currentData.kpi.tasksLabel}
                trendUp={true} // Task trend usually positive
                icon={Zap}
                color="text-blue-600"
                bg="bg-blue-50"
                borderColor="border-blue-100"
            />
        </div>

        {/* Main Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Main Interactive Chart (2/3 Width) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           Learning Trends
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                            {activeChartTab === 'exams' ? 'Exam Performance History' : 'Study Activity Breakdown'} ({timeRange})
                        </p>
                    </div>
                    
                    {/* Chart Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button 
                            onClick={() => setActiveChartTab('exams')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeChartTab === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" /> Exams
                        </button>
                        <button 
                            onClick={() => setActiveChartTab('activity')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeChartTab === 'activity' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Activity className="w-3.5 h-3.5" /> Activity
                        </button>
                    </div>
                </div>
                
                {/* Chart Container with Fade Transition */}
                <div className="w-full h-[280px] md:h-[320px] relative">
                     {activeChartTab === 'exams' 
                        ? <ExamSmoothChart data={currentData.exams.data} labels={currentData.exams.labels} /> 
                        : <StudyActivityChart data={currentData.activity} />
                     }
                </div>
            </div>

            {/* Skill Radar Chart (1/3 Width) */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                 <div className="w-full flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Skill Proficiency</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Current Mastery Levels</p>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="flex-1 w-full flex items-center justify-center">
                    <SkillRadarChart />
                 </div>

                 <div className="w-full mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span>Your Stats</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                        <span>Class Avg</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Secondary Breakdowns Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

            {/* Course Progress */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Course Progress</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Completion vs. Time Invested</p>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="w-full h-[220px] overflow-x-auto custom-scrollbar pb-2">
                    <div className="min-w-[500px] h-full">
                        <CoursePerformanceChart />
                    </div>
                </div>
            </div>

            {/* Consistency Heatmap */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Consistency Tracker</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">Daily Contribution Activity</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100">
                        <span>2024</span>
                        <ChevronDown className="w-3 h-3" />
                    </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center w-full">
                    <ConsistencyGrid />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                         <span>Less</span>
                         <div className="w-3 h-3 rounded-sm bg-slate-100"></div>
                         <div className="w-3 h-3 rounded-sm bg-indigo-200"></div>
                         <div className="w-3 h-3 rounded-sm bg-indigo-400"></div>
                         <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
                         <span>More</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Updated today</span>
                </div>
            </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

/* --- SUB-COMPONENTS --- */

const MetricCard = ({ label, value, trend, trendLabel, trendUp, icon: Icon, color, bg, borderColor }: any) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${bg} ${color} border ${borderColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${trendUp ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
                {trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {trend}
            </div>
        </div>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</h3>
        <div className="flex items-baseline gap-2">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
             <span className="text-[10px] text-slate-400 font-medium">/ {trendLabel}</span>
        </div>
    </div>
);

// 1. Skill Radar Chart
const SkillRadarChart = () => {
    const skills = [
        { name: 'Frontend', value: 85 },
        { name: 'Backend', value: 65 },
        { name: 'UI/UX', value: 75 },
        { name: 'DevOps', value: 50 },
        { name: 'Theory', value: 90 },
    ];

    const size = 260;
    const center = size / 2;
    const radius = 90;
    const sides = skills.length;
    const angleSlice = (Math.PI * 2) / sides;

    const getCoords = (value: number, index: number) => {
        const r = (value / 100) * radius;
        const angle = index * angleSlice - Math.PI / 2;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const dataPoints = skills.map((s, i) => getCoords(s.value, i));
    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

    const webs = [100, 75, 50, 25].map(level => {
        const points = skills.map((_, i) => getCoords(level, i));
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
    });

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg width={size} height={size} className="overflow-visible">
                {webs.map((path, i) => (
                    <path key={i} d={path} fill="none" stroke="#F1F5F9" strokeWidth="1.5" />
                ))}
                
                {skills.map((_, i) => {
                    const end = getCoords(100, i);
                    return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#F1F5F9" strokeWidth="1.5" />;
                })}

                <path d={dataPath} fill="rgba(79, 70, 229, 0.2)" stroke="#4F46E5" strokeWidth="2.5" />
                
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4F46E5" stroke="white" strokeWidth="2" className="hover:scale-150 transition-transform cursor-pointer">
                        <title>{skills[i].name}: {skills[i].value}%</title>
                    </circle>
                ))}

                {skills.map((s, i) => {
                    const coords = getCoords(120, i);
                    return (
                        <text 
                            key={i} 
                            x={coords.x} 
                            y={coords.y} 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            className="text-[10px] font-bold fill-slate-500 uppercase"
                        >
                            {s.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

// 2. Study Activity Bar Chart
const StudyActivityChart = ({ data }: { data: { label: string, value: number }[] }) => {
    // Determine max value for scaling, add buffer
    const maxVal = Math.max(...data.map(d => d.value)) * 1.2 || 10; 

    return (
        <div className="w-full h-full flex items-end justify-between px-4 pb-6 animate-fade-in">
            {data.map((d, i) => {
                const heightPct = (d.value / maxVal) * 100;
                return (
                    <div key={i} className="flex flex-col items-center gap-2 group w-full relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-[100%] mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg">
                                 {d.value} hrs
                             </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[24px] h-[200px] flex items-end relative rounded-t-lg bg-slate-50 overflow-hidden">
                            <div 
                                className={`w-full rounded-t-lg transition-all duration-700 ease-out group-hover:opacity-90 ${heightPct > 60 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-indigo-200'}`}
                                style={{ height: `${heightPct}%` }}
                            ></div>
                        </div>
                        
                        {/* Label */}
                        <span className={`text-[10px] font-bold uppercase ${i === data.length - 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// 3. Consistency Grid (Responsive Heatmap)
const ConsistencyGrid = () => {
    // Generate a visual grid pattern
    const days = 7;
    const weeks = 24; 
    const grid = [];
    
    for (let w = 0; w < weeks; w++) {
        const week = [];
        for (let d = 0; d < days; d++) {
            const rand = Math.random();
            let level = 0; 
            if (rand > 0.8) level = 3; 
            else if (rand > 0.6) level = 2; 
            else if (rand > 0.4) level = 1; 
            week.push(level);
        }
        grid.push(week);
    }

    const getColor = (level: number) => {
        switch(level) {
            case 3: return 'bg-indigo-600';
            case 2: return 'bg-indigo-400';
            case 1: return 'bg-indigo-200';
            default: return 'bg-slate-100';
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex gap-[3px] w-full justify-between">
                {grid.map((week, i) => (
                    <div key={i} className="flex flex-col gap-[3px] flex-1">
                        {week.map((day, j) => (
                            <div 
                                key={`${i}-${j}`} 
                                className={`aspect-square rounded-[2px] w-full ${getColor(day)} transition-all hover:scale-110 hover:border hover:border-black/10 cursor-pointer`}
                                title="Study Activity"
                            ></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Smooth Area Chart for Exam Trends
const ExamSmoothChart = ({ data, labels }: { data: number[], labels: string[] }) => {
    const width = 800;
    const height = 300;
    const paddingY = 20;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((d - 50) / 50) * (height - paddingY),
    }));

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const fillPath = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return (
        <div className="w-full h-full relative group animate-fade-in">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                    <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#4F46E5" floodOpacity="0.3"/>
                    </filter>
                </defs>
                
                {[0, 25, 50, 75, 100].map((tick, i) => {
                     const y = height - (tick/100) * height;
                     return (
                         <line key={i} x1={0} y1={y} x2={width} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4" />
                     );
                })}

                <path d={fillPath} fill="url(#areaGradient)" />

                <path 
                    d={pathD} 
                    fill="none" 
                    stroke="#4F46E5" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    filter="url(#lineShadow)"
                />

                {points.map((p, i) => (
                    <g key={i} className="group/point">
                         <circle 
                            cx={p.x} cy={p.y} r="6" 
                            fill="white" stroke="#4F46E5" strokeWidth="3" 
                            className="transition-all duration-300 hover:r-8 hover:stroke-4 cursor-pointer"
                         />
                         <foreignObject x={p.x - 40} y={p.y - 50} width="80" height="40" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                             <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md text-center shadow-lg">
                                 Score: {data[i]}%
                             </div>
                         </foreignObject>
                    </g>
                ))}
            </svg>
            
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                {labels.map((l, i) => (
                    // Only show every other label if too many, or just simplify logic
                    <span key={i} className={data.length > 8 && i % 2 !== 0 ? 'hidden md:inline' : ''}>{l}</span>
                ))}
            </div>
        </div>
    );
};

// 5. Modern Course Progress Chart (Capsule Bars)
const CoursePerformanceChart = () => {
    const courses = [
        { name: 'React', progress: 85, hours: 12 },
        { name: 'Adv. CSS', progress: 60, hours: 8 },
        { name: 'System', progress: 30, hours: 15 },
        { name: 'Algorithms', progress: 92, hours: 20 },
        { name: 'Node.js', progress: 45, hours: 6 },
        { name: 'UX Principles', progress: 75, hours: 10 },
        { name: 'Python', progress: 55, hours: 14 },
        { name: 'SQL', progress: 40, hours: 5 },
    ];

    const maxHours = 25;
    
    return (
        <div className="w-full h-full flex flex-col justify-end">
            <div className="flex-1 flex items-end justify-between gap-4 md:gap-12 px-2">
                {courses.map((course, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end min-w-[40px]">
                        
                        {/* Hover Details */}
                        <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20 pointer-events-none">
                            <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl whitespace-nowrap">
                                <p className="font-bold mb-1">{course.name}</p>
                                <div className="flex gap-3 text-[10px] text-slate-300">
                                    <span>{course.progress}% Complete</span>
                                    <span className="text-amber-400">{course.hours}h</span>
                                </div>
                            </div>
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 mx-auto mt-[-1px]"></div>
                        </div>

                        <div className="w-full max-w-[48px] relative flex items-end justify-center h-[80%]">
                            {/* Background Track */}
                            <div className="absolute inset-0 bg-slate-50 rounded-2xl border border-slate-100"></div>
                            
                            {/* Progress Capsule */}
                            <div 
                                className="w-full mx-1 mb-1 bg-indigo-500 rounded-xl transition-all duration-1000 ease-out relative z-10 shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-600"
                                style={{ height: `${course.progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl"></div>
                            </div>
                            
                            {/* Hours Marker */}
                            <div 
                                className="absolute w-[140%] h-[3px] bg-amber-400 z-20 rounded-full shadow-sm group-hover:h-[4px] transition-all"
                                style={{ bottom: `${(course.hours / maxHours) * 100}%` }}
                            ></div>
                        </div>

                        {/* Label */}
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors truncate w-full text-center">
                            {course.name}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-md"></div>
                    <span className="text-xs text-slate-500 font-medium">Completion Rate</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-[3px] bg-amber-400 rounded-full"></div>
                    <span className="text-xs text-slate-500 font-medium">Time Invested</span>
                </div>
            </div>
        </div>
    );
};
