
import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Maximize2, Video, Mic, Wifi, AlertTriangle } from 'lucide-react';

interface FloatingWebcamProps {
  className?: string;
}

export const FloatingWebcam: React.FC<FloatingWebcamProps> = ({ className = "bottom-6 right-6" }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false); // Simplified for this demo to fixed positions
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start Camera
    const startCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            console.error("Camera access denied", e);
        }
    };
    startCam();
  }, []);

  if (isMinimized) {
      return (
          <div className={`fixed z-50 animate-fade-in ${className}`}>
              <button 
                onClick={() => setIsMinimized(false)}
                className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-2xl border border-slate-700/50 flex items-center gap-3 hover:scale-105 transition-transform group"
              >
                  <div className="relative">
                    <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                  <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Proctoring</span>
                      <span className="text-xs font-bold text-white leading-none">Active</span>
                  </div>
                  <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-white ml-2" />
              </button>
          </div>
      );
  }

  return (
    <div className={`fixed z-50 w-64 md:w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-slide-up transition-all duration-300 hover:shadow-indigo-500/20 ${className}`}>
        {/* Header / Controls */}
        <div className="h-8 bg-slate-800/80 backdrop-blur-md flex items-center justify-between px-3 cursor-move border-b border-slate-700">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Live Rec</span>
            </div>
            <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <button 
                    onClick={() => setIsMinimized(true)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Minimize View"
                >
                    <Minimize2 className="w-3 h-3" />
                </button>
            </div>
        </div>

        {/* Video Feed */}
        <div className="relative aspect-video bg-black group">
            <video 
                ref={videoRef}
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-cover transform -scale-x-100 opacity-90"
            />
            
            {/* Status Overlay */}
            <div className="absolute bottom-2 left-2 flex gap-1">
                <div className="bg-black/50 backdrop-blur-md p-1 rounded border border-white/10" title="Video Active">
                    <Video className="w-3 h-3 text-white" />
                </div>
                <div className="bg-black/50 backdrop-blur-md p-1 rounded border border-white/10" title="Mic Active">
                    <Mic className="w-3 h-3 text-white" />
                </div>
            </div>
        </div>
        
        {/* Anti-Cheat Status */}
        <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400">Environment Check</span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                Secure <span className="text-emerald-500">✓</span>
            </span>
        </div>
    </div>
  );
};
