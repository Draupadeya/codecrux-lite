import React from 'react';
import { ProctoringSession } from '../../types';
import { CheckCircle2, AlertTriangle, Eye, ShieldCheck, Smartphone, Users, Video, Monitor } from 'lucide-react';

interface ProctoringReportProps {
  session: ProctoringSession;
}

export const ProctoringReport: React.FC<ProctoringReportProps> = ({ session }) => {
  const { attentionScore, checks, timelineData, incidents } = session;

  // Chart Dimensions
  const chartHeight = 200;
  const chartWidth = 800; // ViewBox width, responsive via CSS
  const padding = 20;

  // Generate Path for Timeline
  const generatePath = () => {
    if (timelineData.length === 0) return '';
    
    const maxTime = Math.max(...timelineData.map(d => d.time));
    const points = timelineData.map(d => {
      const x = (d.time / maxTime) * (chartWidth - padding * 2) + padding;
      const y = chartHeight - (d.score / 100) * (chartHeight - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    return `M ${points}`;
  };

  const getXForTime = (time: number) => {
    const maxTime = Math.max(...timelineData.map(d => d.time));
    return (time / maxTime) * (chartWidth - padding * 2) + padding;
  };

  const getYForScore = (score: number) => {
    return chartHeight - (score / 100) * (chartHeight - padding * 2) - padding;
  };

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-[16px] font-bold text-slate-900">Proctoring Report</h3>
        <p className="text-[12px] text-slate-500">Your exam session was monitored for integrity</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Attention Score Ring */}
            <div className="flex flex-col items-center shrink-0">
                <h4 className="text-[14px] font-medium text-slate-800 mb-4">Attention Score</h4>
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" stroke="url(#attentionGradient)" 
                            strokeWidth="8" strokeDasharray="283" 
                            strokeDashoffset={283 - (attentionScore / 100) * 283} 
                            strokeLinecap="round" 
                        />
                        <defs>
                            <linearGradient id="attentionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[28px] font-bold text-slate-800">
                        {attentionScore}%
                    </div>
                </div>
                <p className="text-[12px] text-success font-medium mt-3 text-center max-w-[200px]">
                    {attentionScore > 80 ? 'Excellent attention. No significant violations detected.' : 'Some attention lapses detected.'}
                </p>
            </div>

            {/* Timeline Chart */}
            <div className="flex-1 w-full min-w-0">
                <h4 className="text-[14px] font-medium text-slate-800 mb-4">Incident Timeline</h4>
                <div className="w-full aspect-[2/1] md:aspect-[3/1] bg-slate-50 rounded-lg border border-slate-100 p-4 relative overflow-hidden">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                        {/* Grid Lines */}
                        <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="4" />
                        <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#E2E8F0" strokeDasharray="4" />
                        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#E2E8F0" strokeDasharray="4" />

                        {/* Data Line */}
                        <path 
                            d={generatePath()} 
                            fill="none" 
                            stroke="#4F46E5" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />

                        {/* Incident Markers */}
                        {incidents.map((incident) => {
                            const x = getXForTime(incident.timestamp);
                            // Estimate Y based on interpolation or just place on line if we had exact score at that time
                            // For visualization, we'll place it slightly above the line or at a fixed height
                            // Let's find the closest score in timelineData
                            const closest = timelineData.reduce((prev, curr) => 
                                Math.abs(curr.time - incident.timestamp) < Math.abs(prev.time - incident.timestamp) ? curr : prev
                            );
                            const y = getYForScore(closest.score);

                            return (
                                <g key={incident.id} className="group cursor-pointer">
                                    <circle cx={x} cy={y} r="6" fill="#EF4444" stroke="white" strokeWidth="2" />
                                    <title>{`${incident.timeLabel} - ${incident.type}`}</title>
                                    {/* Custom Tooltip (SVG ForeignObject or overlay usually better, using title for simplicity here) */}
                                </g>
                            );
                        })}
                    </svg>
                    
                    {/* X-Axis Labels */}
                    <div className="absolute bottom-1 left-4 right-4 flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0 min</span>
                        <span>15 min</span>
                        <span>30 min</span>
                        <span>45 min</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Security Metrics Grid */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-4">
             <MetricCheck label="Face Detection" status={checks.faceDetected} icon={ShieldCheck} passedLabel="Verified" />
             <MetricCheck label="Identity Verified" status={checks.idVerified} icon={Eye} passedLabel="Confirmed" />
             <MetricCheck label="Phone Detection" status={checks.phoneDetected} icon={Smartphone} passedLabel="None Detected" />
             <MetricCheck label="Multiple People" status={checks.multiplePeople} icon={Users} passedLabel="Single Person" />
             <MetricCheck label="Webcam Active" status={checks.webcamActive} icon={Video} passedLabel="Throughout Exam" />
             <MetricCheck label="Screen Recording" status={checks.screenSharing} icon={Monitor} passedLabel="Enabled" />
        </div>
      </div>
    </div>
  );
};

const MetricCheck = ({ label, status, icon: Icon, passedLabel }: { label: string, status: boolean, icon: any, passedLabel: string }) => {
    // Note: status logic depends on field. e.g. phoneDetected=false is GOOD.
    // Let's assume the passed props 'status' means "Is Good?" or "Passed Check?" 
    // Actually, type def says 'phoneDetected', so true means BAD.
    // Let's fix logic inside:
    
    // Logic: 
    // faceDetected: true = good
    // idVerified: true = good
    // phoneDetected: false = good
    // multiplePeople: false = good
    // webcamActive: true = good
    // screenSharing: true = good
    
    // We'll interpret status prop based on label for this demo, or purely assume passed 'status' in Types refers to the boolean state of the event
    
    let isSuccess = false;
    if (label === 'Phone Detection' || label === 'Multiple People') {
        isSuccess = !status;
    } else {
        isSuccess = status;
    }

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-100 text-success' : 'bg-red-100 text-error'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[12px] font-medium text-slate-900">{label}</p>
                <div className="flex items-center gap-1">
                    <p className={`text-[10px] font-bold ${isSuccess ? 'text-success' : 'text-error'}`}>
                        {isSuccess ? passedLabel : 'Violation Detected'}
                    </p>
                    {isSuccess ? <CheckCircle2 className="w-3 h-3 text-success" /> : <AlertTriangle className="w-3 h-3 text-error" />}
                </div>
            </div>
        </div>
    );
}
