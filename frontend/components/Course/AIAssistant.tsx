import React, { useState } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';
import { ChatMessage } from '../../types';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: "Hello! I'm your AI learning assistant. I can help clarify concepts from this video or generate quiz questions. What do you need?", sender: 'ai', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
        const aiMsg: ChatMessage = { 
            id: (Date.now() + 1).toString(), 
            text: "That's a great question about React hooks. The useEffect hook is primarily used for side effects in functional components.", 
            sender: 'ai', 
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-2">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                    max-w-[80%] rounded-2xl px-4 py-3 text-sm
                    ${msg.sender === 'user' 
                        ? 'bg-[#EEF2FF] text-slate-800 rounded-br-none' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
                    }
                `}>
                    {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2 mb-1 text-xs text-primary font-bold">
                            <Bot className="w-3 h-3" />
                            AI Coach
                        </div>
                    )}
                    {msg.text}
                </div>
            </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 relative">
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about this module..."
            className="w-full h-12 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
        />
        <button 
            onClick={handleSend}
            className="absolute right-2 top-4 bottom-0 my-auto h-8 w-8 flex items-center justify-center text-primary hover:bg-indigo-50 rounded-lg transition-colors mt-1"
        >
            <Send className="w-4 h-4" />
        </button>
        
        <button className="absolute right-12 top-5 flex items-center gap-1 text-[10px] bg-gradient-to-r from-primary to-secondary text-white px-2 py-0.5 rounded-full hover:opacity-90 transition-opacity">
            <Sparkles className="w-2 h-2" />
            Hint
        </button>
      </div>
    </div>
  );
};
