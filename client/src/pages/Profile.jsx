import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Key, 
  CheckCircle, 
  ShieldAlert, 
  Mail, 
  Download, 
  Upload, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import API from '../api';

const Profile = () => {
  const { user, checkAuthSession, setUser } = useAuth();
  
  // System Health States
  const [dbState, setDbState] = useState('CHECKING');
  const [features, setFeatures] = useState({ groq: 'checking', resend: 'checking' });

  // Profile forms updates configuration states
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome || 0);
  
  // Password changes states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts feedback
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Backup & Restore states
  const [exportLoading, setExportLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  // Load backend health config values
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
        setDbState('OFFLINE');
      }
    };
    fetchSystemStatus();
  }, []);

  // Update initial form parameters if user session fetches later
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMonthlyIncome(user.monthlyIncome || 0);
    }
  }, [user]);

  // Handle personal parameters update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await API.put('/users/me', {
        name,
        monthlyIncome: parseFloat(monthlyIncome) || 0
      });
      if (res.data?.success) {
        setProfileSuccess('Profile preferences updated successfully.');
        // Refresh Auth Context
        if (res.data.data) {
          setUser(prev => ({
            ...prev,
            name: res.data.data.name,
            monthlyIncome: res.data.data.monthlyIncome
          }));
        }
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update personal details.');
    }
  };

  // Handle password rotation updates
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and password confirmation do not match.');
      return;
    }

    try {
      const res = await API.put('/users/me', {
        currentPassword,
        password: newPassword
      });
      if (res.data?.success) {
        setPasswordSuccess('Password successfully modified.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update security credentials.');
    }
  };

  // Handle Excel Export operations
  const handleExportBackup = async () => {
    setExportLoading(true);
    setBackupSuccess('');
    setBackupError('');
    try {
      const res = await API.get('/backup/export', { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${user?.name || 'finintel'}_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setBackupSuccess('Data backup exported successfully! Download triggered.');
    } catch (err) {
      setBackupError('Failed to prepare Excel backup. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Convert uploaded file to base64, then submit
  const handleRestoreBackup = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!confirmCheckbox) {
      setBackupError('Please check the confirmation box to authorize database restore.');
      return;
    }

    setRestoreLoading(true);
    setBackupSuccess('');
    setBackupError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target.result.split(',')[1];
        const res = await API.post('/backup/restore', { fileData: base64 });
        
        if (res.data?.success) {
          setBackupSuccess(res.data.message || 'Data backup restored successfully!');
          setSelectedFile(null);
          setConfirmCheckbox(false);
          // Zero out the file input DOM reference by resetting form
          e.target.reset();
        }
      } catch (err) {
        setBackupError(err.response?.data?.message || 'Verification Error: backup recovery failed.');
      } finally {
        setRestoreLoading(false);
      }
    };
    
    reader.onerror = () => {
      setBackupError('Error reading backup file.');
      setRestoreLoading(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 animate-fade-in text-xs font-semibold text-slate-350">
      
      {/* Settings Forms (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Personal Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-violet-400" />
            Personal Profile Settings
          </h2>
          <p className="text-xs text-slate-400 font-medium">Verify credentials and manage personal interface configurations</p>

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-450 text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-455 text-rose-400">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 font-semibold text-xs text-slate-350">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1.5">Profile Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1.5">Account Email (Static)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="block w-full rounded-xl border border-slate-805 bg-slate-950/20 px-3.5 py-2.5 text-slate-500 border-slate-805/50 border-slate-800 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 uppercase tracking-wider block mb-1.5">Monthly Income Target (INR)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800 font-semibold"
                placeholder="e.g. 50000"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-550 active:bg-violet-700 px-4 py-2.5 font-bold text-white transition-all cursor-pointer outline-none"
            >
              Update Profile Data
            </button>
          </form>
        </div>

        {/* Change password */}
        {user?.authProvider === 'local' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-400" />
              Security Settings
            </h2>
            <p className="text-xs text-slate-400 font-medium">Rotate your authentication passkey credentials</p>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-450 text-emerald-400">
                <CheckCircle className="h-4.5 w-4.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-455 text-rose-400">
                <ShieldAlert className="h-4.5 w-4.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 font-semibold text-xs text-slate-350">
              <div>
                <label className="text-slate-400 uppercase tracking-wider block mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800 font-semibold"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-slate-400 uppercase tracking-wider block mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-805 bg-slate-950/60 px-3.5 py-2.5 text-white focus:border-violet-500 focus:outline-none transition-all border-slate-800 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-650 rounded-xl bg-violet-600 hover:bg-violet-550 active:bg-violet-700 px-4 py-2.5 font-bold text-white transition-all cursor-pointer outline-none"
              >
                Change Passkey Credentials
              </button>
            </form>
          </div>
        )}

        {/* Integration details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-300">Deployment Status Monitor</h2>
          <div className="space-y-3.5 text-xs text-slate-350">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 font-semibold">Database Engine:</span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                dbState === 'CONNECTED' 
                  ? 'bg-emerald-500/10 text-emerald-450 text-emerald-400' 
                  : 'bg-red-500/10 text-red-500 text-red-550'
              }`}>
                {dbState === 'CONNECTED' ? 'MongoDB Active' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 font-semibold">Tokens Config:</span>
              <span className="font-mono text-[10px] text-slate-400">JWT / Cookie Flow</span>
            </div>
          </div>
        </div>

      </div>

      {/* Backup & Restore Column (Span 1) */}
      <div className="space-y-6">
        
        {/* Backup actions card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-cyan-400" />
            Backup & Export Hub
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Download a multi-sheet spreadsheet file mapping your Accounts, Categories, Income, Expenses, Budgets, and recurrent EMI configurations.
          </p>

          {backupSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-450 text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{backupSuccess}</span>
            </div>
          )}
          {backupError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-455 text-rose-400">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span className="break-all">{backupError}</span>
            </div>
          )}

          <button
            onClick={handleExportBackup}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-550 active:bg-cyan-700 px-4 py-3 font-bold text-white transition-all cursor-pointer outline-none disabled:opacity-50"
          >
            {exportLoading ? 'Generating workbook...' : 'Export All Data (.xlsx)'}
          </button>
        </div>

        {/* Restore actions card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-400" />
            Restore Database Hub
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Upload a previously exported workbook to synchronize/append records. The import verifies row contents and rollback modifications in case of validation problems.
          </p>

          <form onSubmit={handleRestoreBackup} className="space-y-4">
            
            {/* File Input Box */}
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/20 p-4 text-center cursor-pointer hover:border-slate-500 transition-colors relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-5 w-5 mx-auto mb-2 text-slate-500" />
              <span className="text-[11px] text-slate-400 tracking-wide block truncate">
                {selectedFile ? selectedFile.name : 'Select backing database spreadsheet...'}
              </span>
            </div>

            {/* Warning Alert Checkbox Gate */}
            {selectedFile && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-amber-400 leading-normal font-semibold">
                    Warning: Restoring will write rows onto your profile. Ensure columns match the template workbook precisely. Partial writes will not occur if validation encounters a error.
                  </span>
                </div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-750 accent-amber-550 border border-slate-800"
                  />
                  I authorize this database write
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={restoreLoading || !selectedFile || !confirmCheckbox}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-650 bg-violet-600 hover:bg-violet-550 active:bg-violet-700 disabled:opacity-50 px-4 py-3 font-bold text-white transition-all cursor-pointer outline-none"
            >
              {restoreLoading ? 'Executing atomic restore...' : 'Restore from Backup'}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
