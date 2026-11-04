import { useState, useMemo, useRef, useEffect } from 'react';
import { Task } from './TaskModel';
import { format, differenceInDays, addDays, startOfDay, endOfDay } from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskResize?: (taskId: string, startDate: Date, endDate: Date) => void;
}

function GanttChart({ tasks, onTaskClick, onTaskResize }: GanttChartProps) {
  const [viewStartDate, setViewStartDate] = useState(() => {
    const now = new Date();
    return addDays(startOfDay(now), -7);
  });
  const [viewDays, setViewDays] = useState(30);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [resizingTask, setResizingTask] = useState<Task | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const viewEndDate = useMemo(() => {
    return addDays(viewStartDate, viewDays);
  }, [viewStartDate, viewDays]);

  const daysInView = useMemo(() => {
    const days = [];
    let current = new Date(viewStartDate);
    while (current <= viewEndDate) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  }, [viewStartDate, viewEndDate]);

  const tasksWithDates = useMemo(() => {
    return tasks
      .filter(task => task.dueDate && task.status !== 'completed' && task.status !== 'archived')
      .map(task => {
        const startDate = task.createdAt;
        const endDate = task.dueDate;
        const duration = differenceInDays(endDate, startDate) + 1;
        return { ...task, startDate, endDate, duration };
      })
      .filter(task => task.endDate >= viewStartDate && task.startDate <= viewEndDate);
  }, [tasks, viewStartDate, viewEndDate]);

  const getTaskPosition = (task: Task & { startDate: Date; endDate: Date; duration: number }) => {
    const startOffset = differenceInDays(task.startDate, viewStartDate);
    const left = (startOffset / viewDays) * 100;
    const width = (task.duration / viewDays) * 100;
    return { left, width };
  };

  const handleMouseDown = (e: React.MouseEvent, task: Task & { startDate: Date; endDate: Date; duration: number }, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    setDragStartX(e.clientX);
    
    if (type === 'move') {
      setDraggingTask(task);
    } else {
      setResizingTask(task);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaDays = Math.round((deltaX / containerRect.width) * viewDays);

      if (draggingTask) {
        const newStartDate = addDays(draggingTask.startDate, deltaDays);
        const newEndDate = addDays(draggingTask.endDate, deltaDays);
        onTaskResize?.(draggingTask.id, newStartDate, newEndDate);
      } else if (resizingTask) {
        const newEndDate = addDays(resizingTask.endDate, deltaDays);
        onTaskResize?.(resizingTask.id, resizingTask.startDate, newEndDate);
      }
    };

    const handleMouseUp = () => {
      setDraggingTask(null);
      setResizingTask(null);
    };

    if (draggingTask || resizingTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTask, resizingTask, dragStartX, viewDays, onTaskResize]);

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      low: 'bg-gray-400',
      medium: 'bg-blue-400',
      high: 'bg-orange-400',
      urgent: 'bg-red-400'
    };
    return colors[priority];
  };

  const handleZoomIn = () => {
    setViewDays(Math.max(7, viewDays - 7));
  };

  const handleZoomOut = () => {
    setViewDays(Math.min(90, viewDays + 7));
  };

  const handleScrollLeft = () => {
    setViewStartDate(addDays(viewStartDate, -7));
  };

  const handleScrollRight = () => {
    setViewStartDate(addDays(viewStartDate, 7));
  };

  return (
    <div className="gantt-chart">
      <div className="gantt-header mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gantt Chart</h2>
          <div className="flex gap-2">
            <button
              onClick={handleScrollLeft}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ←
            </button>
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              +
            </button>
            <span className="px-3 py-1">{viewDays} days</span>
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              -
            </button>
            <button
              onClick={handleScrollRight}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {format(viewStartDate, 'MMM d')} - {format(viewEndDate, 'MMM d, yyyy')}
        </div>
      </div>

      <div className="gantt-container bg-white rounded border overflow-hidden" ref={containerRef}>
        <div className="gantt-timeline">
          <div className="timeline-header grid" style={{ gridTemplateColumns: `200px repeat(${viewDays}, minmax(40px, 1fr))` }}>
            <div className="p-2 border-b border-r bg-gray-50 font-medium sticky left-0 z-10">
              Task
            </div>
            {daysInView.map(day => (
              <div
                key={day.toISOString()}
                className={`
                  p-2 border-b border-r text-center text-xs
                  ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100' : ''}
                `}
              >
                <div>{format(day, 'd')}</div>
                <div className="text-gray-500">{format(day, 'EEE')}</div>
              </div>
            ))}
          </div>

          <div className="timeline-body">
            {tasksWithDates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tasks in this time range
              </div>
            ) : (
              tasksWithDates.map((task, index) => {
                const position = getTaskPosition(task);
                const isDragging = draggingTask?.id === task.id;
                const isResizing = resizingTask?.id === task.id;

                return (
                  <div
                    key={task.id}
                    className="timeline-row grid border-b"
                    style={{ gridTemplateColumns: `200px repeat(${viewDays}, minmax(40px, 1fr))` }}
                  >
                    <div className="p-2 border-r bg-white sticky left-0 z-10">
                      <div className="font-medium text-sm truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">
                        {task.duration}d | {task.priority}
                      </div>
                    </div>

                    <div className="col-span-full relative h-12">
                      <div
                        className={`
                          absolute top-2 h-8 rounded cursor-move flex items-center px-2
                          ${getPriorityColor(task.priority)}
                          ${isDragging || isResizing ? 'opacity-80' : 'hover:opacity-90'}
                        `}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {task.title}
                        </span>
                        
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                          onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                          onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="gantt-legend mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded" />
          <span className="text-sm">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded" />
          <span className="text-sm">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 rounded" />
          <span className="text-sm">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded" />
          <span className="text-sm">Urgent</span>
        </div>
      </div>

      <div className="gantt-stats mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-600">Tasks in View</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasksWithDates.length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Duration</div>
          <div className="text-2xl font-bold text-green-600">
            {tasksWithDates.reduce((sum, t) => sum + t.duration, 0)} days
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <div className="text-sm text-gray-600">Overdue Tasks</div>
          <div className="text-2xl font-bold text-orange-600">
            {tasksWithDates.filter(t => t.endDate < new Date()).length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GanttChart;
