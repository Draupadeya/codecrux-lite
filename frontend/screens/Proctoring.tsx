
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Monitor, CreditCard, Mic, ChevronDown, Wifi, Camera } from 'lucide-react';
import { CameraPreview } from '../components/Proctoring/CameraPreview';
import { Button } from '../components/ui/Button';
import { SystemCheckItem } from '../types';

interface ProctoringScreenProps {
  onNavigate: (path: string) => void;
}

export const ProctoringScreen: React.FC<ProctoringScreenProps> = ({ onNavigate }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // New verification states
  const [idCaptured, setIdCaptured] = useState(false);
  const [screenShared, setScreenShared] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Guidelines State
  const [openSection, setOpenSection] = useState<string>('key-instructions');

  // Checklist State
  const [checks, setChecks] = useState<SystemCheckItem[]>([
    { id: '1', label: 'Camera & Face', status: 'checking', value: 'Checking...', tip: 'Ensure your face is centered.' },
    { id: '2', label: 'Microphone', status: 'checking', value: 'Checking...', tip: 'Speak to test audio levels.' },
    { id: '3', label: 'Internet Speed', status: 'checking', value: 'Checking...', tip: 'Testing connection stability.' },
    { id: '4', label: 'Screen Share', status: 'checking', value: 'Waiting...', tip: 'Required to monitor tab switching.' },
    { id: '5', label: 'ID Verification', status: 'checking', value: 'Waiting...', tip: 'Place ID card in front of camera.' },
  ]);

  // Check for Mobile
  useEffect(() => {
    if (window.innerWidth < 768) setIsMobile(true);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // System Checks Simulation
  useEffect(() => {
    if (!permissionGranted) return;

    // 1. Face & Camera (Simulated success after permission)
    setTimeout(() => {
        setFaceDetected(true);
        updateCheck('1', 'pass', 'Verified');
    }, 1500);

    // 2. Microphone (Simulated)
    setTimeout(() => {
        setMicActive(true);
        updateCheck('2', 'pass', 'Active');
    }, 2500);

    // 3. Network (Simulated)
    setTimeout(() => {
        updateCheck('3', 'pass', '24 Mbps');
    }, 3500);

  }, [permissionGranted]);

  const updateCheck = (id: string, status: SystemCheckItem['status'], value: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, value } : c));
  };

  const handleCaptureID = () => {
      const btn = document.getElementById('capture-btn');
      if(btn) btn.innerText = "Capturing...";
      
      setTimeout(() => {
          setIdCaptured(true);
          updateCheck('5', 'pass', 'Captured');
      }, 1500);
  };

  const handleShareScreen = () => {
      setScreenShared(true);
      updateCheck('4', 'pass', 'Sharing');
  };

  const allPassed = checks.every(c => c.status === 'pass');

  if (isMobile) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
              <Monitor className="w-16 h-16 text-slate-500 mb-6" />
              <h1 className="text-2xl font-bold mb-2">Desktop Required</h1>
              <p className="text-slate-400">This secure exam environment is only available on desktop or laptop computers. Please switch devices to continue.</p>
              <Button variant="secondary" className="mt-8 w-auto" onClick={() => onNavigate('/dashboard')}>
                  Return to Dashboard
              </Button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-slate-800">Secure Assessment Environment</span>
          </div>
          <div className="text-xs font-medium text-slate-500">
              Session ID: <span className="font-mono text-slate-700">8X92-2291</span>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Camera & Verification (60%) */}
        <div className="flex-[3] p-8 overflow-y-auto bg-[#F8FAFC]">
            <div className="max-w-2xl mx-auto space-y-8">
                
                {/* Welcome / Status */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                        Round 1
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Frontend Engineering Certification</h1>
                    <p className="text-slate-500">Please complete the system verification to unlock the exam.</p>
                </div>

                {/* Camera Feed */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <CameraPreview 
                        permissionGranted={permissionGranted}
                        onPermissionGranted={() => setPermissionGranted(true)}
                        faceDetected={faceDetected}
                    />
                </div>

                {/* Action Buttons */}
                {permissionGranted && (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            id="capture-btn"
                            onClick={handleCaptureID}
                            disabled={idCaptured}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${idCaptured ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600'}`}
                        >
                            <div className={`p-2 rounded-full ${idCaptured ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {idCaptured ? <CheckCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <span className="text-sm font-bold">{idCaptured ? 'ID Verified' : 'Capture ID Card'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Place ID near camera</span>
                        </button>

                        <button 
                            onClick={handleShareScreen}
                            disabled={screenShared}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${screenShared ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600'}`}
                        >
                            <div className={`p-2 rounded-full ${screenShared ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {screenShared ? <CheckCircle className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <span className="text-sm font-bold">{screenShared ? 'Screen Shared' : 'Share Screen'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Entire screen required</span>
                        </button>
                    </div>
                )}

                {/* Start Button Area */}
                <div className="pt-4">
                    <Button 
                        onClick={() => onNavigate('/live-exam')}
                        disabled={!allPassed}
                        className={`w-full h-14 text-lg shadow-xl ${!allPassed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                    >
                        {allPassed ? "Start Assessment" : "Complete Verification to Start"}
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                        <Wifi className="w-3 h-3" />
                        Network Stability: Good (24 Mbps)
                    </p>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: Guidelines (40%) */}
        <div className="flex-[2] bg-white border-l border-slate-200 p-8 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Guidelines
            </h2>

            <div className="space-y-4">
                
                {/* Section 1 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => setOpenSection(openSection === 'key-instructions' ? '' : 'key-instructions')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <span className="font-semibold text-sm text-slate-800">Key Instructions</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openSection === 'key-instructions' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openSection === 'key-instructions' && (
                        <div className="p-4 bg-white text-xs text-slate-600 space-y-3 leading-relaxed border-t border-slate-200 animate-fade-in">
                            <p>• Only the person who registered will be able to take the assessment.</p>
                            <p>• You have to submit answers/code/solutions to all the questions individually.</p>
                            <p>• While you are taking the assessment, your answers are tracked by the system question-wise.</p>
                            <p>• You won't be able to modify your answers during the assessment once submitted.</p>
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 mt-2 font-medium">
                                Any participant resorting to unfair practices will be directly disqualified.
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => setOpenSection(openSection === 'timelines' ? '' : 'timelines')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <span className="font-semibold text-sm text-slate-800">Timelines & Questions</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openSection === 'timelines' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openSection === 'timelines' && (
                        <div className="p-4 bg-white text-xs text-slate-600 space-y-3 border-t border-slate-200 animate-fade-in">
                            <p>• <strong>Assessment Duration:</strong> 01:00:00 (hh:mm:ss)</p>
                            <p>• <strong>Total Questions:</strong> 20 Questions</p>
                            <p>• You can attempt the assessment anytime between the provided assessment window.</p>
                        </div>
                    )}
                </div>

                {/* Section 3 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => setOpenSection(openSection === 'proctoring' ? '' : 'proctoring')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <span className="font-semibold text-sm text-slate-800">Proctoring Guidelines</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openSection === 'proctoring' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openSection === 'proctoring' && (
                        <div className="p-4 bg-white text-xs text-slate-600 space-y-3 border-t border-slate-200 animate-fade-in">
                            <p>• <strong>Full Screen Mode:</strong> The assessment must be taken in full-screen mode. Do not exit or switch tabs.</p>
                            <p>• <strong>Webcam & Mic:</strong> Must be active throughout the duration.</p>
                            <p>• <strong>No External Devices:</strong> Use of mobile phones or additional screens is prohibited.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};
