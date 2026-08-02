import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, CheckCircle, ShieldAlert, AlertTriangle, Download, Upload } from 'lucide-react';
import API from '../api';
import LedgerCard from '../components/LedgerCard';

const Profile = () => {
  const { user, setUser } = useAuth();
  
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
    <div className="grid gap-6 lg:grid-cols-3 text-xs font-semibold text-ink">
      
      {/* Settings Forms (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Personal Details */}
        <LedgerCard title="Personal Profile Settings" subtitle="Verify and modify settings options">
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded border border-ink-green/20 bg-ink-green/5 p-3 text-ink-green mb-4">
              <CheckCircle className="h-4.5 w-4.5" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red mb-4">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 font-semibold pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-ink-muted uppercase tracking-wider block mb-1">Profile Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold"
                />
              </div>
              <div>
                <label className="text-ink-muted uppercase tracking-wider block mb-1">Account Email (Static)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="block w-full rounded border border-rule bg-bg px-3 py-2 text-ink-muted cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-ink-muted uppercase tracking-wider block mb-1">Monthly Income (INR)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-mono font-semibold"
                placeholder="e.g. 50000"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover px-4 py-2.5 font-bold text-white transition-all cursor-pointer outline-none"
            >
              Update Profile Data
            </button>
          </form>
        </LedgerCard>

        {/* Change password */}
        {user?.authProvider === 'local' && (
          <LedgerCard title="Security Credentials Settings" subtitle="Rotate auth passwords">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded border border-ink-green/20 bg-ink-green/5 p-3 text-ink-green mb-4">
                <CheckCircle className="h-4.5 w-4.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red mb-4">
                <ShieldAlert className="h-4.5 w-4.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 font-semibold pt-2">
              <div>
                <label className="text-ink-muted uppercase tracking-wider block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-ink-muted uppercase tracking-wider block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold"
                  />
                </div>
                <div>
                  <label className="text-ink-muted uppercase tracking-wider block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded border border-rule bg-surface px-3 py-2 text-ink focus:outline-none focus:border-brand font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover px-4 py-2.5 font-bold text-white transition-all cursor-pointer outline-none"
              >
                Change Passkey
              </button>
            </form>
          </LedgerCard>
        )}

        {/* Integration details */}
        <LedgerCard title="Deployment Status Monitor" subtitle="Diagnostics and configuration targets">
          <div className="space-y-3.5 pt-2">
            <div className="flex justify-between items-center bg-surface p-3 rounded border border-rule">
              <span className="text-ink font-semibold">Database Engine:</span>
              <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold border ${
                dbState === 'CONNECTED' 
                  ? 'border-brand text-ink-green bg-ink-green/5' 
                  : 'border-danger text-ink-red bg-danger/5'
              }`}>
                {dbState === 'CONNECTED' ? 'MongoDB Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-surface p-3 rounded border border-rule">
              <span className="text-ink font-semibold">Security Token Mode:</span>
              <span className="font-mono text-[10px] text-ink-muted">JWT Cookie Auth Flow</span>
            </div>
          </div>
        </LedgerCard>

      </div>

      {/* Backup & Restore Column (Span 1) */}
      <div className="space-y-6">
        
        {/* Backup actions card */}
        <LedgerCard title="Backup & Export Hub" subtitle="DOWNLOAD SPREADSHEET ARCHIVES">
          <p className="text-xs text-ink-muted font-medium leading-relaxed pt-1">
            Download a multi-sheet spreadsheet file mapping your Accounts, Categories, Income, Expenses, Budgets, and recurrent EMI configurations.
          </p>

          {backupSuccess && (
            <div className="flex items-center gap-2 rounded border border-ink-green/20 bg-ink-green/5 p-3 text-ink-green my-4">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{backupSuccess}</span>
            </div>
          )}
          {backupError && (
            <div className="flex items-center gap-2 rounded border border-danger/25 bg-danger/5 p-3 text-ink-red my-4">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span className="break-all">{backupError}</span>
            </div>
          )}

          <button
            onClick={handleExportBackup}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover px-4 py-3 font-bold text-white transition-all cursor-pointer outline-none disabled:opacity-50 mt-4"
          >
            {exportLoading ? 'Generating workbook...' : 'Export All Data (.xlsx)'}
          </button>
        </LedgerCard>

        {/* Restore actions card */}
        <LedgerCard title="Restore Database Hub" subtitle="ATOMIC DATA RECOVERY HUB">
          <p className="text-xs text-ink-muted font-medium leading-relaxed pt-1">
            Upload a previously exported workbook to synchronize/append records. The import verifies row contents and rollback modifications in case of validation problems.
          </p>

          <form onSubmit={handleRestoreBackup} className="space-y-4 pt-2">
            
            {/* File Input Box */}
            <div className="rounded border border-dashed border-rule bg-surface p-4 text-center cursor-pointer hover:border-brand transition-colors relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-5 w-5 mx-auto mb-2 text-ink-muted" />
              <span className="text-[11px] text-ink block truncate">
                {selectedFile ? selectedFile.name : 'Select workbook...'}
              </span>
            </div>

            {/* Warning Alert Checkbox Gate */}
            {selectedFile && (
              <div className="rounded border border-warning/20 bg-warning/5 p-3.5 space-y-2">
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span className="text-[10px] text-warning leading-normal font-semibold">
                    Warning: Restoring will write rows onto your profile. Ensure columns match the template workbook precisely. Partial writes will not occur if validation encounters an error.
                  </span>
                </div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-rule accent-brass"
                  />
                  I authorize this database write
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={restoreLoading || !selectedFile || !confirmCheckbox}
              className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-brand-hover disabled:opacity-50 px-4 py-3 font-bold text-white transition-all cursor-pointer outline-none"
            >
              {restoreLoading ? 'Executing atomic restore...' : 'Restore from Backup'}
            </button>

          </form>
        </LedgerCard>

      </div>

    </div>
  );
};

export default Profile;
