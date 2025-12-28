import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../components/Lab/CodeEditor';
import { PreviewPane } from '../components/Lab/PreviewPane';
import { Snippet } from '../types';
import { 
  Play, ChevronLeft, Menu, 
  Save, Check, ChevronDown, 
  Monitor, Code2, Coffee, FileJson, Cpu,
  Plus, Trash2, Clock, Search, Layout, FileCode
} from 'lucide-react';

interface PracticeLabProps {
  onNavigate: (path: string) => void;
}

// Language Config
const LANGUAGES = [
    { id: 'web', name: 'Web (HTML/CSS/JS)', icon: Monitor, color: 'text-blue-400' },
    { id: 'python', name: 'Python 3', icon: FileJson, color: 'text-yellow-400' },
    { id: 'java', name: 'Java', icon: Coffee, color: 'text-orange-400' },
    { id: 'cpp', name: 'C++', icon: Code2, color: 'text-blue-600' },
    { id: 'go', name: 'Go', icon: Cpu, color: 'text-cyan-400' },
] as const;

type LanguageId = typeof LANGUAGES[number]['id'];

export const PracticeLabScreen: React.FC<PracticeLabProps> = ({ onNavigate }) => {
  // --- View State ---
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  
  // --- Snippets Data ---
  const [snippets, setSnippets] = useState<Snippet[]>([
      {
          id: '1',
          title: 'Landing Page Prototype',
          language: 'web',
          code: {
              html: '<h1>Welcome</h1>\n<p>This is a prototype.</p>',
              css: 'body { font-family: sans-serif; padding: 20px; }',
              js: 'console.log("Loaded");'
          },
          lastModified: new Date(Date.now() - 86400000)
      },
      {
          id: '2',
          title: 'Binary Search Algorithm',
          language: 'python',
          code: {
              main: 'def binary_search(arr, x):\n    low = 0\n    high = len(arr) - 1\n    mid = 0\n    while low <= high:\n        mid = (high + low) // 2\n        if arr[mid] < x:\n            low = mid + 1\n        elif arr[mid] > x:\n            high = mid - 1\n        else:\n            return mid\n    return -1\n\narr = [2, 3, 4, 10, 40]\nx = 10\nresult = binary_search(arr, x)\nprint("Element is present at index", str(result))'
          },
          lastModified: new Date(Date.now() - 172800000)
      }
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Editor State ---
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<typeof LANGUAGES[number]>(LANGUAGES[0]);
  const [snippetTitle, setSnippetTitle] = useState('Untitled Snippet');
  
  // Code Content State
  const [webCode, setWebCode] = useState({ html: '', css: '', js: '' });
  const [mainCode, setMainCode] = useState('');
  
  // UI State
  const [activeWebTab, setActiveWebTab] = useState<'html' | 'css' | 'js'>('html');
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [runTrigger, setRunTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // --- Helpers ---
  const filteredSnippets = snippets.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLangConfig = (id: string) => LANGUAGES.find(l => l.id === id) || LANGUAGES[0];

  const createNewSnippet = () => {
      const newId = Date.now().toString();
      const defaultLang = LANGUAGES[0];
      
      setCurrentSnippetId(newId);
      setSnippetTitle('Untitled Snippet');
      setSelectedLanguage(defaultLang);
      
      // Reset Code
      setWebCode({ 
          html: '<!-- Start coding -->\n<div class="container">\n  <h1>Hello World</h1>\n</div>', 
          css: 'body { margin: 0; padding: 20px; font-family: sans-serif; }', 
          js: 'console.log("Ready");' 
      });
      setMainCode('');
      
      setView('editor');
  };

  const openSnippet = (snippet: Snippet) => {
      setCurrentSnippetId(snippet.id);
      setSnippetTitle(snippet.title);
      setSelectedLanguage(getLangConfig(snippet.language));
      
      if (snippet.language === 'web') {
          setWebCode({
              html: snippet.code.html || '',
              css: snippet.code.css || '',
              js: snippet.code.js || ''
          });
      } else {
          setMainCode(snippet.code.main || '');
      }
      
      setView('editor');
  };

  const deleteSnippet = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const saveSnippet = () => {
      setIsSaving(true);
      setTimeout(() => {
          const updatedSnippet: Snippet = {
              id: currentSnippetId!,
              title: snippetTitle,
              language: selectedLanguage.id as LanguageId,
              lastModified: new Date(),
              code: selectedLanguage.id === 'web' ? { ...webCode } : { main: mainCode }
          };

          setSnippets(prev => {
              const exists = prev.find(s => s.id === currentSnippetId);
              if (exists) {
                  return prev.map(s => s.id === currentSnippetId ? updatedSnippet : s);
              } else {
                  return [updatedSnippet, ...prev];
              }
          });
          
          setIsSaving(false);
      }, 800);
  };

  const handleLanguageSwitch = (lang: typeof LANGUAGES[number]) => {
      setSelectedLanguage(lang);
      setIsLangMenuOpen(false);
      // Reset code for new language template if switching (optional, could preserve)
      if (lang.id !== 'web' && !mainCode) {
         setMainCode(`// New ${lang.name} File\n\n`);
      }
  };

  const handleRun = () => {
      setRunTrigger(prev => prev + 1);
      if (selectedLanguage.id !== 'web') {
          setTerminalOutput(`> Compiling ${selectedLanguage.name}...\n> Running...\n\nOutput:\nHello form ${selectedLanguage.name}!\nProcess exited with code 0.`);
      }
  };

  // --- RENDER DASHBOARD ---
  if (view === 'dashboard') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => onNavigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">My Playground</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg w-64">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search snippets..." 
                            className="bg-transparent border-none text-sm focus:outline-none w-full text-slate-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Actions */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Saved Snippets</h2>
                        <p className="text-sm text-slate-500">Manage and resume your coding sessions</p>
                    </div>
                    <button 
                        onClick={createNewSnippet}
                        className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Snippet</span>
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card (Visual shortcut) */}
                    <button 
                        onClick={createNewSnippet}
                        className="group flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-3">
                            <Plus className="w-6 h-6 text-indigo-500" />
                        </div>
                        <span className="font-semibold text-slate-600 group-hover:text-indigo-600">Create New</span>
                    </button>

                    {filteredSnippets.map((snippet) => {
                        const LangIcon = getLangConfig(snippet.language).icon;
                        const langColor = getLangConfig(snippet.language).color;
                        
                        return (
                            <div 
                                key={snippet.id}
                                onClick={() => openSnippet(snippet)}
                                className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl bg-slate-50 ${langColor} group-hover:scale-110 transition-transform duration-300`}>
                                        <LangIcon className="w-6 h-6" />
                                    </div>
                                    <button 
                                        onClick={(e) => deleteSnippet(e, snippet.id)}
                                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{snippet.title}</h3>
                                <p className="text-xs text-slate-500 font-medium mb-4">{getLangConfig(snippet.language).name}</p>
                                
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-auto">
                                    <Clock className="w-3 h-3" />
                                    <span>Edited {new Date(snippet.lastModified).toLocaleDateString()}</span>
                                </div>

                                {/* Active Strip */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </div>
                        );
                    })}
                </div>

                {filteredSnippets.length === 0 && (
                    <div className="text-center py-12">
                         <p className="text-slate-400">No snippets found matching your search.</p>
                    </div>
                )}
            </main>
        </div>
      );
  }

  // --- RENDER EDITOR ---
  return (
    <div className="h-screen flex flex-col bg-[#1E1E1E] text-white overflow-hidden font-sans">
      
      {/* --- Header --- */}
      <header className="h-[56px] bg-[#1E1E1E] border-b border-[#3E3E42] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setView('dashboard')}
                className="text-[#CCCCCC] hover:text-white flex items-center gap-2 text-xs font-medium px-2 py-1 rounded hover:bg-[#333333] transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="h-6 w-px bg-[#3E3E42]"></div>

            {/* Title Input */}
            <input 
                type="text" 
                value={snippetTitle}
                onChange={(e) => setSnippetTitle(e.target.value)}
                className="bg-transparent border border-transparent hover:border-[#3E3E42] focus:border-[#0078D4] rounded px-2 py-1 text-sm font-semibold text-white focus:outline-none w-32 sm:w-64 transition-all truncate"
            />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
            
            {/* Language Selector */}
            <div className="relative">
                <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-2 text-xs font-medium text-[#CCCCCC] hover:text-white hover:bg-[#333333] px-3 py-1.5 rounded transition-colors cursor-pointer"
                >
                    <selectedLanguage.icon className={`w-3.5 h-3.5 ${selectedLanguage.color}`} />
                    <span className="hidden sm:inline">{selectedLanguage.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {isLangMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-1 w-56 bg-[#252526] border border-[#454545] rounded-md shadow-2xl z-50 py-1 animate-fade-in">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.id}
                                    onClick={() => handleLanguageSwitch(lang)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#094771] hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                    <lang.icon className={`w-4 h-4 ${lang.id === selectedLanguage.id ? 'text-white' : lang.color}`} />
                                    <span className={lang.id === selectedLanguage.id ? 'font-bold' : 'text-[#CCCCCC]'}>{lang.name}</span>
                                    {lang.id === selectedLanguage.id && <Check className="w-3 h-3 ml-auto text-white" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={saveSnippet}
                disabled={isSaving}
                className="flex items-center gap-2 text-[#CCCCCC] hover:text-white hover:bg-[#333333] px-3 py-1.5 rounded transition-all text-xs font-medium"
            >
                {isSaving ? <span className="animate-pulse">Saving...</span> : (
                    <>
                        <Save className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Save</span>
                    </>
                )}
            </button>

            <button 
                onClick={handleRun}
                className="flex items-center gap-2 bg-[#0078D4] hover:bg-[#006BBF] text-white px-4 py-1.5 rounded-sm text-xs font-semibold transition-all active:scale-95 shadow-sm ml-2"
            >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
            </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-b border-[#3E3E42] bg-[#252526] shrink-0">
            <button 
                onClick={() => setActiveMobileTab('editor')}
                className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 ${activeMobileTab === 'editor' ? 'border-[#0078D4] text-white' : 'border-transparent text-[#858585]'}`}
            >
                Code Editor
            </button>
            <button 
                onClick={() => setActiveMobileTab('preview')}
                className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 ${activeMobileTab === 'preview' ? 'border-[#0078D4] text-white' : 'border-transparent text-[#858585]'}`}
            >
                {selectedLanguage.id === 'web' ? 'Live Preview' : 'Console Output'}
            </button>
        </div>

        {/* --- Editor Section --- */}
        <div className={`
            flex-1 flex flex-col min-w-0 border-r border-[#3E3E42] bg-[#1E1E1E]
            ${activeMobileTab === 'editor' ? 'flex' : 'hidden md:flex'}
        `}>
            {selectedLanguage.id === 'web' ? (
                // Web Tabs
                <div className="flex flex-col h-full">
                    {/* File Tabs */}
                    <div className="flex bg-[#252526] border-b border-[#3E3E42]">
                        <button onClick={() => setActiveWebTab('html')} className={`px-4 py-2 text-xs border-r border-[#3E3E42] flex items-center gap-2 ${activeWebTab === 'html' ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#E34F26]' : 'text-[#969696] hover:bg-[#2D2D2D]'}`}>
                            <span className="text-[#E34F26] font-bold">HTML</span> index.html
                        </button>
                        <button onClick={() => setActiveWebTab('css')} className={`px-4 py-2 text-xs border-r border-[#3E3E42] flex items-center gap-2 ${activeWebTab === 'css' ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#264DE4]' : 'text-[#969696] hover:bg-[#2D2D2D]'}`}>
                            <span className="text-[#264DE4] font-bold">CSS</span> style.css
                        </button>
                        <button onClick={() => setActiveWebTab('js')} className={`px-4 py-2 text-xs border-r border-[#3E3E42] flex items-center gap-2 ${activeWebTab === 'js' ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#F7DF1E]' : 'text-[#969696] hover:bg-[#2D2D2D]'}`}>
                            <span className="text-[#F7DF1E] font-bold">JS</span> script.js
                        </button>
                    </div>
                    {/* Editors */}
                    <div className="flex-1 relative">
                        <div className={`absolute inset-0 ${activeWebTab === 'html' ? 'z-10' : 'z-0 invisible'}`}>
                            <CodeEditor language="html" code={webCode.html} onChange={(val) => setWebCode(prev => ({...prev, html: val}))} />
                        </div>
                        <div className={`absolute inset-0 ${activeWebTab === 'css' ? 'z-10' : 'z-0 invisible'}`}>
                            <CodeEditor language="css" code={webCode.css} onChange={(val) => setWebCode(prev => ({...prev, css: val}))} />
                        </div>
                        <div className={`absolute inset-0 ${activeWebTab === 'js' ? 'z-10' : 'z-0 invisible'}`}>
                            <CodeEditor language="javascript" code={webCode.js} onChange={(val) => setWebCode(prev => ({...prev, js: val}))} />
                        </div>
                    </div>
                </div>
            ) : (
                // Single File Editor
                <div className="flex flex-col h-full">
                    <div className="flex bg-[#252526] border-b border-[#3E3E42]">
                        <div className="px-4 py-2 text-xs bg-[#1E1E1E] text-white border-r border-[#3E3E42] flex items-center gap-2">
                             <FileCode className={`w-3 h-3 ${selectedLanguage.color}`} />
                             main.{selectedLanguage.id === 'python' ? 'py' : selectedLanguage.id === 'java' ? 'java' : 'cpp'}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                         <CodeEditor language={selectedLanguage.id} code={mainCode} onChange={setMainCode} />
                    </div>
                </div>
            )}
        </div>

        {/* --- Output Section --- */}
        <div className={`
            md:w-[40%] bg-white flex-col
            ${activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'}
        `}>
             <PreviewPane 
                mode={selectedLanguage.id === 'web' ? 'web' : 'terminal'}
                html={webCode.html}
                css={webCode.css}
                js={webCode.js}
                terminalOutput={terminalOutput}
                runTrigger={runTrigger}
             />
        </div>
      </div>
    </div>
  );
};
