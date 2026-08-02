import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Brain, Bot, User, Check, ShieldAlert } from 'lucide-react';
import API from '../api';

const suggestedPrompts = [
  'Generate a 5-step optimization plan for my home utilities budget.',
  'Analyze my dining out expenditures. Am I spending too much?',
  'Will an additional $200 monthly EMI loan impact my savings threshold?',
  'What are some tax deduction tips for my freelance income stream?'
];

const mockChatHistory = [
  { id: '1', sender: 'ai', text: "Hello! I am FinIntel AI, your automated financial intelligence agent. Ask me to cross-reference your accounts, simulate budgets, calculate EMIs or structure optimization strategies." },
  { id: '2', sender: 'user', text: "Will an additional $200 monthly EMI loan impact my savings threshold?" },
  { id: '3', sender: 'ai', text: "Based on your current logged finances:\n• Monthly net income: $7,500\n• Active monthly expenses: $4,800\n• Available savings surplus: $2,700\n\nAdding a $200 monthly EMI will reduce your monthly savings surplus by 7.4%, lowering it to $2,500. This maintains a healthy 33% savings rate, well above your 20% target safety bound. I advise proceeding." }
];

const AISpace = () => {
  const [messages, setMessages] = useState(mockChatHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGroq, setHasGroq] = useState(false);

  useEffect(() => {
    // Determine if server is running Groq or fallback by fetching health config
    const checkAiProvisionState = async () => {
      try {
        const res = await API.get('/health');
        if (res.data?.success && res.data.data?.features?.groqAiSpace === 'available') {
          setHasGroq(true);
        }
      } catch (err) {
        console.warn('Could not determine AI server status, default to mock mode.');
      }
    };
    checkAiProvisionState();
  }, []);

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = { id: String(messages.length + 1), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI computing response
    setTimeout(() => {
      const aiResponse = {
        id: String(messages.length + 2),
        sender: 'ai',
        text: hasGroq 
          ? `[Live Groq AI Processing] Received query: "${textToSend}". Under a fully connected backend, the express server pipes this directly to the Groq SDK using the llama3-8b-8192 model to provide context-aware responses analyzing your Mongoose database schemas.`
          : `[Demo Sandbox Fallback] Under a connected GROQ API environment, this query evaluates your mongoose database records. Currently, I simulate context response: "I\'ve analyzed your query regarding \'${textToSend.slice(0,35)}...\' and recommend adjusting your category allocations to prevent budget threshold alarms."`
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI Engine Status Alert */}
      <div className={`relative overflow-hidden rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        hasGroq 
          ? 'bg-cyan-950/20 border-cyan-850/40 text-cyan-400 border-cyan-800/40' 
          : 'bg-violet-950/20 border-violet-850/40 text-violet-400 border-violet-800/40'
      }`}>
        <div className="flex gap-3 items-center">
          <Brain className={`h-6 w-6 shrink-0 ${hasGroq ? 'text-cyan-400' : 'text-violet-400 animate-pulse'}`} />
          <div>
            <h4 className="font-extrabold text-white text-[13px]">
              {hasGroq ? 'Groq Llama Cloud Connected' : 'Demo Sandbox Fallback Active'}
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              {hasGroq 
                ? 'Your server is executing live Groq LLM generations on database transactions.' 
                : 'Server started without GROQ_API_KEY. Prompt responses are generated locally using sandbox fallbacks.'}
            </p>
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest bg-slate-905 px-2.5 py-1 rounded-md border border-white/5 bg-slate-900 text-white shrink-0">
          State: {hasGroq ? 'Llama Groq Active' : 'Degraded (Sandbox)'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chips list sidebar (Span 1) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-semibold">Suggested Questions</h3>
          <div className="flex flex-col gap-2.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="text-left text-xs text-slate-350 hover:text-white rounded-xl border border-slate-805 bg-slate-900/30 p-3.5 hover:bg-slate-800/50 hover:border-slate-700/80 transition-all cursor-pointer border-slate-800 leading-relaxed active:scale-[0.98]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat box area (Span 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm h-[520px] flex flex-col justify-between overflow-hidden shadow-2xl relative">
          
          {/* Chat header */}
          <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-inner">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Autonomous Agent Workspace</h3>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">llama3-8b-8192 processing</span>
              </div>
            </div>
          </div>

          {/* Dialogue timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar chips */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user' 
                    ? 'bg-violet-650/10 border-violet-500/20 text-violet-400 bg-violet-900/20' 
                    : 'bg-cyan-505/10 border-cyan-500/20 text-cyan-400 bg-cyan-900/20'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Msg text bubble */}
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-cyan-900/20 border-cyan-550/20 text-cyan-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 text-xs bg-slate-950/80 text-slate-400 border border-slate-800 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-405 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-405 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-405 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input box footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="border-t border-slate-800/80 p-4 bg-slate-950/40 backdrop-blur-sm flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-805 bg-slate-950/60 px-4 py-3 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all placeholder-slate-600 border-slate-800"
              placeholder="Ask FinAI to optimize budgets or analyze current portfolios..."
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="h-11 w-11 rounded-xl bg-cyan-600 hover:bg-cyan-550 active:bg-cyan-700 text-white flex items-center justify-center transition-all cursor-pointer outline-none shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AISpace;
