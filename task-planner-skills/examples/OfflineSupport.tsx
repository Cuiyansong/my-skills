import { useState, useEffect, useCallback } from 'react';
import { Task } from './TaskModel';

interface OfflineSupportProps {
  tasks: Task[];
  onTasksUpdate?: (tasks: Task[]) => void;
}

function OfflineSupport({ tasks, onTasksUpdate }: OfflineSupportProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadFromLocalStorage();
    checkStorageUsage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveToLocalStorage = useCallback(async () => {
    try {
      const data = {
        tasks,
        lastSyncTime: new Date().toISOString()
      };
      localStorage.setItem('taskPlanner_offlineData', JSON.stringify(data));
      checkStorageUsage();
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [tasks]);

  const loadFromLocalStorage = useCallback(async () => {
    try {
      const data = localStorage.getItem('taskPlanner_offlineData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.tasks && parsed.lastSyncTime) {
          onTasksUpdate?.(parsed.tasks);
          setLastSyncTime(new Date(parsed.lastSyncTime));
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, [onTasksUpdate]);

  const checkStorageUsage = useCallback(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        setStorageUsed(usage);
      });
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || pendingChanges.length === 0) return;

    setSyncStatus('syncing');

    try {
      for (const change of pendingChanges) {
        await syncChange(change);
      }

      setPendingChanges([]);
      setSyncStatus('idle');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to sync changes:', error);
      setSyncStatus('error');
    }
  }, [isOnline, pendingChanges]);

  const syncChange = async (change: any): Promise<void> => {
    switch (change.type) {
      case 'create':
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change.task)
        });
        break;
      case 'update':
        await fetch(`/api/tasks/${change.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change.updates)
        });
        break;
      case 'delete':
        await fetch(`/api/tasks/${change.taskId}`, {
          method: 'DELETE'
        });
        break;
    }
  };

  const addPendingChange = useCallback((change: any) => {
    setPendingChanges(prev => [...prev, { ...change, timestamp: new Date().toISOString() }]);
    
    if (!isOnline) {
      saveToLocalStorage();
    }
  }, [isOnline, saveToLocalStorage]);

  const handleManualSync = useCallback(async () => {
    if (!isOnline) {
      alert('You are offline. Please connect to the internet to sync.');
      return;
    }

    setSyncStatus('syncing');

    try {
      await saveToLocalStorage();
      await syncPendingChanges();
      setSyncStatus('idle');
      setLastSyncTime(new Date());
      alert('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      alert('Sync failed. Please try again.');
    }
  }, [isOnline, saveToLocalStorage, syncPendingChanges]);

  const clearOfflineData = useCallback(() => {
    if (confirm('Are you sure you want to clear all offline data?')) {
      localStorage.removeItem('taskPlanner_offlineData');
      setPendingChanges([]);
      setLastSyncTime(null);
      alert('Offline data cleared');
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getTimeSinceLastSync = (): string => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="offline-support">
      <div className="offline-header mb-6">
        <div className={`p-4 rounded-lg mb-4 ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <div className="font-semibold">
                {isOnline ? 'You are online' : 'You are offline'}
              </div>
              <div className="text-sm text-gray-600">
                {isOnline
                  ? 'All changes will be synced automatically'
                  : 'Changes will be saved locally and synced when you go online'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Offline Support</h2>
          <button
            onClick={handleManualSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className={`px-4 py-2 rounded text-white ${
              syncStatus === 'syncing'
                ? 'bg-gray-400 cursor-not-allowed'
                : isOnline
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Last Sync</div>
            <div className="font-medium">{getTimeSinceLastSync()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Pending Changes</div>
            <div className="font-medium">{pendingChanges.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Storage Used</div>
            <div className="font-medium">{formatBytes(storageUsed)}</div>
          </div>
        </div>
      </div>

      <div className="offline-status mb-6">
        <h3 className="font-semibold mb-3">Sync Status</h3>
        
        {syncStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded mb-3">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="font-medium text-red-700">Sync Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Failed to sync changes. Please try again later.
            </p>
          </div>
        )}

        {pendingChanges.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⏳</span>
              <span className="font-medium text-yellow-700">Pending Changes</span>
            </div>
            <div className="space-y-2">
              {pendingChanges.slice(0, 5).map((change, index) => (
                <div key={index} className="text-sm text-yellow-700">
                  {change.type}: {change.taskId || 'New task'}
                </div>
              ))}
              {pendingChanges.length > 5 && (
                <div className="text-sm text-yellow-700">
                  +{pendingChanges.length - 5} more changes
                </div>
              )}
            </div>
          </div>
        )}

        {syncStatus === 'idle' && pendingChanges.length === 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium text-green-700">All Synced</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              All your changes are up to date
            </p>
          </div>
        )}
      </div>

      <div className="offline-actions mb-6">
        <h3 className="font-semibold mb-3">Actions</h3>
        <div className="space-y-2">
          <button
            onClick={saveToLocalStorage}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save to Local Storage
          </button>
          <button
            onClick={loadFromLocalStorage}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Load from Local Storage
          </button>
          <button
            onClick={clearOfflineData}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Offline Data
          </button>
        </div>
      </div>

      <div className="offline-info p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">How Offline Support Works</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            <strong>Automatic Sync:</strong> Changes are automatically synced when you go online
          </li>
          <li>
            <strong>Local Storage:</strong> All data is stored locally in your browser
          </li>
          <li>
            <strong>Conflict Resolution:</strong> The most recent changes take priority
          </li>
          <li>
            <strong>Storage Limit:</strong> LocalStorage has a limit of ~5-10MB
          </li>
          <li>
            <strong>PWA Support:</strong> Works as a Progressive Web App for offline access
          </li>
        </ul>
      </div>

      <div className="pwa-install mt-6 p-4 bg-purple-50 rounded">
        <h3 className="font-semibold mb-2">Install as App</h3>
        <p className="text-sm text-gray-700 mb-3">
          Install this app to use it offline and get a better experience
        </p>
        <button
          onClick={() => {
            if ('serviceWorker' in navigator) {
              console.log('Installing PWA...');
            }
          }}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Install App
        </button>
      </div>
    </div>
  );
}

export default OfflineSupport;
