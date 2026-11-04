import { useState, useMemo } from 'react';
import { Task, TaskModel } from './TaskModel';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
}

function CalendarView({ tasks, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(task.dueDate, 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      low: 'bg-gray-200 text-gray-700',
      medium: 'bg-blue-200 text-blue-700',
      high: 'bg-orange-200 text-orange-700',
      urgent: 'bg-red-200 text-red-700'
    };
    return colors[priority];
  };

  const getDayOfWeek = (date: Date): number => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const firstDayOfMonth = getDayOfWeek(daysInMonth[0]);

  return (
    <div className="calendar-view">
      <div className="calendar-header mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousMonth}
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
              onClick={handleNextMonth}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded capitalize ${
                viewMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="month-view">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-24 bg-gray-50 rounded" />
            ))}

            {daysInMonth.map(date => {
              const dayTasks = getTasksForDate(date);
              const isTodayDate = isToday(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`
                    min-h-24 p-1 rounded border cursor-pointer transition-all
                    ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isTodayDate ? 'text-blue-600' : ''}
                  `}>
                    {format(date, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate cursor-pointer
                          ${getPriorityColor(task.priority)}
                          ${task.status === 'completed' ? 'line-through opacity-60' : ''}
                        `}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="selected-date-tasks mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">
            Tasks for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {getTasksForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">No tasks for this date</p>
          ) : (
            <div className="space-y-2">
              {getTasksForDate(selectedDate).map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`p-2 rounded cursor-pointer ${getPriorityColor(task.priority)}`}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs opacity-75">
                    {task.status} | {task.priority}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarView;
