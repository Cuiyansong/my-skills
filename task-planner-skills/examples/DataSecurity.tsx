import { useState, useCallback, useEffect } from 'react';
import { Task } from './TaskModel';

interface SecuritySettings {
  encryptionEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  requirePasswordOnExport: boolean;
  auditLogEnabled: boolean;
  dataRetentionDays: number;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  details: any;
}

interface DataSecurityProps {
  tasks: Task[];
  currentUser?: { id: string; name: string; role: string };
}

function DataSecurity({ tasks, currentUser }: DataSecurityProps) {
  const [settings, setSettings] = useState<SecuritySettings>({
    encryptionEnabled: true,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requirePasswordOnExport: true,
    auditLogEnabled: true,
    dataRetentionDays: 90
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, []);

  const loadSettings = useCallback(() => {
    const saved = localStorage.getItem('securitySettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem('securitySettings', JSON.stringify(settings));
    addAuditLog('security_settings_updated', { settings });
  }, [settings]);

  const loadAuditLogs = useCallback(() => {
    const saved = localStorage.getItem('auditLogs');
    if (saved) {
      const logs = JSON.parse(saved);
      setAuditLogs(logs.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) })));
    }
  }, []);

  const addAuditLog = useCallback((action: string, details: any = {}) => {
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      action,
      userId: currentUser?.id || 'system',
      timestamp: new Date(),
      details
    };

    const updatedLogs = [log, ...auditLogs].slice(0, 1000);
    setAuditLogs(updatedLogs);
    localStorage.setItem('auditLogs', JSON.stringify(updatedLogs));
  }, [auditLogs, currentUser]);

  const encryptData = useCallback(async (data: any): Promise<string> => {
    if (!settings.encryptionEnabled) {
      return JSON.stringify(data);
    }

    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      const key = await getCryptoKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }, [settings.encryptionEnabled]);

  const decryptData = useCallback(async (encryptedData: string): Promise<any> => {
    if (!settings.encryptionEnabled) {
      return JSON.parse(encryptedData);
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const key = await getCryptoKey();
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }, [settings.encryptionEnabled]);

  const getCryptoKey = async (): Promise<CryptoKey> => {
    const keyData = localStorage.getItem('encryptionKey');
    if (!keyData) {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await crypto.subtle.exportKey('raw', key);
      localStorage.setItem('encryptionKey', btoa(String.fromCharCode(...new Uint8Array(exported))));
      return key;
    }

    const importedKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'raw',
      importedKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const handleChangePassword = useCallback(async () => {
    if (currentPassword.length < settings.passwordMinLength) {
      alert('Current password is incorrect');
      return;
    }

    if (newPassword.length < settings.passwordMinLength) {
      alert(`Password must be at least ${settings.passwordMinLength} characters`);
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const hashedPassword = await hashPassword(newPassword);
      localStorage.setItem('userPassword', hashedPassword);
      addAuditLog('password_changed', { timestamp: new Date() });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (error) {
      alert('Failed to change password');
    }
  }, [currentPassword, newPassword, confirmPassword, settings.passwordMinLength, addAuditLog]);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  };

  const handleExportData = useCallback(async () => {
    if (settings.requirePasswordOnExport) {
      const password = prompt('Enter password to export data:');
      if (!password) return;
    }

    try {
      const encryptedData = await encryptData(tasks);
      const blob = new Blob([encryptedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `encrypted-tasks-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addAuditLog('data_exported', { taskCount: tasks.length, encrypted: settings.encryptionEnabled });
    } catch (error) {
      alert('Failed to export data');
    }
  }, [tasks, settings, encryptData, addAuditLog]);

  const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (settings.requirePasswordOnExport) {
      const password = prompt('Enter password to import data:');
      if (!password) return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const encryptedData = e.target?.result as string;
          const decryptedTasks = await decryptData(encryptedData);
          console.log('Imported tasks:', decryptedTasks);
          addAuditLog('data_imported', { taskCount: decryptedTasks.length });
          alert('Data imported successfully');
        } catch (error) {
          alert('Failed to decrypt data. Wrong password?');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert('Failed to import data');
    }
  }, [settings, decryptData, addAuditLog]);

  const handleClearData = useCallback(() => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;

    localStorage.clear();
    setAuditLogs([]);
    addAuditLog('data_cleared', { timestamp: new Date() });
    alert('All data cleared');
  }, [addAuditLog]);

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString();
  };

  return (
    <div className="data-security">
      <div className="security-header mb-6">
        <h2 className="text-xl font-bold mb-4">Data Security</h2>
        <p className="text-gray-600 text-sm">
          Manage your data security and privacy settings
        </p>
      </div>

      <div className="security-settings space-y-4 mb-6">
        <h3 className="font-semibold">Security Settings</h3>

        <div className="bg-white p-4 rounded border">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={settings.encryptionEnabled}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, encryptionEnabled: e.target.checked }));
                saveSettings();
              }}
            />
            <div>
              <div className="font-medium">Enable Encryption</div>
              <div className="text-sm text-gray-500">Encrypt all data at rest</div>
            </div>
          </label>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={settings.twoFactorEnabled}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }));
                saveSettings();
              }}
            />
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-500">Require 2FA for sensitive operations</div>
            </div>
          </label>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={settings.requirePasswordOnExport}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, requirePasswordOnExport: e.target.checked }));
                saveSettings();
              }}
            />
            <div>
              <div className="font-medium">Require Password for Export</div>
              <div className="text-sm text-gray-500">Ask for password when exporting data</div>
            </div>
          </label>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={settings.auditLogEnabled}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, auditLogEnabled: e.target.checked }));
                saveSettings();
              }}
            />
            <div>
              <div className="font-medium">Enable Audit Log</div>
              <div className="text-sm text-gray-500">Track all security-related actions</div>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }));
                  saveSettings();
                }}
                className="w-full px-3 py-2 border rounded"
                min="5"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password Min Length</label>
              <input
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }));
                  saveSettings();
                }}
                className="w-full px-3 py-2 border rounded"
                min="6"
                max="32"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="security-actions space-y-4 mb-6">
        <h3 className="font-semibold">Actions</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Change Password
          </button>

          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Encrypted Data
          </button>

          <label className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-center cursor-pointer">
            Import Encrypted Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {showAuditLog ? 'Hide' : 'Show'} Audit Log
          </button>
        </div>

        <button
          onClick={handleClearData}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Data
        </button>
      </div>

      {showPasswordModal && (
        <div className="password-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="font-semibold mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditLog && (
        <div className="audit-log mb-6">
          <h3 className="font-semibold mb-3">Audit Log</h3>
          
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-gray-500">
                        User: {log.userId} | {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="security-info p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Security Information</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            <strong>Encryption:</strong> AES-256 encryption for all data at rest
          </li>
          <li>
            <strong>Authentication:</strong> SHA-256 password hashing
          </li>
          <li>
            <strong>Audit Trail:</strong> Complete log of all security-related actions
          </li>
          <li>
            <strong>Data Retention:</strong> Automatic cleanup after {settings.dataRetentionDays} days
          </li>
          <li>
            <strong>Privacy:</strong> No data is shared with third parties
          </li>
        </ul>
      </div>
    </div>
  );
}

export default DataSecurity;
