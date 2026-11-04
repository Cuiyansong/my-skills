import { useState, useMemo } from 'react';
import { Task, TaskModel, TaskFilter } from './TaskModel';

interface TaskListProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
}

function TaskList({ tasks, onTaskSelect, onTaskUpdate, onTaskDelete }: TaskListProps) {
  const [filter, setFilter] = useState<TaskFilter>({});
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('priority');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter.status && !filter.status.includes(task.status)) return false;
      if (filter.priority && !filter.priority.includes(task.priority)) return false;
      if (filter.tags && filter.tags.length > 0 && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      if (filter.assigneeId && task.assigneeId !== filter.assigneeId) return false;
      if (filter.searchQuery && !task.title.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    if (sortBy === 'priority') {
      sorted.sort(TaskModel.compareByPriority);
    } else if (sortBy === 'dueDate') {
      sorted.sort(TaskModel.compareByDueDate);
    } else if (sortBy === 'createdAt') {
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return sorted;
  }, [filteredTasks, sortBy]);

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    onTaskUpdate?.(task.id, { status: newStatus });
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      onTaskDelete?.(taskId);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return colors[priority];
  };

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      todo: 'border-l-4 border-gray-300',
      in_progress: 'border-l-4 border-blue-500',
      completed: 'border-l-4 border-green-500',
      archived: 'border-l-4 border-gray-400'
    };
    return colors[status];
  };

  return (
    <div className="task-list">
      <div className="task-list-filters mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter.searchQuery || ''}
          onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
          className="px-3 py-2 border rounded mr-2"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded"
        >
          <option value="priority">Sort by Priority</option>
          <option value="dueDate">Sort by Due Date</option>
          <option value="createdAt">Sort by Created Date</option>
        </select>
      </div>

      <div className="task-list-container space-y-2">
        {sortedTasks.map(task => (
          <div
            key={task.id}
            onClick={() => onTaskSelect?.(task)}
            className={`task-item p-4 bg-white rounded shadow-sm hover:shadow-md cursor-pointer ${getStatusColor(task.status)} ${TaskModel.isOverdue(task) ? 'bg-red-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-sm text-gray-500">
                      Due: {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                  {task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                  className="px-2 py-1 text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found
        </div>
      )}
    </div>
  );
}

export default TaskList;
