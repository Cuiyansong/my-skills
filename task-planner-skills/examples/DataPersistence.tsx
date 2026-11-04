import { useState, useEffect, useCallback } from 'react';
import { Task } from './TaskModel';

type StorageType = 'local' | 'indexedDB' | 'remote';

interface DataPersistenceProps {
  tasks: Task[];
  onTasksLoad?: (tasks: Task[]) => void;
  onError?: (error: Error) => void;
}

function DataPersistence({ tasks, onTasksLoad, onError }: DataPersistenceProps) {
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [storageStats, setStorageStats] = useState({ used: 0, quota: 0 });

  const saveToLocalStorage = useCallback(async (data: Task[]): Promise<void> => {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem('tasks', serialized);
      setLastSyncTime(new Date());
    } catch (error) {
      throw new Error('Failed to save to localStorage: ' + (error as Error).message);
    }
  }, []);

  const loadFromLocalStorage = useCallback(async (): Promise<Task[]> => {
    try {
      const serialized = localStorage.getItem('tasks');
      if (!serialized) return [];
      return JSON.parse(serialized);
    } catch (error) {
      throw new Error('Failed to load from localStorage: ' + (error as Error).message);
    }
  }, []);

  const saveToIndexedDB = useCallback(async (data: Task[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TaskPlannerDB', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');

        store.clear();
        data.forEach(task => store.add(task));

        transaction.oncomplete = () => {
          setLastSyncTime(new Date());
          resolve();
        };
        transaction.onerror = () => reject(new Error('Failed to save to IndexedDB'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
      };
    });
  }, []);

  const loadFromIndexedDB = useCallback(async (): Promise<Task[]> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TaskPlannerDB', 1);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(new Error('Failed to load from IndexedDB'));
      };
    });
  }, []);

  const saveToRemote = useCallback(async (data: Task[]): Promise<void> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save to remote server');
      }

      setLastSyncTime(new Date());
    } catch (error) {
      throw new Error('Failed to save to remote: ' + (error as Error).message);
    }
  }, []);

  const loadFromRemote = useCallback(async (): Promise<Task[]> => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to load from remote server');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Failed to load from remote: ' + (error as Error).message);
    }
  }, []);

  const saveData = useCallback(async () => {
    setIsSyncing(true);
    try {
      switch (storageType) {
        case 'local':
          await saveToLocalStorage(tasks);
          break;
        case 'indexedDB':
          await saveToIndexedDB(tasks);
          break;
        case 'remote':
          await saveToRemote(tasks);
          break;
      }
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [tasks, storageType, saveToLocalStorage, saveToIndexedDB, saveToRemote, onError]);

  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      let loadedTasks: Task[] = [];
      switch (storageType) {
        case 'local':
          loadedTasks = await loadFromLocalStorage();
          break;
        case 'indexedDB':
          loadedTasks = await loadFromIndexedDB();
          break;
        case 'remote':
          loadedTasks = await loadFromRemote();
          break;
      }
      onTasksLoad?.(loadedTasks);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [storageType, loadFromLocalStorage, loadFromIndexedDB, loadFromRemote, onTasksLoad, onError]);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  const importData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTasks = JSON.parse(e.target?.result as string);
        onTasksLoad?.(importedTasks);
      } catch (error) {
        onError?.(new Error('Failed to parse imported file'));
      }
    };
    reader.readAsText(file);
  }, [onTasksLoad, onError]);

  const clearData = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;

    setIsSyncing(true);
    try {
      switch (storageType) {
        case 'local':
          localStorage.removeItem('tasks');
          break;
        case 'indexedDB':
          const request = indexedDB.deleteDatabase('TaskPlannerDB');
          await new Promise((resolve) => request.onsuccess = resolve);
          break;
        case 'remote':
          await fetch('/api/tasks', { method: 'DELETE' });
          break;
      }
      onTasksLoad?.([]);
      setLastSyncTime(new Date());
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [storageType, onTasksLoad, onError]);

  useEffect(() => {
    if (storageType === 'local') {
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          setStorageStats({ used: usage, quota: quota || 0 });
        });
      }
    }
  }, [storageType]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="data-persistence">
      <div className="persistence-header mb-6">
        <h2 className="text-xl font-bold mb-4">Data Persistence</h2>

        <div className="storage-selector mb-4">
          <label className="block text-sm font-medium mb-2">Storage Type</label>
          <div className="flex gap-2">
            {(['local', 'indexedDB', 'remote'] as StorageType[]).map(type => (
              <button
                key={type}
                onClick={() => setStorageType(type)}
                className={`px-4 py-2 rounded capitalize ${
                  storageType === type ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {type === 'local' ? 'Local Storage' : type === 'indexedDB' ? 'IndexedDB' : 'Remote Server'}
              </button>
            ))}
          </div>
        </div>

        <div className="sync-info mb-4 p-4 bg-gray-50 rounded">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Last Sync</div>
              <div className="font-medium">
                {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Tasks</div>
              <div className="font-medium">{tasks.length}</div>
            </div>
          </div>
          {storageType === 'local' && storageStats.quota > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Storage: {formatBytes(storageStats.used)} / {formatBytes(storageStats.quota)}
            </div>
          )}
        </div>
      </div>

      <div className="persistence-actions space-y-3">
        <div className="flex gap-2">
          <button
            onClick={saveData}
            disabled={isSyncing}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Save Data'}
          </button>
          <button
            onClick={loadData}
            disabled={isSyncing}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSyncing ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        <div className="border-t pt-3">
          <h3 className="font-semibold mb-2">Import / Export</h3>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Export JSON
            </button>
            <label className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-center cursor-pointer">
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="border-t pt-3">
          <button
            onClick={clearData}
            disabled={isSyncing}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Clear All Data
          </button>
        </div>
      </div>

      <div className="persistence-info mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Storage Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Local Storage:</strong> Simple key-value storage, ~5-10MB limit
          </div>
          <div>
            <strong>IndexedDB:</strong> Structured data storage, much larger capacity
          </div>
          <div>
            <strong>Remote Server:</strong> Cloud storage, requires backend API
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPersistence;
