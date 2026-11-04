import { useState, useCallback } from 'react';
import { Task, TaskStatus } from './TaskModel';

interface KanbanViewProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { status: 'completed', title: 'Completed', color: 'bg-green-100' },
  { status: 'archived', title: 'Archived', color: 'bg-gray-200' }
];

function KanbanView({ tasks, onTaskUpdate, onTaskDelete, onTaskClick }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onTaskUpdate?.(draggedTask.id, { status });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }, [draggedTask, onTaskUpdate]);

  const handleMoveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    onTaskUpdate?.(taskId, { status: newStatus });
  }, [onTaskUpdate]);

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

  const getTaskCount = (status: TaskStatus): number => {
    return getTasksByStatus(status).length;
  };

  return (
    <div className="kanban-view">
      <div className="kanban-header mb-4">
        <h2 className="text-xl font-bold">Kanban Board</h2>
        <p className="text-gray-600 text-sm">Drag and drop tasks to move them between columns</p>
      </div>

      <div className="kanban-board grid grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          const isDragOver = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              className={`
                kanban-column rounded-lg p-4 min-h-96
                ${column.color}
                ${isDragOver ? 'ring-2 ring-blue-500' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="column-header flex justify-between items-center mb-4">
                <h3 className="font-semibold">{column.title}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {getTaskCount(column.status)}
                </span>
              </div>

              <div className="task-list space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => onTaskClick?.(task)}
                      className={`
                        task-card p-3 bg-white rounded shadow-sm cursor-move
                        border-l-4 ${getPriorityColor(task.priority)}
                        hover:shadow-md transition-shadow
                      `}
                    >
                      <h4 className="font-medium text-sm mb-2">{task.title}</h4>

                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {task.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {columns
                            .filter(col => col.status !== task.status)
                            .map(col => (
                              <button
                                key={col.status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTask(task.id, col.status);
                                }}
                                className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
                                title={`Move to ${col.title}`}
                              >
                                →
                              </button>
                            ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete?.(task.id);
                            }}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {task.subtasks.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KanbanView;
