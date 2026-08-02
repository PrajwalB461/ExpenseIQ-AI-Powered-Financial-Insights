import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, CheckCircle, ShieldAlert, Cpu, Mail, Brain } from 'lucide-react';
import API from '../api';

const Profile = () => {
  const { user } = useAuth();
  const [dbState, setDbState] = useState('CHECKING');
  const [features, setFeatures] = useState({ groq: 'checking', resend: 'checking' });
  const [personalForm, setPersonalForm] = useState({ name: user?.name || 'Demo User', email: user?.email || 'demo@expensetracker.ai' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const res = await API.get('/health');
        if (res.data?.success) {
          setDbState('CONNECTED');
          setFeatures({
            groq: res.data.data.features.groqAiSpace,
            resend: res.data.data.features.resendEmails
          });
        } else {
          setDbState('DEGRADED');
        }
      } catch (err) {
        console.error('Profile fetch status failed', err);
        setDbState('OFFLINE');
      }
    };
    fetchSystemStatus();
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSuccess('Personal details draft saved locally!');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 animate-fade-in">
      {/* Account Settings Forms (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-1">Personal Profile Settings</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">Verify credentials and manage personal interface configurations</p>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-slate-400 uppercase tracking-wider">Default Profile Name</label>
                <input
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-wider">Verify Email Link</label>
                <input
                  type="email"
                  required
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  className="mt-1.5 block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-650 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer hover:bg-violet-600 bg-violet-600"
            >
              Update Profile Data
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-slate-300 mb-4">MERN Stack Backend Environment Details</h2>
          <div className="space-y-3.5 text-xs font-semibold text-slate-350">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">Database Engine Status:</span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                dbState === 'CONNECTED' 
                  ? 'bg-emerald-500/10 text-emerald-450 text-emerald-400' 
                  : 'bg-red-500/10 text-red-400 text-red-550'
              }`}>
                {dbState === 'CONNECTED' ? 'MongoDB Active' : 'Disconnected / Handled'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <span className="text-slate-400">JWT Token Signing Key:</span>
              <span className="font-mono text-[11px] text-slate-400">HS256 (Protected env)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Toggles (Span 1) */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-base font-bold text-white mb-2">AI & Messaging Integrations</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">Monitoring optional environment variables</p>

          <div className="space-y-4">
            {/* Groq check */}
            <div className="flex items-start gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Brain className={`h-5 w-5 shrink-0 ${features.groq?.startsWith('available') ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">GROQ Space API</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  {features.groq?.startsWith('available') ? 'Available: Llama3 configured.' : 'Env variable missing. Sandbox fallback enabled.'}
                </p>
              </div>
            </div>

            {/* Resend check */}
            <div className="flex items-start gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Mail className={`h-5 w-5 shrink-0 ${features.resend?.startsWith('available') ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Resend Mail API</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  {features.resend?.startsWith('available') ? 'Available: Verification emails can send.' : 'Env variable missing. Mock email verified auto.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
