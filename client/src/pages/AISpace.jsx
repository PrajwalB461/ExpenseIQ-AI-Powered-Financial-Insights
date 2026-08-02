import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertTriangle, Activity, Info } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';

const AISpace = () => {
  // Page States
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am FinIntel AI, your bookkeeping reasoning agent. I have immediate grounding access to your accounts, budgets, EMIs, and category logs. Ask me questions like: "Can I afford a car loan of ₹30,000 monthly?" or "Summarize my current budgets."'
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
      setSummaryError('Failed to synchronize financial context bookkeeping data.');
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6 text-xs text-ink font-semibold">
      
      {/* Dynamic Status Header */}
      <LedgerCard 
        title={hasGroq ? "Autonomous AI Reasoning Active" : "AI Service (Fallback Mode)"}
        subtitle="GROUNDING TELEMETRY VERIFICATION"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-ink-muted">
            {hasGroq 
              ? 'Your query context is currently grounded in your local database metrics using Llama 3.3 for analytical reasoning.' 
              : 'Groq API Key (GROQ_API_KEY) is not configured in backend environment space. Chat answers are simulated.'}
          </p>
          <div className="shrink-0">
            <span className={`px-3 py-1 rounded border text-[9px] uppercase tracking-wider font-bold ${
              hasGroq ? 'border-brand text-ink-green bg-ink-green/5' : 'border-warning text-warning bg-warning/5'
            }`}>
              {hasGroq ? 'Live Reasoning' : 'Fallback Engaged'}
            </span>
          </div>
        </div>
      </LedgerCard>

      {/* Main Split Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Left half: Diagnostics & Summary Cards (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          <LedgerCard title="Dynamic Bookkeeping Summary" subtitle="RULE-BASED INSIGHT ENGINE">
            {loadingSummary ? (
              <div className="py-8 flex justify-center items-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : summaryError ? (
              <p className="text-[10px] text-ink-red pt-1">{summaryError}</p>
            ) : (
              <p className="text-xs text-ink leading-relaxed font-semibold pt-1">
                {aiSummary}
              </p>
            )}
          </LedgerCard>

          {/* Financial Summary parameters cards */}
          {financialContext && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded border border-rule bg-surface p-4 text-right">
                <span className="text-[8px] uppercase tracking-wider text-ink-muted font-bold block mb-1">Total Income</span>
                <span className="text-sm font-bold font-mono text-ink-green block">
                  ₹{formatINR(financialContext.summary?.totalIncome || 0)}
                </span>
              </div>
              <div className="rounded border border-rule bg-surface p-4 text-right">
                <span className="text-[8px] uppercase tracking-wider text-ink-muted font-bold block mb-1">Total Expense</span>
                <span className="text-sm font-bold font-mono text-ink-red block">
                  ₹{formatINR(financialContext.summary?.totalExpense || 0)}
                </span>
              </div>
              <div className="rounded border border-rule bg-surface p-4 text-right">
                <span className="text-[8px] uppercase tracking-wider text-ink-muted font-bold block mb-1">Net Savings</span>
                <span className={`text-sm font-bold font-mono block ${
                  (financialContext.summary?.netSavings || 0) >= 0 ? 'text-ink-green' : 'text-ink-red'
                }`}>
                  ₹{formatINR(financialContext.summary?.netSavings || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Rule-based telemetry logs */}
          <LedgerCard title="Telemetry Insights" subtitle="Autonomous Ledger Scan Rules">
            {loadingSummary ? (
              <div className="space-y-2 py-4">
                <div className="h-4 bg-surface rounded animate-pulse" />
                <div className="h-4 bg-surface rounded animate-pulse w-3/4" />
              </div>
            ) : ruleInsights.length > 0 ? (
              <div className="space-y-3 pt-2">
                {ruleInsights.map((insight, idx) => {
                  const isAnomaly = insight.includes('⚠️') || insight.toLowerCase().includes('anomaly');
                  return (
                    <div 
                      key={idx}
                      className={`rounded p-3 border flex gap-2.5 items-start text-xs text-ink leading-relaxed transition-all ${
                        isAnomaly 
                          ? 'bg-danger/5 border-danger/25 text-ink-red' 
                          : 'bg-surface border-rule text-ink'
                      }`}
                    >
                      <span className={`mt-0.5 font-bold ${isAnomaly ? 'text-ink-red' : 'text-accent-brass'}`}>
                        {isAnomaly ? '⚠️' : '⚡'}
                      </span>
                      <span>{insight}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-muted pt-2 font-medium">Add expense logs to generate insight reports.</p>
            )}
          </LedgerCard>

          {/* Suggested Prompts */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5 leading-none font-serif">
              <Info className="h-4 w-4 text-ink-muted" />
              Suggested Queries
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
                  className="text-left text-xs bg-surface hover:bg-bg border border-rule rounded p-3 leading-relaxed text-ink hover:text-brand cursor-pointer active:scale-[0.98] transition-all font-semibold outline-none focus:border-brand"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right half: Chat view interface (Span 3) */}
        <div className="lg:col-span-3">
          <LedgerCard title="Grounded Reasoning Chat" subtitle="Chat sandbox with grounded memory logs">
            <div className="h-[430px] flex flex-col justify-between overflow-hidden relative pt-2">
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {messages.map((m) => (
                  <div 
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`h-8 w-8 rounded-full border border-rule flex items-center justify-center shrink-0 bg-bg text-ink-muted font-bold`}>
                      {m.role === 'user' ? 'U' : 'AI'}
                    </div>

                    <div className={`rounded px-4 py-3 leading-relaxed text-xs font-semibold ${
                      m.role === 'user'
                        ? 'bg-brand text-white rounded-tr-none'
                        : 'bg-surface text-ink border border-rule rounded-tl-none whitespace-pre-line'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full border border-rule bg-bg text-ink-muted flex items-center justify-center font-bold">
                      AI
                    </div>
                    <div className="rounded px-4 py-3 bg-surface text-ink-muted border border-rule flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Footer Input Bar */}
              <form onSubmit={handleSend} className="border-t border-rule pt-4 flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  className="flex-1 rounded border border-rule bg-surface px-4 py-3 text-ink placeholder-ink-muted focus:outline-none focus:border-brand font-semibold text-xs"
                  placeholder={isTyping ? 'Grounded engine is reasoning...' : 'Type query to search grounded book status...'}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="h-11 px-5 rounded bg-brand hover:bg-brand-hover text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shrink-0 outline-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </LedgerCard>
        </div>

      </div>

    </div>
  );
};

export default AISpace;
