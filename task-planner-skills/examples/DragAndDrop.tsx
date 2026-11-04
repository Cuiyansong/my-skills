import { useState, useCallback, useRef } from 'react';
import { Task, TaskStatus } from './TaskModel';

interface DragAndDropProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, targetStatus: TaskStatus) => void;
  onTaskReorder?: (taskId: string, newIndex: number) => void;
}

function DragAndDrop({ tasks, onTaskMove, onTaskReorder }: DragAndDropProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverTask, setDragOverTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const columns: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: white;
      border: 2px solid #3B82F6;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      font-weight: 500;
    `;
    dragImage.textContent = task.title;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus, task?: Task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
    if (task) {
      setDragOverTask(task);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
      setDragOverTask(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus, targetTask?: Task) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    if (status !== draggedTask.status) {
      onTaskMove?.(draggedTask.id, status);
    }

    if (targetTask && targetTask.id !== draggedTask.id && targetTask.status === draggedTask.status) {
      const columnTasks = tasks.filter(t => t.status === status);
      const newIndex = columnTasks.findIndex(t => t.id === targetTask.id);
      onTaskReorder?.(draggedTask.id, newIndex);
    }

    setDraggedTask(null);
    setDragOverTask(null);
    setDragOverColumn(null);
    dragStartPos.current = null;
  }, [draggedTask, tasks, onTaskMove, onTaskReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverTask(null);
    setDragOverColumn(null);
    dragStartPos.current = null;
  }, []);

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      low: 'border-l-gray-400',
      medium: 'border-l-blue-400',
      high: 'border-l-orange-400',
      urgent: 'border-l-red-400'
    };
    return colors[priority];
  };

  const getPriorityBadge = (priority: Task['priority']): string => {
    const badges = {
      low: 'bg-gray-200 text-gray-700',
      medium: 'bg-blue-200 text-blue-700',
      high: 'bg-orange-200 text-orange-700',
      urgent: 'bg-red-200 text-red-700'
    };
    return badges[priority];
  };

  const getDropIndicator = (task: Task, index: number): 'top' | 'bottom' | null => {
    if (!draggedTask || !dragOverTask || draggedTask.status !== task.status) {
      return null;
    }

    if (dragOverTask.id === task.id) {
      const columnTasks = getTasksByStatus(task.status);
      const draggedIndex = columnTasks.findIndex(t => t.id === draggedTask.id);
      const targetIndex = columnTasks.findIndex(t => t.id === task.id);

      if (draggedIndex < targetIndex) {
        return 'bottom';
      } else {
        return 'top';
      }
    }

    return null;
  };

  return (
    <div className="drag-and-drop">
      <div className="dnd-header mb-6">
        <h2 className="text-xl font-bold mb-2">Drag and Drop</h2>
        <p className="text-gray-600 text-sm">
          Drag tasks between columns or reorder within a column
        </p>
      </div>

      <div className="kanban-board grid grid-cols-4 gap-4">
        {columns.map(status => {
          const columnTasks = getTasksByStatus(status);
          const isDragOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`
                kanban-column rounded-lg p-4 min-h-96
                ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50'}
              `}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="column-header flex justify-between items-center mb-4">
                <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {columnTasks.length}
                </span>
              </div>

              <div className="task-list space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task, index) => {
                    const dropIndicator = getDropIndicator(task, index);
                    const isDragging = draggedTask?.id === task.id;

                    return (
                      <div key={task.id}>
                        {dropIndicator === 'top' && (
                          <div className="h-1 bg-blue-500 rounded mb-1" />
                        )}

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, status, task)}
                          onDrop={(e) => handleDrop(e, status, task)}
                          className={`
                            task-card p-3 bg-white rounded shadow-sm cursor-move
                            border-l-4 ${getPriorityColor(task.priority)}
                            ${isDragging ? 'opacity-50' : 'hover:shadow-md'}
                            ${dragOverTask?.id === task.id ? 'ring-2 ring-blue-500' : ''}
                            transition-all
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {task.dueDate && (
                              <span>{task.dueDate.toLocaleDateString()}</span>
                            )}
                            {task.tags.length > 0 && (
                              <span>{task.tags.length} tags</span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            <span className="text-xs text-gray-400">Drag to move</span>
                          </div>
                        </div>

                        {dropIndicator === 'bottom' && (
                          <div className="h-1 bg-blue-500 rounded mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dnd-tips mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Drag tasks between columns to change their status</li>
          <li>• Drag tasks within a column to reorder them</li>
          <li>• Visual indicators show where the task will be dropped</li>
          <li>• Use keyboard shortcuts for accessibility (Tab to navigate, Space to drag)</li>
        </ul>
      </div>
    </div>
  );
}

export default DragAndDrop;
