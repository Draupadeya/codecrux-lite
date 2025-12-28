import React from 'react';
import { Play, Pause, Volume2, Maximize, Settings, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  duration?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ title }) => {
  // Visual-only markers for the timeline
  const markers = [
    { left: '20%', color: '#F59E0B', label: 'Intro to Concept' },
    { left: '45%', color: '#10B981', label: 'Key Takeaway' },
    { left: '80%', color: '#4F46E5', label: 'Summary' },
  ];

  return (
    <div className="w-full aspect-video bg-black relative group overflow-hidden rounded-lg shadow-lg">
      {/* Placeholder Image simulating video content */}
      <img 
        src="https://picsum.photos/seed/code_video/1280/720" 
        alt="Video Content" 
        className="w-full h-full object-cover opacity-80"
      />
      
      {/* Play Button Overlay (Center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center pl-1 border border-white/30">
            <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>

      {/* Custom Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Progress Bar Container */}
        <div className="px-4 pb-2 w-full relative group/progress">
            {/* Markers */}
            {markers.map((marker, i) => (
                <div 
                    key={i}
                    className="absolute bottom-5 w-2 h-2 rounded-full z-20 hover:scale-150 transition-transform cursor-pointer border border-black/50"
                    style={{ left: marker.left, backgroundColor: marker.color }}
                    title={marker.label}
                />
            ))}
            
            {/* Timeline */}
            <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer relative overflow-hidden group-hover/progress:h-2 transition-all">
                <div className="absolute top-0 left-0 h-full w-[35%] bg-primary rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-sm"></div>
                </div>
            </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-4 pb-4 text-white">
            <div className="flex items-center gap-4">
                <button className="hover:text-primary transition-colors"><Pause className="w-5 h-5 fill-white" /></button>
                <button className="hover:text-primary transition-colors"><SkipForward className="w-5 h-5" /></button>
                <div className="flex items-center gap-2 group/vol">
                    <Volume2 className="w-5 h-5" />
                    <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                        <div className="w-16 h-1 bg-white/30 rounded-full ml-2">
                            <div className="w-[70%] h-full bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
                <span className="text-xs font-mono text-slate-300">12:34 / 45:00</span>
            </div>

            <div className="flex items-center gap-4">
                <button className="text-xs font-semibold hover:bg-white/20 px-2 py-1 rounded transition-colors">1x</button>
                <button className="hover:text-primary transition-colors"><Settings className="w-5 h-5" /></button>
                <button className="hover:text-primary transition-colors"><Maximize className="w-5 h-5" /></button>
            </div>
        </div>
      </div>
    </div>
  );
};
