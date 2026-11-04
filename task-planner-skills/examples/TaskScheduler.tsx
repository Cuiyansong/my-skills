import { useState, useMemo, useCallback } from 'react';
import { Task, TaskModel, TaskPriority } from './TaskModel';

interface ScheduledTask extends Task {
  scheduledStart?: Date;
  scheduledEnd?: Date;
  conflicts: string[];
}

interface ScheduleConfig {
  workHoursStart: number;
  workHoursEnd: number;
  workDays: number[];
  breakDuration: number;
  bufferTime: number;
}

interface TaskSchedulerProps {
  tasks: Task[];
  onScheduleUpdate?: (scheduledTasks: ScheduledTask[]) => void;
  config?: Partial<ScheduleConfig>;
}

const defaultConfig: ScheduleConfig = {
  workHoursStart: 9,
  workHoursEnd: 17,
  workDays: [1, 2, 3, 4, 5],
  breakDuration: 60,
  bufferTime: 15
};

function TaskScheduler({ tasks, onScheduleUpdate, config = {} }: TaskSchedulerProps) {
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({ ...defaultConfig, ...config });
  const [startDate, setStartDate] = useState(new Date());

  const isWorkDay = useCallback((date: Date): boolean => {
    return scheduleConfig.workDays.includes(date.getDay());
  }, [scheduleConfig.workDays]);

  const isWorkTime = useCallback((date: Date): boolean => {
    const hour = date.getHours();
    return hour >= scheduleConfig.workHoursStart && hour < scheduleConfig.workHoursEnd;
  }, [scheduleConfig.workHoursStart, scheduleConfig.workHoursEnd]);

  const findNextAvailableSlot = useCallback((duration: number, afterDate: Date): Date => {
    let currentDate = new Date(afterDate);
    currentDate.setMinutes(currentDate.getMinutes() + scheduleConfig.bufferTime);

    while (true) {
      if (!isWorkDay(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(scheduleConfig.workHoursStart, 0, 0, 0);
        continue;
      }

      if (!isWorkTime(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(scheduleConfig.workHoursStart, 0, 0, 0);
        continue;
      }

      const workDayEnd = new Date(currentDate);
      workDayEnd.setHours(scheduleConfig.workHoursEnd, 0, 0, 0);

      const potentialEnd = new Date(currentDate);
      potentialEnd.setMinutes(potentialEnd.getMinutes() + duration);

      if (potentialEnd <= workDayEnd) {
        return currentDate;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(scheduleConfig.workHoursStart, 0, 0, 0);
    }
  }, [isWorkDay, isWorkTime, scheduleConfig]);

  const detectConflicts = useCallback((taskA: Task, taskB: Task): boolean => {
    if (!taskA.scheduledStart || !taskA.scheduledEnd || !taskB.scheduledStart || !taskB.scheduledEnd) {
      return false;
    }
    return taskA.scheduledStart < taskB.scheduledEnd && taskB.scheduledStart < taskA.scheduledEnd;
  }, []);

  const scheduleTasks = useMemo(() => {
    const pendingTasks = tasks
      .filter(task => task.status !== 'completed' && task.status !== 'archived')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return TaskModel.getPriorityValue(b.priority) - TaskModel.getPriorityValue(a.priority);
      });

    const scheduled: ScheduledTask[] = [];
    let lastScheduledEnd = startDate;

    pendingTasks.forEach(task => {
      const duration = (task.estimatedHours || 1) * 60 * 60 * 1000;
      const scheduledStart = findNextAvailableSlot(duration, lastScheduledEnd);
      const scheduledEnd = new Date(scheduledStart.getTime() + duration);

      const conflicts: string[] = [];
      scheduled.forEach(scheduledTask => {
        if (detectConflicts({ ...task, scheduledStart, scheduledEnd }, scheduledTask)) {
          conflicts.push(scheduledTask.id);
        }
      });

      scheduled.push({
        ...task,
        scheduledStart,
        scheduledEnd,
        conflicts
      });

      lastScheduledEnd = scheduledEnd;
    });

    return scheduled;
  }, [tasks, startDate, findNextAvailableSlot, detectConflicts]);

  const getPriorityColor = (priority: TaskPriority): string => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return colors[priority];
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleReschedule = () => {
    setStartDate(new Date());
  };

  const handleConfigChange = (key: keyof ScheduleConfig, value: any) => {
    setScheduleConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="task-scheduler">
      <div className="scheduler-header mb-6">
        <h2 className="text-xl font-bold mb-4">Task Scheduler</h2>
        
        <div className="scheduler-config bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Schedule Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Work Hours</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={scheduleConfig.workHoursStart}
                  onChange={(e) => handleConfigChange('workHoursStart', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                  min="0"
                  max="23"
                />
                <span>to</span>
                <input
                  type="number"
                  value={scheduleConfig.workHoursEnd}
                  onChange={(e) => handleConfigChange('workHoursEnd', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                  min="0"
                  max="23"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Buffer Time (min)</label>
              <input
                type="number"
                value={scheduleConfig.bufferTime}
                onChange={(e) => handleConfigChange('bufferTime', parseInt(e.target.value))}
                className="w-24 px-2 py-1 border rounded"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReschedule}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reschedule Tasks
          </button>
          <button
            onClick={() => onScheduleUpdate?.(scheduleTasks)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Apply Schedule
          </button>
        </div>
      </div>

      <div className="scheduled-tasks space-y-3">
        {scheduleTasks.map(task => (
          <div
            key={task.id}
            className={`scheduled-task p-4 rounded border-2 ${
              task.conflicts.length > 0 ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{task.title}</h4>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      Due: {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {task.scheduledStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500">
                  {task.scheduledStart?.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Duration: {formatDuration((task.estimatedHours || 1) * 60 * 60 * 1000)}
              </span>
              {task.conflicts.length > 0 && (
                <span className="text-red-600 text-sm">
                  ⚠️ {task.conflicts.length} conflict(s)
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
            )}
          </div>
        ))}
      </div>

      {scheduleTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No pending tasks to schedule
        </div>
      )}
    </div>
  );
}

export default TaskScheduler;
