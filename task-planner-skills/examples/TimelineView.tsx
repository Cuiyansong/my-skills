import { useState, useMemo } from 'react';
import { Task } from './TaskModel';
import { format, startOfDay, endOfDay, eachHourOfInterval, isSameHour, isToday } from 'date-fns';

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const hours = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return eachHourOfInterval({ start, end });
  }, [selectedDate]);

  const tasksWithTime = useMemo(() => {
    return tasks.filter(task => task.dueDate && task.status !== 'completed' && task.status !== 'archived');
  }, [tasks]);

  const getTasksForHour = (hour: Date): Task[] => {
    return tasksWithTime.filter(task => 
      task.dueDate && isSameHour(task.dueDate, hour)
    );
  };

  const getTaskPosition = (task: Task): { top: number; height: number } => {
    if (!task.dueDate) return { top: 0, height: 60 };

    const hour = task.dueDate.getHours();
    const minute = task.dueDate.getMinutes();
    const top = hour * 60 + minute;
    const height = (task.estimatedHours || 1) * 60;

    return { top, height };
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      low: 'bg-gray-200 border-gray-400',
      medium: 'bg-blue-200 border-blue-400',
      high: 'bg-orange-200 border-orange-400',
      urgent: 'bg-red-200 border-red-400'
    };
    return colors[priority];
  };

  return (
    <div className="timeline-view">
      <div className="timeline-header mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {format(selectedDate, 'MMMM d, yyyy')}
            {isToday(selectedDate) && ' (Today)'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousDay}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ←
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {(['day', 'week'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded capitalize ${
                viewMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-container relative bg-white rounded border overflow-hidden">
        <div className="timeline-grid">
          {hours.map(hour => {
            const hourTasks = getTasksForHour(hour);
            const isCurrentHour = isToday(selectedDate) && isSameHour(hour, new Date());

            return (
              <div
                key={hour.toISOString()}
                className="timeline-hour relative border-b border-gray-200"
                style={{ height: '60px' }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-16 border-r border-gray-200 flex items-center justify-center text-sm font-medium ${isCurrentHour ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
                  {format(hour, 'HH:mm')}
                </div>

                {isCurrentHour && (
                  <div className="absolute left-16 right-0 top-0 h-0.5 bg-blue-500 z-10" />
                )}

                <div className="ml-16 h-full relative">
                  {hourTasks.map(task => {
                    const position = getTaskPosition(task);
                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`
                          absolute left-1 right-1 p-2 rounded border-2 cursor-pointer
                          ${getPriorityColor(task.priority)}
                          hover:shadow-md transition-shadow
                        `}
                        style={{
                          top: `${position.top % 60}px`,
                          height: `${Math.min(position.height, 60 - (position.top % 60))}px`
                        }}
                      >
                        <div className="text-sm font-medium truncate">{task.title}</div>
                        <div className="text-xs opacity-75">
                          {task.priority} | {format(task.dueDate!, 'HH:mm')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timeline-legend mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded" />
          <span className="text-sm">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded" />
          <span className="text-sm">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 border-2 border-orange-400 rounded" />
          <span className="text-sm">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border-2 border-red-400 rounded" />
          <span className="text-sm">Urgent</span>
        </div>
      </div>

      <div className="timeline-stats mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-600">Tasks Today</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasksWithTime.filter(t => t.dueDate && isSameDay(t.dueDate, selectedDate)).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Hours</div>
          <div className="text-2xl font-bold text-green-600">
            {tasksWithTime.reduce((sum, t) => sum + (t.estimatedHours || 0), 0).toFixed(1)}h
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <div className="text-sm text-gray-600">Urgent Tasks</div>
          <div className="text-2xl font-bold text-orange-600">
            {tasksWithTime.filter(t => t.priority === 'urgent').length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineView;
