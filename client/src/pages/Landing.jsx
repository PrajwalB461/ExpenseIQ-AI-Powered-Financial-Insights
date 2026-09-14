import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotebookPen, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Glow overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-cyan-950/10 to-transparent pointer-events-none"></div>

      {/* Header Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-violet-600 to-indigo-650 rounded-xl flex items-center justify-center text-white shadow-lg">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ExpenseIQ AI</span>
            <span className="block text-[9px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">
            AI Powered Financial Insights
          </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-750 text-white rounded-xl px-4 py-2 border border-violet-500/20 shadow-md transition-all text-xs"
            >
              Enter Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-xs">Sign In</Link>
              <Link 
                to="/register" 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-800/30 bg-violet-950/30 text-xs font-semibold text-violet-300 shadow-sm animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation MERN Architecture Active</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Smart Financial Expense<br className="hidden sm:inline" />
          Tracker By Prajwal
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          ExpenseIQ AI connects your banking categories, loan EMIs, and utility bounds under a integrated analytics console. Get predictive restructuring logs powered by Groq LLMs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm pt-4">
          {isAuthenticated ? (
            <Link 
              to="/dashboard"
              className="w-full bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white font-bold rounded-xl py-3 shadow-lg shadow-violet-900/30 transition-all text-sm flex items-center justify-center gap-2 bg-violet-600"
            >
              Return to Control Deck
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link 
                to="/register"
                className="w-full bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white font-bold rounded-xl py-3 shadow-lg shadow-violet-900/30 transition-all text-sm bg-violet-600"
              >
                Create Workspace
              </Link>
              <Link 
                to="/login"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-3 border border-slate-850 hover:border-slate-700 transition-all text-xs"
              >
                Sign In to Session
              </Link>
            </>
          )}
        </div>

        {/* Value Prop Highlights */}
        <div className="grid gap-6 sm:grid-cols-3 w-full max-w-5xl pt-16 text-left">
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-750 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 border border-violet-500/10 mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Real-time Analytics</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Cross-reference active earnings vs utility expenditure caps in polished visual graphs.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-750 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-cyan-600/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10 mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">FinAI Processing</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Run local or cloud-pipe Groq models to restrucuture budgeting bounds dynamically.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-750 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-650/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 mb-4 bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">HTTP-Only Security</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Session state token signing stored in HttpOnly secure cookies. Your passwords are double encrypted.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-655 relative z-10 text-slate-500">
        &copy; {new Date().getFullYear()} ExpenseIQ AI MERN Space. MIT License.
      </footer>
    </div>
  );
};

export default Landing;
