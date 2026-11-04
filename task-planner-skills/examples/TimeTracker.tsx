import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from './TaskModel';

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
}

interface TimeTrackerProps {
  tasks: Task[];
  onTimeEntryAdd?: (entry: TimeEntry) => void;
  onTimeEntryUpdate?: (entryId: string, updates: Partial<TimeEntry>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

function TimeTracker({ tasks, onTimeEntryAdd, onTimeEntryUpdate, onTaskUpdate }: TimeTrackerProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTaskId && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTaskId, startTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleStartTracking = useCallback((taskId: string) => {
    if (activeTaskId) {
      handleStopTracking();
    }
    setActiveTaskId(taskId);
    setStartTime(new Date());
    setElapsedTime(0);
  }, [activeTaskId]);

  const handleStopTracking = useCallback(() => {
    if (!activeTaskId || !startTime) return;

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const newEntry: TimeEntry = {
      id: `entry_${Date.now()}`,
      taskId: activeTaskId,
      startTime,
      endTime,
      duration
    };

    setTimeEntries(prev => [newEntry, ...prev]);
    onTimeEntryAdd?.(newEntry);

    const task = tasks.find(t => t.id === activeTaskId);
    if (task) {
      const newActualHours = (task.actualHours || 0) + duration / (1000 * 60 * 60);
      onTaskUpdate?.(activeTaskId, { actualHours: newActualHours });
    }

    setActiveTaskId(null);
    setStartTime(null);
    setElapsedTime(0);
  }, [activeTaskId, startTime, tasks, onTimeEntryAdd, onTaskUpdate]);

  const handleDiscardTracking = useCallback(() => {
    setActiveTaskId(null);
    setStartTime(null);
    setElapsedTime(0);
  }, []);

  const getTaskStats = useCallback((taskId: string) => {
    const entries = timeEntries.filter(e => e.taskId === taskId);
    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const sessionCount = entries.length;
    return { totalTime, sessionCount };
  }, [timeEntries]);

  const getOverallStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = timeEntries.filter(e => e.startTime >= today);
    const todayTime = todayEntries.reduce((sum, e) => sum + e.duration, 0);

    const weekEntries = timeEntries.filter(e => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return e.startTime >= weekAgo;
    });
    const weekTime = weekEntries.reduce((sum, e) => sum + e.duration, 0);

    const totalTime = timeEntries.reduce((sum, e) => sum + e.duration, 0);

    return { todayTime, weekTime, totalTime };
  }, [timeEntries]);

  const overallStats = getOverallStats();

  return (
    <div className="time-tracker">
      <div className="tracker-header mb-6">
        <h2 className="text-xl font-bold mb-4">Time Tracker</h2>

        <div className="stats-grid grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm text-gray-600">Today</div>
            <div className="text-2xl font-bold text-blue-600">{formatDuration(overallStats.todayTime)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-sm text-gray-600">This Week</div>
            <div className="text-2xl font-bold text-green-600">{formatDuration(overallStats.weekTime)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-purple-600">{formatDuration(overallStats.totalTime)}</div>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {activeTaskId && (
        <div className="active-tracking bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm opacity-80">Currently tracking</div>
              <div className="text-xl font-bold">
                {tasks.find(t => t.id === activeTaskId)?.title}
              </div>
            </div>
            <div className="text-4xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStopTracking}
              className="flex-1 px-4 py-2 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
            >
              Stop
            </button>
            <button
              onClick={handleDiscardTracking}
              className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="task-list">
        <h3 className="font-semibold mb-3">Tasks</h3>
        
        {tasks.filter(task => task.status !== 'completed' && task.status !== 'archived').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active tasks
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .filter(task => task.status !== 'completed' && task.status !== 'archived')
              .map(task => {
                const stats = getTaskStats(task.id);
                const isActive = activeTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`task-item p-4 rounded border-2 ${
                      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          {task.estimatedHours && (
                            <span>Est: {task.estimatedHours}h</span>
                          )}
                          {task.actualHours && (
                            <span className="ml-2">Act: {task.actualHours.toFixed(1)}h</span>
                          )}
                          {stats.sessionCount > 0 && (
                            <span className="ml-2">Sessions: {stats.sessionCount}</span>
                          )}
                        </div>
                      </div>
                      {isActive ? (
                        <div className="text-2xl font-mono font-bold text-blue-600">
                          {formatTime(elapsedTime)}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartTracking(task.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Start
                        </button>
                      )}
                    </div>

                    {stats.totalTime > 0 && (
                      <div className="text-sm text-gray-600">
                        Total tracked: {formatDuration(stats.totalTime)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {showHistory && (
        <div className="history mt-6">
          <h3 className="font-semibold mb-3">Time History</h3>
          
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No time entries yet
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.map(entry => {
                const task = tasks.find(t => t.id === entry.taskId);
                return (
                  <div key={entry.id} className="entry p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{task?.title || 'Unknown Task'}</div>
                        <div className="text-sm text-gray-500">
                          {entry.startTime.toLocaleString()} - {entry.endTime?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatDuration(entry.duration)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeTracker;
