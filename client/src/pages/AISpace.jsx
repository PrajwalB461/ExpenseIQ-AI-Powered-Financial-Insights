import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Brain, 
  Bot, 
  User, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Info 
} from 'lucide-react';
import API from '../api';

const AISpace = () => {
  // Page States
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am FinIntel AI, your autonomous financial reasoning agent. I have immediate grounding access to your accounts, budgets, EMIs, and category logs. Ask me questions like: "Can I afford a car loan of ₹30,000 monthly?" or "Summarize my current budgets."'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Financial context summary states
  const [aiSummary, setAiSummary] = useState('');
  const [ruleInsights, setRuleInsights] = useState([]);
  const [financialContext, setFinancialContext] = useState(null);
  const [hasGroq, setHasGroq] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const chatEndRef = useRef(null);

  // Fetch financial summary and grounding context on load
  const fetchAISummaryData = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const res = await API.get('/ai/summary');
      if (res.data?.success) {
        setAiSummary(res.data.summary || '');
        setRuleInsights(res.data.ruleInsights || []);
        setFinancialContext(res.data.context || null);
        setHasGroq(res.data.source === 'llm');
      }
    } catch (err) {
      setSummaryError('Failed to synchronize financial context reporting data.');
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchAISummaryData();
  }, []);

  // Scroll to bottom of chat automatically on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send message
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput('');

    // Append user question
    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Map history in formatted form to matches expected input schema: [{role: 'user'|'assistant', content}]
      const historyToPost = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await API.post('/ai/chat', {
        question: userText,
        conversationHistory: historyToPost
      });

      if (res.data?.success) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.data.answer || 'I am processing your details.'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I experienced a connection issue loading this request. Please verify the backend settings.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const selectSuggestedPrompt = (promptText) => {
    setInput(promptText);
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Dynamic Status Header */}
      <div className={`relative overflow-hidden rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xl bg-slate-900/40 ${
        hasGroq 
          ? 'border-cyan-500/20 text-cyan-400' 
          : 'border-amber-500/20 text-amber-500'
      }`}>
        <div className="flex gap-3 items-center">
          <Brain className={`h-6 w-6 shrink-0 ${hasGroq ? 'text-cyan-400' : 'text-amber-500 animate-pulse'}`} />
          <div>
            <h4 className="font-extrabold text-white text-[13px]">
              {hasGroq ? 'Llama Groq AI Space Active' : 'AI Service Running in Fallback Mode'}
            </h4>
            <p className="mt-0.5 text-xs text-slate-400 font-semibold">
              {hasGroq 
                ? 'Your request context is grounded in your database metrics using Llama 3.3 for reasoning.' 
                : 'Groq API Key is not set in backend .env space. Chat replies simulate stub answers and summary falls back to rule-based insights.'}
            </p>
          </div>
        </div>
        <div className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-md border shrink-0 bg-slate-900 ${
          hasGroq ? 'border-cyan-550/20 text-cyan-400' : 'border-amber-550/20 text-amber-550'
        }`}>
          State: {hasGroq ? 'Live reasoning' : 'Fallback Engaged'}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid gap-8 lg:grid-cols-5">
        
        {/* Left half: Diagnostics & Summary Cards (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-5 border border-violet-850 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              Dynamic AI Summary
            </h3>
            
            {loadingSummary ? (
              <div className="py-8 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-violet-500/25 border-t-violet-500" />
              </div>
            ) : summaryError ? (
              <p className="text-[10px] text-red-400">{summaryError}</p>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                {aiSummary}
              </p>
            )}
          </div>

          {/* Financial Summary parameters cards */}
          {financialContext && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Totals Gains</span>
                <span className="text-sm font-black text-emerald-450 block text-emerald-400">
                  {formatINR(financialContext.summary?.totalIncome || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Totals Outflow</span>
                <span className="text-sm font-black text-rose-455 block text-rose-400">
                  {formatINR(financialContext.summary?.totalExpense || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Net Savings</span>
                <span className={`text-sm font-black block ${
                  (financialContext.summary?.netSavings || 0) >= 0 ? 'text-indigo-400' : 'text-rose-400'
                }`}>
                  {formatINR(financialContext.summary?.netSavings || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Rule-based telemetry logs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-violet-400" />
              Dynamic Financial Telemetry Logs
            </h3>
            
            {loadingSummary ? (
              <div className="space-y-2 py-4">
                <div className="h-4 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
              </div>
            ) : ruleInsights.length > 0 ? (
              <div className="space-y-3 font-semibold">
                {ruleInsights.map((insight, idx) => {
                  const isAnomaly = insight.includes('⚠️') || insight.toLowerCase().includes('anomaly');
                  return (
                    <div 
                      key={idx}
                      className={`rounded-xl p-3 border flex gap-2.5 items-start text-xs text-slate-350 leading-relaxed font-semibold transition-colors ${
                        isAnomaly 
                          ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20' 
                          : 'bg-slate-950/20 border-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className={`mt-0.5 font-bold ${isAnomaly ? 'text-rose-455 text-rose-450 text-red-500' : 'text-violet-400'}`}>
                        {isAnomaly ? '⚠️' : '⚡'}
                      </span>
                      <span>{insight}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Record a few transactions to trigger rule based analytics logs.</p>
            )}
          </div>

          {/* Suggested Prompts sidebar menu */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
              <Info className="h-4 w-4 text-slate-500" />
              Suggested Chat Inputs
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'Can I afford a car loan of ₹25,000 monthly output?',
                'List all active budgets limits and tell me if I exceed.',
                'Analyze my dynamic saving rate.',
                'Which accounts hold my reserves?'
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestedPrompt(prompt)}
                  disabled={isTyping}
                  className="text-left text-xs bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 leading-relaxed text-slate-400 hover:text-white cursor-pointer active:scale-[0.98] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right half: Chat view interface (Span 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 shadow-2xl h-[560px] flex flex-col justify-between overflow-hidden relative">
          
          {/* Workspace Chat Header */}
          <div className="bg-slate-900/80 border-b border-slate-850 px-6 py-4 border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-550/10 bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-inner">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Grounded Reasoning Agent</h3>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                  {hasGroq ? 'Llama 3.3 Connected' : 'Mock Response Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages list conversation viewport */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                  m.role === 'user'
                    ? 'bg-violet-650/10 border-violet-500/20 text-violet-400 bg-violet-900/20'
                    : 'bg-cyan-550/10 border-cyan-500/20 text-cyan-400 bg-cyan-900/20'
                }`}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`rounded-2xl px-4 py-3 leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600/90 text-white rounded-tr-none'
                    : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line font-semibold'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full border bg-cyan-900/20 border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-slate-950/85 text-slate-400 border border-slate-800 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Bar FORM */}
          <form onSubmit={handleSend} className="border-t border-slate-850 border-slate-800 p-4 bg-slate-950/40 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-805 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 border-slate-800 font-semibold"
              placeholder={isTyping ? 'Grounded engine is thinking...' : 'Ask FinIntel AI anything about your logs status...'}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="h-11 w-11 rounded-xl bg-cyan-600 hover:bg-cyan-550 active:bg-cyan-700 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
